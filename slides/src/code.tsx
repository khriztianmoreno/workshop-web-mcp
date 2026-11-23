import { Fragment, type ReactNode } from 'react';

/**
 * Minimal TS/shell highlighter for slides. Zero dependencies so the deck renders
 * offline. Colors are the template halftones, every token >= 7:1 on #1e1e1e.
 */
const TS_TOKEN =
  /(\/\/.*$)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(document\.modelContext)\b|\b(const|let|async|await|function|return|if|new|export|import|from|true|false|null)\b/gm;

/** Shell: `# comments`, strings and the command name at the start of a line. */
const SH_TOKEN = /(#.*$)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|()^(git|npm|cp|cd|node)\b/gm;

/** The WebMCP entry point: highlighted on its own so the audience sees it comes from the browser, not an import. */
const GLOBAL_CLASS = 'font-semibold text-df-halftone-yellow underline decoration-dotted underline-offset-[6px]';

export type CodeLang = 'ts' | 'sh';

function highlight(code: string, lang: CodeLang) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(lang === 'sh' ? SH_TOKEN : TS_TOKEN)) {
    const index = match.index ?? 0;
    const [text, comment, string, global] = match;
    if (!text) continue;
    if (index > last) parts.push(code.slice(last, index));
    const cls = comment
      ? 'text-df-code-muted'
      : string
        ? 'text-df-halftone-green'
        : global
          ? GLOBAL_CLASS
          : 'text-df-halftone-blue';
    parts.push(
      <span key={index} className={cls}>
        {text}
      </span>,
    );
    last = index + text.length;
  }
  if (last < code.length) parts.push(code.slice(last));
  return parts.map((p, i) => <Fragment key={i}>{p}</Fragment>);
}

/** Template code card (ink). Sizes are canvas px (1920×1080): never below 24px. */
export function Code({
  code,
  file,
  lang = 'ts',
  size = 'md',
  dense = false,
  compact = false,
  className = '',
}: {
  code: string;
  file?: string;
  lang?: CodeLang;
  size?: 'md' | 'lg';
  /** Tighter line height (same font size), for long snippets that must stay inside the panel. */
  dense?: boolean;
  /** Less vertical padding, for short cards next to other content. */
  compact?: boolean;
  className?: string;
}) {
  const text = { md: 'text-[24px]', lg: 'text-[26px]' }[size];
  const pad = compact ? 'pb-5' : 'pb-9';
  return (
    <div className={`overflow-hidden rounded-[24px] border-[3px] border-df-ink bg-df-ink ${className}`}>
      {file && <div className="px-12 pt-7 font-df-mono text-[22px] font-light text-df-code-muted">{file}</div>}
      <pre
        className={`m-0 whitespace-pre px-12 ${pad} font-df-code ${dense ? 'leading-[1.35]' : 'leading-[1.55]'} text-df-code-text ${
          file ? 'pt-4' : compact ? 'pt-5' : 'pt-9'
        } ${text}`}
      >
        <code>{highlight(code.trim(), lang)}</code>
      </pre>
    </div>
  );
}
