/**
 * Build-time content for the /guide page.
 *
 * The guide has no copy of its own: it reads docs/*.md (the same files the repo
 * ships), renders them with marked + shiki while Vite builds, and exposes the
 * result as the virtual module `virtual:guide-content`. The browser receives
 * ready HTML, so neither marked nor shiki is shipped to attendees.
 */
import { readFileSync } from 'node:fs';
import { Marked, type Token, type Tokens } from 'marked';
import { createHighlighter, type BundledLanguage } from 'shiki';
import type { Plugin } from 'vite';
import type { GuideDoc, GuideSection, GuideStep, GuideTone } from '../src/content-types';

const VIRTUAL_ID = 'virtual:guide-content';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

interface DocEntry {
  file: string;
  id: string;
  kind: GuideDoc['kind'];
  /** Short label for the stepper: "P", "1"…"5", "R". */
  short: string;
  tone: GuideTone;
  /** Shown when the doc has no "Duración" table (prework). */
  duration?: string;
  /** Command to start this part from its tag. */
  catchUp?: string;
}

/** Order and identity of every page. Content itself always comes from the markdown. */
const DOCS: DocEntry[] = [
  { file: '00-prework.md', id: 'prework', kind: 'prework', short: 'P', tone: 'yellow', duration: '15 minutos', catchUp: 'git switch -c mi-taller acto-1' },
  { file: '01-acto-1-incidente.md', id: 'acto-1', kind: 'act', short: '1', tone: 'red', catchUp: 'git switch -c mi-acto-1 acto-1' },
  { file: '02-acto-2-ojos.md', id: 'acto-2', kind: 'act', short: '2', tone: 'blue', catchUp: 'git switch -c mi-acto-2 acto-2' },
  { file: '03-acto-3-manos.md', id: 'acto-3', kind: 'act', short: '3', tone: 'green', catchUp: 'git switch -c mi-acto-3 acto-3' },
  { file: '04-acto-4-sabotaje.md', id: 'acto-4', kind: 'act', short: '4', tone: 'red', catchUp: 'git switch -c mi-acto-4 acto-4' },
  { file: '05-acto-5-cierre.md', id: 'acto-5', kind: 'act', short: '5', tone: 'yellow', catchUp: 'git switch -c mi-final final' },
  { file: 'cheatsheet.md', id: 'cheatsheet', kind: 'reference', short: 'R', tone: 'blue' },
];

const LANGS: BundledLanguage[] = ['ts', 'tsx', 'js', 'json', 'bash'];
const LANG_ALIAS: Record<string, string> = { sh: 'bash', shell: 'bash', typescript: 'ts', javascript: 'js' };
const LANG_LABEL: Record<string, string> = { bash: 'terminal', text: 'texto' };

/** Numbered steps: "1. Reproduce…" (h2) and "3.1 `set_filters`…" (h3). */
const STEP_HEADING = /^\d+(\.\d+)?\.?\s/;

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Plain text of a token list (for labels and slugs). */
function plain(tokens: Token[] | undefined): string {
  return (tokens ?? [])
    .map((t) => ('tokens' in t && t.tokens ? plain(t.tokens) : 'text' in t ? String(t.text) : ''))
    .join('');
}

function stepBox(id: string, label: string): string {
  return `<input type="checkbox" class="g-check" data-step="${escapeHtml(id)}" aria-label="Hecho: ${escapeHtml(label)}">`;
}

/**
 * Mermaid fences ship as plain source; the client draws them with a lazily
 * loaded mermaid (guide/src/diagrams.ts). The source <pre> doubles as the
 * "Ver código" view and as the fallback when drawing fails.
 */
function diagram(source: string): string {
  return (
    `<figure class="g-diagram" data-diagram data-state="pending">` +
    `<div class="g-diagram__bar"><span>diagrama</span><span class="g-diagram__actions">` +
    `<button type="button" class="g-diagram__toggle" data-diagram-toggle aria-expanded="false">Ver código</button>` +
    `<button type="button" class="g-copy" data-copy>Copiar</button></span></div>` +
    `<div class="g-diagram__canvas" role="img" aria-label="Diagrama"><p class="g-diagram__status">Dibujando diagrama…</p></div>` +
    `<p class="g-diagram__error" hidden>No se pudo dibujar el diagrama. Este es su código:</p>` +
    `<pre class="g-diagram__src" hidden><code>${escapeHtml(source)}</code></pre>` +
    `</figure>\n`
  );
}

type Highlighter = Awaited<ReturnType<typeof createHighlighter>>;

