import { Fragment, type ReactNode } from 'react';

/**
 * Minimal TS/shell highlighter for slides. Zero dependencies so the deck renders
 * offline. Colors are gde tokens, every one >= 7:1 on the #17181b card.
 */
const TS_TOKEN =
  /(\/\/.*$)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`)|\b(const|let|async|await|function|return|if|new|export|import|from|true|false|null)\b|(<\/?[a-z]+)/gm;

/** Shell: `# comments`, strings and the command name at the start of a line. */
const SH_TOKEN = /(#.*$)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|^(git|npm|cp|cd|node)\b/gm;

export type CodeLang = 'ts' | 'sh';

function highlight(code: string, lang: CodeLang) {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of code.matchAll(lang === 'sh' ? SH_TOKEN : TS_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(code.slice(last, index));
    const [text, comment, string, , tag] = match;
    const cls = comment
      ? 'text-gde-code-muted'
      : string
        ? 'text-gde-green-light'
        : tag
          ? 'text-gde-red-light'
          : 'text-gde-blue-light';
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

/** Dark code card. Sizes are canvas px (1920×1080): never below 24px. */
export function Code({
  code,
  file,
  lang = 'ts',
  size = 'md',
  compact = false,
  dense = false,
  className = '',
}: {
  code: string;
  file?: string;
  lang?: CodeLang;
  size?: 'md' | 'lg';
  /** Less vertical padding, for stacked cards. */
  compact?: boolean;
  /** Tighter line height (same font size), for long snippets that must stay inside the safe area. */
  dense?: boolean;
  className?: string;
}) {
  const text = { md: 'text-[24px]', lg: 'text-[28px]' }[size];
  return (
    <div className={`overflow-hidden rounded-[24px] border-[3px] border-gde-ink bg-gde-night ${className}`}>
      {file && (
        <div className="flex items-center gap-3 border-b-[3px] border-gde-ink bg-gde-ink px-10 py-3 font-gde-code text-[24px] text-gde-code-muted">
          <span aria-hidden className="flex gap-2">
            <span className="h-4 w-4 rounded-full bg-gde-red" />
            <span className="h-4 w-4 rounded-full bg-gde-yellow" />
            <span className="h-4 w-4 rounded-full bg-gde-green" />
          </span>
          {file}
        </div>
      )}
      <pre
        className={`m-0 whitespace-pre px-10 ${compact ? 'py-4' : 'py-7'} font-gde-code ${dense ? 'leading-[1.3]' : 'leading-[1.45]'} text-gde-code-text ${text}`}
      >
        <code>{highlight(code.trim(), lang)}</code>
      </pre>
    </div>
  );
}
