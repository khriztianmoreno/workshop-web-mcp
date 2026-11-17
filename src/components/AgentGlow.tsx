import type { ReactNode } from 'react';
import { useAgentHighlight, type ActivityArea } from '../webmcp/activity';

/** Wraps an element that glows with an "Ejecutado por agente" badge after an agent touches it. */
export function AgentGlow({
  target,
  className = '',
  children,
  as: Tag = 'div',
}: {
  target: ActivityArea | `product:${string}`;
  className?: string;
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
}) {
  const active = useAgentHighlight(target);
  return (
    <Tag className={`${className} agent-glow${active ? ' agent-glow--active' : ''}`.trim()}>
      {active ? (
        <span className="agent-badge" role="status">
          Ejecutado por agente
        </span>
      ) : null}
      {children}
    </Tag>
  );
}
