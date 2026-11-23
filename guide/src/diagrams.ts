/**
 * Draws the ```mermaid blocks of the docs. mermaid is a separate chunk that is
 * only downloaded when the current page has a diagram. If loading or drawing
 * fails, the figure falls back to its source code: never an empty box.
 */
import type { MermaidConfig } from 'mermaid';

type Mermaid = (typeof import('mermaid'))['default'];
export type Theme = 'light' | 'dark';

let loading: Promise<Mermaid> | null = null;
let generation = 0;
let sequence = 0;

function loadMermaid(): Promise<Mermaid> {
  loading ??= import('mermaid').then((m) => m.default);
  loading.catch(() => {
    loading = null; // allow a retry on the next render (e.g. after a network blip)
  });
  return loading;
}

/** Reads a guide.css custom property; the theme attribute is already applied when this runs. */
function token(name: string, fallback: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** DevFest palette and fonts, taken from the guide.css tokens of the active theme. */
function themeVariables(theme: Theme): MermaidConfig['themeVariables'] {
  const dark = theme === 'dark';
  const ink = token('--text', dark ? '#f0f0f0' : '#1e1e1e');
  // In dark mode --line is a mid grey made for 3px borders; arrows need more contrast.
  const line = dark ? token('--muted', '#b4b4b4') : token('--line', '#1e1e1e');
  const surface = token('--surface', dark ? '#222222' : '#ffffff');
  const canvas = token('--canvas', dark ? '#161616' : '#f2f1f0');
  const blue = token('--pastel-blue', dark ? '#17323b' : '#c3ecf6');
  const green = token('--pastel-green', dark ? '#1b3520' : '#ccf6c5');
  const yellow = token('--pastel-yellow', dark ? '#3a3115' : '#ffe7a5');
  return {
    darkMode: dark,
    fontFamily: fontFamily(),
    fontSize: '15px',
    background: surface,
    primaryColor: blue,
    primaryTextColor: ink,
    primaryBorderColor: line,
    secondaryColor: green,
    secondaryTextColor: ink,
    secondaryBorderColor: line,
    tertiaryColor: yellow,
    tertiaryTextColor: ink,
    tertiaryBorderColor: line,
    lineColor: line,
    textColor: ink,
    mainBkg: blue,
    nodeBorder: line,
    nodeTextColor: ink,
    clusterBkg: canvas,
    clusterBorder: line,
    titleColor: ink,
    edgeLabelBackground: surface,
    actorBkg: blue,
    actorBorder: line,
    actorTextColor: ink,
    actorLineColor: line,
    signalColor: line,
    signalTextColor: ink,
    labelBoxBkgColor: yellow,
    labelBoxBorderColor: line,
    labelTextColor: ink,
    loopTextColor: ink,
    noteBkgColor: yellow,
    noteBorderColor: line,
    noteTextColor: ink,
    activationBkgColor: green,
    activationBorderColor: line,
    sequenceNumberColor: surface,
  };
}

function fontFamily(): string {
  return token('--font', "'Google Sans Variable', ui-sans-serif, system-ui, sans-serif");
}

function showFallback(figure: HTMLElement): void {
  figure.dataset.state = 'error';
  figure.querySelector<HTMLElement>('.g-diagram__canvas')!.hidden = true;
  figure.querySelector<HTMLElement>('.g-diagram__error')!.hidden = false;
  figure.querySelector<HTMLElement>('.g-diagram__src')!.hidden = false;
  figure.querySelector<HTMLElement>('[data-diagram-toggle]')!.hidden = true;
}

/** Renders every diagram under `root`. Calling it again (theme change, navigation) supersedes earlier calls. */
export async function renderDiagrams(root: ParentNode, theme: Theme): Promise<void> {
  const figures = [...root.querySelectorAll<HTMLElement>('[data-diagram]')];
  if (!figures.length) return;
  const current = ++generation;

  let mermaid: Mermaid;
  try {
    mermaid = await loadMermaid();
  } catch {
    if (current === generation) figures.forEach(showFallback);
    return;
  }
  if (current !== generation) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: fontFamily(),
    themeVariables: themeVariables(theme),
    flowchart: { useMaxWidth: true, htmlLabels: true, wrappingWidth: 260 },
    sequence: { useMaxWidth: true },
  });

  for (const figure of figures) {
    if (figure.dataset.state === 'error') continue;
    const canvas = figure.querySelector<HTMLElement>('.g-diagram__canvas')!;
    const source = figure.querySelector('.g-diagram__src')?.textContent ?? '';
    const id = `g-mermaid-${++sequence}`;
    try {
      const { svg } = await mermaid.render(id, source);
      if (current !== generation || !figure.isConnected) return;
      canvas.innerHTML = svg;
      const drawn = canvas.querySelector('svg');
      // Shrink with the column down to a readable size, then scroll inside the figure.
      const natural = drawn ? parseFloat(drawn.style.maxWidth) : NaN;
      if (drawn && Number.isFinite(natural)) drawn.style.minWidth = `${Math.min(natural, 520)}px`;
      figure.dataset.state = 'ready';
    } catch {
      document.getElementById(id)?.remove();
      document.getElementById(`d${id}`)?.remove();
      if (current !== generation) return;
      showFallback(figure);
    }
  }
}
