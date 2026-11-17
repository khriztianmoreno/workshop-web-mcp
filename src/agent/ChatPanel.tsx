import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { ChatMessage, FunctionCallPart, HealthResponse } from '../../shared/agent-protocol';
import { DEMO_PROMPT_LABELS, DEMO_PROMPTS, type DemoPromptKey } from '../../shared/demo-prompts';
import { reportAgentToolCall } from '../webmcp/activity';
import type { RegisteredTool } from '../webmcp/types';
import { runAgentTurn, type ToolCallEvent } from './agent-loop';
import { getHealth, postChat } from './api';

type ChatItem =
  | { kind: 'user'; id: string; text: string }
  | { kind: 'assistant'; id: string; text: string }
  | { kind: 'tool'; id: string; event: ToolCallEvent }
  | { kind: 'error'; id: string; text: string };

interface PendingGuard {
  call: FunctionCallPart;
  tool: RegisteredTool;
  resolve: (allowed: boolean) => void;
}

let itemSequence = 0;
const nextId = () => `item-${++itemSequence}`;

function useRegisteredTools(): RegisteredTool[] {
  const [tools, setTools] = useState<RegisteredTool[]>([]);
  useEffect(() => {
    const modelContext = document.modelContext ?? navigator.modelContext;
    if (!modelContext) return;
    let active = true;
    const refresh = () => {
      modelContext.getTools().then((list) => active && setTools(list), () => active && setTools([]));
    };
    refresh();
    modelContext.addEventListener('toolchange', refresh);
    return () => {
      active = false;
      modelContext.removeEventListener('toolchange', refresh);
    };
  }, []);
  return tools;
}

function formatJson(value: unknown): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

const STATUS_LABEL: Record<ToolCallEvent['status'], string> = {
  'awaiting-confirmation': 'Esperando confirmación',
  running: 'Ejecutando…',
  done: 'Completado',
  error: 'Error',
  declined: 'Rechazado',
};

function ToolCallCard({ event }: { event: ToolCallEvent }) {
  return (
    <details className={`tool-call tool-call--${event.status}`}>
      <summary>
        <span className="tool-call__icon" aria-hidden="true">
          ⚙
        </span>
        <code>{event.name}</code>
        <span className="tool-call__status">{STATUS_LABEL[event.status]}</span>
        {event.untrusted ? <span className="tool-call__untrusted">contenido no confiable</span> : null}
      </summary>
      <div className="tool-call__body">
        <p className="tool-call__label">Argumentos</p>
        <pre>{formatJson(event.args)}</pre>
        {event.result !== undefined ? (
          <>
            <p className="tool-call__label">Resultado</p>
            <pre>{formatJson(event.result)}</pre>
          </>
        ) : null}
      </div>
    </details>
  );
}