function renderDoc(entry: DocEntry, markdown: string, highlighter: Highlighter): GuideDoc {
  const steps: GuideStep[] = [];
  const usedIds = new Set<string>();
  const uniqueId = (base: string) => {
    let id = base || 'seccion';
    for (let i = 2; usedIds.has(id); i++) id = `${base}-${i}`;
    usedIds.add(id);
    return id;
  };
  let taskIndex = 0;

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const label = plain(tokens);
        const inner = this.parser.parseInline(tokens);
        // The milestone is not numbered, but it is the act's main checkpoint.
        const isMilestone = depth === 2 && /^Hito/i.test(label);
        const id = uniqueId(isMilestone ? `${entry.id}--hito` : `${entry.id}--${slugify(label)}`);
        const isStep = isMilestone || STEP_HEADING.test(label);
        const stepLabel = isMilestone ? 'Hito verificado' : label;
        if (isStep) steps.push({ id, label: stepLabel });
        const check = isStep ? stepBox(id, stepLabel) : '';
        return `<h${depth} id="${id}" class="g-h${depth}${isStep ? ' g-step' : ''}">${check}<span>${inner}</span></h${depth}>\n`;
      },
      code({ text, lang }) {
        const raw = (lang ?? '').trim().split(/\s+/)[0] || 'text';
        const resolved = LANG_ALIAS[raw] ?? raw;
        if (resolved === 'mermaid') return diagram(text);
        const supported = (LANGS as string[]).includes(resolved);
        const html = highlighter.codeToHtml(text, { lang: supported ? resolved : 'text', theme: 'github-dark-default' });
        const label = LANG_LABEL[resolved] ?? resolved;
        return (
          `<div class="g-code g-code--${supported ? resolved : 'text'}"><div class="g-code__bar"><span>${escapeHtml(label)}</span>` +
          `<button type="button" class="g-copy" data-copy>Copiar</button></div>${html}</div>\n`
        );
      },
      checkbox({ checked }) {
        const id = `${entry.id}--tarea-${++taskIndex}`;
        steps.push({ id, label: `Tarea ${taskIndex}` });
        return `<input type="checkbox" class="g-check" data-step="${id}"${checked ? ' checked' : ''} aria-label="Hecho"> `;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href) && !href.startsWith('http://localhost');
        const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${escapeHtml(href)}"${title ? ` title="${escapeHtml(title)}"` : ''}${attrs}>${text}</a>`;
      },
    },
  });

  const tokens = marked.lexer(markdown);
  const parse = (list: Token[]) => {
    const withLinks = Object.assign([...list], { links: tokens.links });
    return marked
      .parser(withLinks)
      .replace(/<table>/g, '<div class="g-table"><table>')
      .replace(/<\/table>/g, '</table></div>');
  };

  let title = entry.id;
  let label = '';
  let duration = entry.duration;
  let startTag: string | undefined;
  let solutionTag: string | undefined;
  let objectiveHtml: string | undefined;
  const intro: Token[] = [];
  const sections: GuideSection[] = [];
  let current: { title: string; tokens: Token[] } | null = null;
  let inSolution = false;

  const flush = () => {
    if (!current) return;
    const t = current.title;
    const kind: GuideSection['kind'] = /^Hito/i.test(t) ? 'milestone' : /^¿Te quedaste atrás/i.test(t) ? 'next' : 'default';
    sections.push({ kind, html: parse(current.tokens) });
    current = null;
  };

  for (const token of tokens) {
    if (token.type === 'heading' && token.depth === 1) {
      const [head, ...rest] = (token as Tokens.Heading).text.split(' · ');
      label = rest.length ? head : '';
      title = rest.length ? rest.join(' · ') : head;
      continue;
    }
    if (!current && token.type === 'table' && plain((token as Tokens.Table).header[0]?.tokens) === 'Duración') {
      const row = (token as Tokens.Table).rows[0] ?? [];
      duration = plain(row[0]?.tokens).trim();
      startTag = plain(row[1]?.tokens).trim() || undefined;
      solutionTag = plain(row[2]?.tokens).trim() || undefined;
      continue;
    }
    if (!current && token.type === 'paragraph' && token.raw.startsWith('**Objetivo:**')) {
      objectiveHtml = marked.parseInline(token.raw.replace(/^\*\*Objetivo:\*\*\s*/, '').trim(), { async: false });
      continue;
    }
    if (!current && token.type === 'hr') continue;

    // <details> solutions become their own collapsed block, outside the milestone box.
    if (token.type === 'html' && /^<details/i.test(token.raw.trim())) {
      flush();
      inSolution = true;
      current = { title: '', tokens: [token] };
      continue;
    }
    if (inSolution) {
      current!.tokens.push(token);
      if (token.type === 'html' && /<\/details>/i.test(token.raw)) {
        sections.push({ kind: 'solution', html: parse(current!.tokens) });
        current = null;
        inSolution = false;
      }
      continue;
    }

    if (token.type === 'heading' && token.depth === 2) {
      flush();
      current = { title: plain((token as Tokens.Heading).tokens), tokens: [token] };
      continue;
    }
    if (current) current.tokens.push(token);
    else intro.push(token);
  }
  flush();

  return {
    id: entry.id,
    kind: entry.kind,
    short: entry.short,
    tone: entry.tone,
    label,
    title,
    duration,
    startTag: startTag?.replace(/`/g, ''),
    solutionTag: solutionTag?.replace(/`/g, ''),
    catchUp: entry.catchUp,
    objectiveHtml,
    introHtml: intro.length ? parse(intro) : '',
    sections,
    steps,
  };
}

async function buildContent(docsDir: string): Promise<GuideDoc[]> {
  const highlighter = await createHighlighter({ themes: ['github-dark-default'], langs: LANGS });
  try {
    return DOCS.map((entry) => renderDoc(entry, readFileSync(`${docsDir}/${entry.file}`, 'utf8'), highlighter));
  } finally {
    highlighter.dispose();
  }
}

/**
 * Vite plugin: `import { docs } from 'virtual:guide-content'`.
 * The docs are watch files of the virtual module, so editing one reloads the guide in dev.
 */
export function guideContent(docsDir: string): Plugin {
  const files = DOCS.map((d) => `${docsDir}/${d.file}`);
  return {
    name: 'guide-content',
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return undefined;
      for (const file of files) this.addWatchFile(file);
      const docs = await buildContent(docsDir);
      return `export const docs = ${JSON.stringify(docs)};`;
    },
  };
}
