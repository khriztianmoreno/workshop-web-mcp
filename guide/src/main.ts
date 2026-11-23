import './fonts.css';
import './guide.css';
import { docs } from 'virtual:guide-content';
import type { GuideDoc, GuideSection } from './content-types';
import { copyText } from './copy';
import { loadProgress, readPref, saveProgress, writePref } from './storage';

const DEFAULT_DOC = 'acto-1';
const LAST_DOC_KEY = 'webmcp-guide:last-doc';
const THEME_KEY = 'webmcp-guide:theme';

const byId = new Map(docs.map((d) => [d.id, d]));
const progress = loadProgress();

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function doneCount(doc: GuideDoc): number {
  return doc.steps.filter((s) => progress[s.id]).length;
}

function disc(doc: GuideDoc, size: 'sm' | 'lg' = 'sm'): string {
  return `<span class="g-disc g-disc--${size} tone-${doc.tone}" aria-hidden="true">${escapeHtml(doc.short)}</span>`;
}

/** Short duration for the stepper: "15 minutos (≈9 de slides…)" → "15 min". */
function shortDuration(duration?: string): string {
  const match = duration?.match(/(\d+)\s*min/);
  return match ? `${match[1]} min` : '';
}

function renderNav(activeId: string): string {
  const items = docs
    .map((doc) => {
      const total = doc.steps.length;
      const current = doc.id === activeId ? ' aria-current="page"' : '';
      const minutes = shortDuration(doc.duration);
      const meta =
        (minutes ? `<span class="g-nav__dur">${minutes}${total ? ' · ' : ''}</span>` : '') +
        (total ? `<span data-progress="${doc.id}">${doneCount(doc)}/${total}</span>` : '');
      return (
        `<li><a class="g-nav__link" href="#${doc.id}"${current}>${disc(doc)}` +
        `<span class="g-nav__text"><span class="g-nav__label">${escapeHtml(doc.label || (doc.kind === 'reference' ? 'Referencia' : 'Antes del taller'))}</span>` +
        `<span class="g-nav__title">${escapeHtml(doc.title)}</span>` +
        (meta ? `<span class="g-nav__meta">${meta}</span>` : '') +
        `</span></a></li>`
      );
    })
    .join('');
  return `<ol class="g-nav__list">${items}</ol>`;
}

function renderSection(section: GuideSection): string {
  switch (section.kind) {
    case 'milestone':
      return `<section class="g-sec g-milestone">${section.html}</section>`;
    case 'next':
      return `<section class="g-sec g-next">${section.html}</section>`;
    case 'solution':
      return `<div class="g-solution">${section.html}</div>`;
    default:
      return `<section class="g-sec">${section.html}</section>`;
  }
}

function renderCatchUp(doc: GuideDoc): string {
  if (!doc.catchUp) return '';
  const heading = doc.kind === 'prework' ? 'Tu rama de trabajo' : '¿Te quedaste atrás?';
  const lead =
    doc.kind === 'prework'
      ? 'Crea tu rama desde el inicio del Acto 1:'
      : `Empieza ${doc.label ? `el ${escapeHtml(doc.label)}` : 'esta parte'} desde su tag. Antes, guarda tu avance con <code>git stash -u</code>.`;
  return (
    `<aside class="g-catchup" aria-label="${heading}"><p class="g-catchup__title">${heading}</p><p>${lead}</p>` +
    `<div class="g-cmd"><code>${escapeHtml(doc.catchUp)}</code><button type="button" class="g-copy" data-copy>Copiar</button></div></aside>`
  );
}

function renderDoc(doc: GuideDoc): string {
  const total = doc.steps.length;
  const tags = [
    doc.startTag ? `<span class="g-tag">inicio <code>${escapeHtml(doc.startTag)}</code></span>` : '',
    doc.solutionTag ? `<span class="g-tag">solución <code>${escapeHtml(doc.solutionTag)}</code></span>` : '',
  ].join('');
  const index = docs.indexOf(doc);
  const prev = docs[index - 1];
  const next = docs[index + 1];
  const pager = (d: GuideDoc | undefined, rel: 'prev' | 'next') =>
    d
      ? `<a class="g-pager__link g-pager__link--${rel}" href="#${d.id}" rel="${rel}"><span>${rel === 'prev' ? '← Anterior' : 'Siguiente →'}</span><strong>${escapeHtml(d.label ? `${d.label} · ${d.title}` : d.title)}</strong></a>`
      : '<span></span>';

  return `
    <article class="g-doc tone-${doc.tone}">
      <header class="g-hero">
        <p class="g-eyebrow"><span class="g-dot tone-${doc.tone}" aria-hidden="true"></span>${escapeHtml([doc.label, doc.duration].filter(Boolean).join(' · ') || 'Referencia')}</p>
        <h1 class="g-title">${disc(doc, 'lg')}<span>${escapeHtml(doc.title)}</span></h1>
        ${tags ? `<div class="g-tags">${tags}</div>` : ''}
        ${doc.objectiveHtml ? `<div class="g-objective"><p class="g-objective__label">Objetivo</p><p>${doc.objectiveHtml}</p></div>` : ''}
        ${
          total
            ? `<div class="g-progress" role="group" aria-label="Avance"><div class="g-progress__bar"><span data-progress-bar="${doc.id}" style="width:${(doneCount(doc) / total) * 100}%"></span></div><span class="g-progress__text"><span data-progress="${doc.id}">${doneCount(doc)}/${total}</span> pasos</span></div>`
            : ''
        }
      </header>
      ${renderCatchUp(doc)}
      ${doc.introHtml ? `<div class="g-sec g-intro">${doc.introHtml}</div>` : ''}
      ${doc.sections.map(renderSection).join('')}
      <nav class="g-pager" aria-label="Navegación entre actos">${pager(prev, 'prev')}${pager(next, 'next')}</nav>
    </article>`;
}