export function ChatPanel({ onClose }: { onClose: () => void }) {
  const tools = useRegisteredTools();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [guard, setGuard] = useState<PendingGuard | null>(null);
  const history = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal).then(setHealth, (error: unknown) => {
      if (!controller.signal.aborted) setHealthError(error instanceof Error ? error.message : String(error));
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [items, guard]);

  const upsertToolEvent = useCallback((event: ToolCallEvent) => {
    setItems((current) => {
      const index = current.findIndex((item) => item.kind === 'tool' && item.event.callKey === event.callKey);
      if (index === -1) return [...current, { kind: 'tool', id: nextId(), event }];
      const next = [...current];
      next[index] = { kind: 'tool', id: current[index].id, event };
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const modelContext = document.modelContext ?? navigator.modelContext;
      if (!text.trim() || busy || !modelContext) return;
      setInput('');
      setBusy(true);
      setItems((current) => [...current, { kind: 'user', id: nextId(), text }]);
      history.current.push({ role: 'user', text });
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await runAgentTurn({
          modelContext,
          history: history.current,
          sendChat: postChat,
          signal: controller.signal,
          confirmTool: (call, tool) =>
            new Promise<boolean>((resolve) => {
              controller.signal.addEventListener('abort', () => resolve(false), { once: true });
              setGuard({ call, tool, resolve });
            }),
          onModelText: (reply) => setItems((current) => [...current, { kind: 'assistant', id: nextId(), text: reply }]),
          onToolCall: upsertToolEvent,
          beforeExecute: (call) => reportAgentToolCall(call.name, call.args ?? {}),
        });
      } catch (error) {
        const message = controller.signal.aborted ? 'Detuviste al agente.' : error instanceof Error ? error.message : String(error);
        setItems((current) => [...current, { kind: 'error', id: nextId(), text: message }]);
        // Keep history consistent: drop a dangling model turn with unanswered calls.
        const last = history.current.at(-1);
        if (last?.role === 'model' && last.functionCalls?.length) history.current.pop();
      } finally {
        setBusy(false);
        setGuard(null);
        abortRef.current = null;
      }
    },
    [busy, upsertToolEvent],
  );

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void send(input);
  };

  const resolveGuard = (allowed: boolean) => {
    guard?.resolve(allowed);
    setGuard(null);
  };

  const reset = () => {
    abortRef.current?.abort();
    history.current = [];
    setItems([]);
  };

  const modeBadge = healthError ? (
    <span className="badge badge--error" title={healthError}>
      Proxy desconectado
    </span>
  ) : health?.mode === 'mock' ? (
    <span className="badge badge--mock" title={health.reason}>
      Modo simulado
    </span>
  ) : health ? (
    <span className="badge badge--live">Gemini · {health.model}</span>
  ) : (
    <span className="badge">Conectando…</span>
  );

  return (
    <aside className="chat" aria-label="Asistente de compras">
      <header className="chat__header">
        <div>
          <h2>Asistente Rodada</h2>
          <div className="chat__meta">
            {modeBadge}
            <button type="button" className="link-button" onClick={() => setShowTools((v) => !v)} aria-expanded={showTools}>
              {tools.length} herramienta{tools.length === 1 ? '' : 's'} WebMCP
            </button>
          </div>
        </div>
        <div className="chat__actions">
          <button type="button" className="icon-button" onClick={reset} title="Nueva conversación" aria-label="Nueva conversación">
            ↺
          </button>
          <button type="button" className="icon-button" onClick={onClose} title="Cerrar panel" aria-label="Cerrar panel">
            ×
          </button>
        </div>
      </header>

      {showTools ? (
        <div className="chat__tools">
          {tools.length === 0 ? (
            <p className="muted">Ninguna herramienta registrada. El agente no puede ver ni tocar la página.</p>
          ) : (
            <ul>
              {tools.map((tool) => (
                <li key={tool.name}>
                  <code>{tool.name}</code>
                  {tool.annotations.readOnlyHint ? <span className="hint">solo lectura</span> : null}
                  {tool.annotations.untrustedContentHint ? <span className="hint hint--warn">no confiable</span> : null}
                  {tool.annotations.consequentialHint ? <span className="hint hint--danger">consecuente</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      <div className="chat__messages" ref={listRef}>
        {items.length === 0 ? (
          <div className="chat__empty">
            <p>Pregúntame por productos, tallas o tu carrito.</p>
            <p className="muted">
              {tools.length === 0
                ? 'Ahora mismo no tengo herramientas: solo puedo adivinar.'
                : `Puedo usar ${tools.length} herramientas de esta página.`}
            </p>
          </div>
        ) : null}
        {items.map((item) => {
          switch (item.kind) {
            case 'user':
              return (
                <p key={item.id} className="msg msg--user">
                  {item.text}
                </p>
              );
            case 'assistant':
              return (
                <p key={item.id} className="msg msg--assistant">
                  {item.text}
                </p>
              );
            case 'error':
              return (
                <p key={item.id} className="msg msg--error" role="alert">
                  {item.text}
                </p>
              );
            case 'tool':
              return <ToolCallCard key={item.id} event={item.event} />;
          }
        })}
        {guard ? (
          <div className="guard" role="alertdialog" aria-label="Confirmar acción del agente">
            <p>
              <strong>Control del agente:</strong> quiere ejecutar <code>{guard.tool.name}</code>, una acción marcada como{' '}
              <em>consecuente</em>.
            </p>
            <pre>{formatJson(guard.call.args ?? {})}</pre>
            <div className="guard__actions">
              <button type="button" className="button button--ghost" onClick={() => resolveGuard(false)}>
                Rechazar
              </button>
              <button type="button" className="button" onClick={() => resolveGuard(true)}>
                Permitir
              </button>
            </div>
          </div>
        ) : null}
        {busy && !guard ? <p className="msg msg--typing">El agente está pensando…</p> : null}
      </div>

      <div className="chat__suggestions" aria-label="Prompts del taller">
        {(Object.keys(DEMO_PROMPTS) as DemoPromptKey[]).map((key) => (
          <button key={key} type="button" className="chip" disabled={busy} onClick={() => void send(DEMO_PROMPTS[key])} title={DEMO_PROMPTS[key]}>
            {DEMO_PROMPT_LABELS[key]}
          </button>
        ))}
      </div>

      <form className="chat__form" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="chat-input">
          Mensaje para el asistente
        </label>
        <textarea
          id="chat-input"
          value={input}
          rows={2}
          placeholder="Escribe tu mensaje…"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send(input);
            }
          }}
        />
        {busy ? (
          <button type="button" className="button button--ghost" onClick={() => abortRef.current?.abort()}>
            Detener
          </button>
        ) : (
          <button type="submit" className="button" disabled={!input.trim()}>
            Enviar
          </button>
        )}
      </form>
    </aside>
  );
}