function updateProgress(doc: GuideDoc): void {
  const total = doc.steps.length;
  const done = doneCount(doc);
  for (const el of document.querySelectorAll<HTMLElement>(`[data-progress="${doc.id}"]`)) el.textContent = `${done}/${total}`;
  const bar = document.querySelector<HTMLElement>(`[data-progress-bar="${doc.id}"]`);
  if (bar) bar.style.width = `${total ? (done / total) * 100 : 0}%`;
}

/** "#acto-3" or "#acto-3--hito" → the doc and an optional in-page anchor. */
function parseHash(): { doc: GuideDoc; anchor?: string } {
  const hash = decodeURIComponent(location.hash.slice(1));
  const docId = hash.split('--')[0];
  const doc = byId.get(docId) ?? byId.get(readPref(LAST_DOC_KEY) ?? '') ?? byId.get(DEFAULT_DOC) ?? docs[0];
  return { doc, anchor: hash.includes('--') && docId === doc.id ? hash : undefined };
}

const root = document.getElementById('guide')!;
root.innerHTML = `
  <a class="g-skip" href="#contenido">Saltar al contenido</a>
  <header class="g-top">
    <a class="g-brand" href="#${DEFAULT_DOC}">
      <span class="g-brand__badge">@DevFest <span>Bogotá</span></span>
      <span class="g-brand__title">Misión: El Checkout Roto <span>· Guía del taller</span></span>
    </a>
    <button type="button" class="g-theme" data-theme-toggle aria-label="Cambiar tema claro u oscuro">
      <span class="g-theme__icon" aria-hidden="true"></span>
    </button>
  </header>
  <div class="g-layout">
    <nav class="g-nav" aria-label="Actos del taller"></nav>
    <main class="g-main" id="contenido" tabindex="-1"></main>
  </div>`;

const nav = root.querySelector<HTMLElement>('.g-nav')!;
const main = root.querySelector<HTMLElement>('.g-main')!;

function render(): void {
  const { doc, anchor } = parseHash();
  writePref(LAST_DOC_KEY, doc.id);
  document.title = `${doc.label ? `${doc.label} · ` : ''}${doc.title} · Guía WebMCP`;
  nav.innerHTML = renderNav(doc.id);
  main.innerHTML = renderDoc(doc);
  for (const box of main.querySelectorAll<HTMLInputElement>('input[data-step]')) box.checked = Boolean(progress[box.dataset.step!]);
  const target = anchor ? document.getElementById(anchor) : null;
  if (target) target.scrollIntoView();
  else window.scrollTo(0, 0);
}

document.addEventListener('change', (event) => {
  const box = event.target;
  if (!(box instanceof HTMLInputElement) || !box.dataset.step) return;
  if (box.checked) progress[box.dataset.step] = true;
  else delete progress[box.dataset.step];
  saveProgress(progress);
  const doc = parseHash().doc;
  updateProgress(doc);
});

document.addEventListener('click', (event) => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-copy]');
  if (!button) return;
  const source = button.closest('.g-code, .g-cmd')?.querySelector('pre, code');
  if (!source) return;
  void copyText(source.textContent ?? '').then((ok) => {
    button.textContent = ok ? 'Copiado' : 'No se pudo copiar';
    button.classList.toggle('is-done', ok);
    window.setTimeout(() => {
      button.textContent = 'Copiar';
      button.classList.remove('is-done');
    }, 1600);
  });
});

/* Theme: follows the system until the viewer picks one; the choice is remembered. */
function applyTheme(theme: string | null): void {
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}
applyTheme(readPref(THEME_KEY));
root.querySelector('[data-theme-toggle]')!.addEventListener('click', () => {
  const current =
    document.documentElement.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const nextTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);
  writePref(THEME_KEY, nextTheme);
});

window.addEventListener('hashchange', render);
render();
