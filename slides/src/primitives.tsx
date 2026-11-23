import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gdeLogo from './assets/gde-logo.png';
import { Icon, type IconName } from './icons';

/*
 * Visual language: GDE system (Google Sans, the four Google colors, filled +
 * 3px-bordered boxes, pills, gradient hero backgrounds). Ported from the
 * "WebMCP: tu UI como tools" talk deck.
 *
 * - Every slide is a fixed 1920×1080 canvas scaled to fit (Frame). Positions are
 *   canvas pixels, so they stay exact on any viewport, including the 1440×900
 *   speaker preview stage.
 * - Backgrounds are pure CSS (deck.css, `.deck-bg-*`): no image request, so
 *   the deck works with no internet on stage.
 * - Legibility floor: nothing under 24px on the canvas; no Light weights at all.
 *
 * Background types:
 *   hero      → cover, the big question, the mission, "let's go"
 *   statement → dark one-liners (the ticket, the security teaser)
 *   content   → light explanation slides
 *   code      → dark code slides
 *   demo      → live demo placeholders (deep blue)
 */

// ─── Canvas, backgrounds and per-slide metadata ────────────────────────────

const CANVAS = { w: 1920, h: 1080 };

export type Background = 'hero' | 'statement' | 'content' | 'code' | 'demo';

const BACKGROUNDS: Record<Background, { letterbox: string; dark: boolean }> = {
  hero: { letterbox: '#f8f9fa', dark: false },
  statement: { letterbox: '#202124', dark: true },
  content: { letterbox: '#f8f9fa', dark: false },
  code: { letterbox: '#202124', dark: true },
  demo: { letterbox: '#0b2a5b', dark: true },
};

/** Section marker: shown as a badge on every slide of the section ("Conceptos", "La misión"…). */
export type Section = { name: string; detail?: string };

/** Slide number (0 = unnumbered) and section, provided by the registry. */
export const SlideMeta = createContext<{ number: number; section?: Section }>({ number: 0 });

/** Local images used by the deck. Decoded once so no slide paints before its art. */
const ASSETS = [gdeLogo];

let assetsPreloaded = false;

function preloadAssets() {
  if (assetsPreloaded) return;
  assetsPreloaded = true;
  for (const src of ASSETS) {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => console.warn(`[slides] asset failed to load: ${img.src}`));
  }
}

// ─── Tokens ────────────────────────────────────────────────────────────────

/** Accent tone: one of the four Google colors. */
export type Tone = 'blue' | 'green' | 'red' | 'yellow';

const PASTEL: Record<Tone, string> = {
  blue: 'bg-gde-pastel-blue',
  green: 'bg-gde-pastel-green',
  red: 'bg-gde-pastel-red',
  yellow: 'bg-gde-pastel-yellow',
};

export const SOLID: Record<Tone, string> = {
  blue: 'bg-gde-blue',
  green: 'bg-gde-green',
  red: 'bg-gde-red',
  yellow: 'bg-gde-yellow',
};

/** Accent text on dark backgrounds (>= 4.5:1 on #202124). */
export const TEXT_ON_DARK: Record<Tone, string> = {
  blue: 'text-gde-blue-light',
  green: 'text-gde-green-light',
  red: 'text-gde-red-light',
  yellow: 'text-gde-yellow-light',
};

// ─── Frame ─────────────────────────────────────────────────────────────────

/**
 * Slide surface: fills the viewport (or the speaker preview stage), paints the
 * letterbox and scales the 1920×1080 canvas to fit. Draws the section badge and
 * the slide number from SlideMeta, so every slide of a section carries the same badge.
 */
export function Frame({ bg, children }: { bg: Background; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const { number, section } = useContext(SlideMeta);
  const { letterbox, dark } = BACKGROUNDS[bg];

  useEffect(preloadAssets, []);

  // Layout effect: measure before the first paint so the canvas never shows a blank frame.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // clientWidth/Height are layout sizes: unaffected by the speaker stage's own transform.
    const fit = () => {
      // A not-yet-laid-out container measures 0: keep the last scale instead of collapsing to 0.
      if (!el.clientWidth || !el.clientHeight) return;
      setScale(Math.min(el.clientWidth / CANVAS.w, el.clientHeight / CANVAS.h));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="deck-frame relative w-full overflow-hidden" style={{ backgroundColor: letterbox }}>
      <div
        className={`deck-bg-${bg} absolute left-1/2 top-1/2 overflow-hidden font-gde ${dark ? 'text-white' : 'text-gde-ink'}`}
        style={{
          width: CANVAS.w,
          height: CANVAS.h,
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          visibility: scale === null ? 'hidden' : undefined,
        }}
      >
        {section && (
          <div className="absolute right-[80px] top-[48px]">
            <SectionBadge section={section} />
          </div>
        )}
        {children}
        {number > 0 && (
          <p
            className={`absolute bottom-[36px] right-[80px] font-gde-code text-[24px] tabular-nums ${
              dark ? 'text-gde-mist' : 'text-gde-soft'
            }`}
          >
            {String(number).padStart(2, '0')}
          </p>
        )}
      </div>
    </div>
  );
}

/** Persistent section marker: "Conceptos · WebMCP". Same position on every slide of the section. */
function SectionBadge({ section }: { section: Section }) {
  return (
    <span className="inline-flex items-center gap-3 rounded-full border-[3px] border-gde-ink bg-white px-7 py-2 text-[28px] font-medium text-gde-ink">
      <Icon name="flag" className="h-8 w-8" />
      {section.name}
      {section.detail && (
        <>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{section.detail}</span>
        </>
      )}
    </span>
  );
}

// ─── Layout primitives ─────────────────────────────────────────────────────

/** Absolutely positioned block on the canvas (px). */
export function Region({
  x,
  y,
  w,
  h,
  className = '',
  children,
}: {
  x: number;
  y: number;
  w: number;
  h?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`absolute flex flex-col ${className}`} style={{ left: x, top: y, width: w, height: h }}>
      {children}
    </div>
  );
}

/** Subhead: Google Sans Code with an accent dot. At most one per slide. */
export function Label({
  tone,
  children,
  className = 'text-[28px]',
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`flex items-center gap-4 font-gde-code ${className}`}>
      {tone && <span aria-hidden className={`h-5 w-5 shrink-0 rounded-full border-[3px] border-gde-ink ${SOLID[tone]}`} />}
      {children}
    </p>
  );
}

/** Highlighted phrase: pastel marker behind ink text. */
export function Mark({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <mark className={`rounded-lg px-2 text-gde-ink [box-decoration-break:clone] ${PASTEL[tone]}`}>{children}</mark>;
}

/** Inline technical name (API, property): code face, never cut. */
export function Tech({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <code className={`whitespace-nowrap font-gde-code ${className}`}>{children}</code>;
}

/** Box fill: pastel tone, white, or ink (dark). */
export type BoxFill = Tone | 'white' | 'ink';

const BOX_SURFACE: Record<BoxFill, string> = {
  ...PASTEL,
  white: 'bg-white text-gde-ink',
  ink: 'bg-gde-ink text-white',
};

/** Rounded box with a 3px ink outline: "lg" = hero shape, "md" = grid item. */
export function Box({
  fill,
  size = 'md',
  className = '',
  children,
}: {
  fill: BoxFill;
  size?: 'lg' | 'md';
  className?: string;
  children: ReactNode;
}) {
  const shape = size === 'lg' ? 'rounded-[36px] p-12' : 'rounded-[24px] px-10 py-8';
  const text = fill === 'ink' ? '' : 'text-gde-ink';
  return (
    <div className={`flex flex-col border-[3px] border-gde-ink ${shape} ${BOX_SURFACE[fill]} ${text} ${className}`}>
      {children}
    </div>
  );
}

/** Pill fill: solid Google color, white, or ink (dark label). */
export type PillFill = Tone | 'white' | 'ink';

const PILL_SURFACE: Record<PillFill, string> = {
  blue: 'bg-gde-blue text-white',
  green: 'bg-gde-green text-white',
  red: 'bg-gde-red text-white',
  yellow: 'bg-gde-yellow text-gde-ink',
  white: 'bg-white text-gde-ink',
  ink: 'bg-gde-ink text-white',
};

/** Outlined pill label (Google Sans Medium). Never wraps, never truncates. */
export function Pill({
  fill,
  children,
  className = 'px-8 py-3 text-[28px]',
}: {
  fill: PillFill;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center justify-center gap-3 whitespace-nowrap rounded-full border-[3px] border-gde-ink font-medium ${PILL_SURFACE[fill]} ${className}`}
    >
      {children}
    </span>
  );
}

/** "DEMO EN VIVO": red pill with a white dot. Used on every live demo slide. */
export function LivePill({ children = 'DEMO EN VIVO' }: { children?: ReactNode }) {
  return (
    <Pill fill="red" className="px-8 py-3 text-[32px] font-bold tracking-wide">
      <span aria-hidden className="h-5 w-5 rounded-full bg-white" />
      {children}
    </Pill>
  );
}

/** Thin 3px arrow. */
export function Arrow({ className = 'w-16' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 12" className={`shrink-0 ${className}`} fill="none">
      <path d="M0 6h58" stroke="currentColor" strokeWidth="3" />
      <path d="M56 1l7 5-7 5z" fill="currentColor" />
    </svg>
  );
}

/** Big Google Sans Bold figure + short supporting copy. */
export function Stat({
  value,
  children,
  className = 'text-[96px]',
}: {
  value: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className={`font-bold leading-[1.05] tracking-tight ${className}`}>{value}</p>
      <div className="text-[30px] leading-snug">{children}</div>
    </div>
  );
}

/** Large outlined circle with an icon. */
export function Disc({
  tone,
  icon,
  className = 'h-40 w-40',
}: {
  tone: Tone | 'white';
  icon: IconName;
  className?: string;
}) {
  const fill = tone === 'white' ? 'bg-white' : PASTEL[tone];
  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full border-[3px] border-gde-ink text-gde-ink ${fill} ${className}`}
    >
      <Icon name={icon} className="h-1/2 w-1/2" />
    </div>
  );
}

/** Local app address as plain code text (the store runs on Vite's port). */
export function Route({ path, className = 'text-[28px]' }: { path: string; className?: string }) {
  return <p className={`whitespace-nowrap font-gde-code ${className}`}>localhost:5173{path}</p>;
}

/**
 * Scoreboard: a question + a big ✅ / ❌ and one line of evidence.
 * Always a white box, so it reads the same on light and dark backgrounds.
 */
export function Scoreboard({ ok, question, children }: { ok: boolean; question: ReactNode; children: ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-8 rounded-[28px] border-[3px] border-gde-ink bg-white py-6 pl-6 pr-12 text-gde-ink">
      <span
        className={`flex h-[120px] w-[120px] shrink-0 items-center justify-center rounded-full border-[3px] border-gde-ink ${
          ok ? 'bg-gde-green' : 'bg-gde-red'
        } text-white`}
      >
        <Icon name={ok ? 'check' : 'close'} className="h-20 w-20" label={ok ? 'Sí' : 'No'} />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-[36px] font-bold leading-tight">{question}</p>
        <p className="text-[30px] leading-snug text-gde-soft">{children}</p>
      </div>
    </div>
  );
}

/** GDE credential: the logo is white, so it sits on an ink pill. */
export function GdeLogo({ className = 'h-20' }: { className?: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border-[3px] border-gde-ink bg-gde-ink px-7 py-3">
      <img src={gdeLogo} alt="Google Developer Experts" className={`w-auto ${className}`} />
    </span>
  );
}

// ─── Slide layouts ─────────────────────────────────────────────────────────

/** Safe area: clear of the section badge (top) and the slide number (bottom-right). */
export const SAFE = { x: 120, y: 150, w: 1680, h: 820 };

/** Light content slide: label + title pinned at the same position, then the body. */
export function Content({
  label,
  tone,
  title,
  bg = 'content',
  children,
}: {
  label?: ReactNode;
  tone: Tone;
  title?: ReactNode;
  bg?: 'content' | 'hero';
  children: ReactNode;
}) {
  return (
    <Frame bg={bg}>
      <Region {...SAFE}>
        <div className="flex flex-col gap-4">
          {label && <Label tone={tone}>{label}</Label>}
          {title && <h2 className="max-w-[1500px] text-balance text-[72px] font-bold leading-[1.1]">{title}</h2>}
        </div>
        <div className="mt-12 flex flex-1 flex-col gap-10">{children}</div>
      </Region>
    </Frame>
  );
}

/** Dark statement: one sentence, big, left-aligned and vertically centered. */
export function Statement({
  label,
  tone = 'blue',
  children,
}: {
  label?: ReactNode;
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <Frame bg="statement">
      <Region {...SAFE} className="justify-center gap-10">
        {label && (
          <Label tone={tone} className={`text-[30px] ${TEXT_ON_DARK[tone]}`}>
            {label}
          </Label>
        )}
        {children}
      </Region>
    </Frame>
  );
}

/** Dark code slide: label + one-line title, then the body (usually a Code card). */
export function CodeSlide({
  label,
  tone,
  title,
  children,
}: {
  label: ReactNode;
  tone: Tone;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <Frame bg="code">
      <Region {...SAFE}>
        <div className="flex flex-col gap-3">
          <Label tone={tone} className={`text-[28px] ${TEXT_ON_DARK[tone]}`}>
            {label}
          </Label>
          <h2 className="text-[56px] font-bold leading-[1.1]">{title}</h2>
        </div>
        <div className="mt-10 flex flex-1 flex-col gap-8">{children}</div>
      </Region>
    </Frame>
  );
}

/**
 * Live demo placeholder: demo number, title, the route and mode it will use,
 * and the "DEMO EN VIVO" pill. Optional scoreboard pinned at the bottom.
 */
export function DemoSlide({
  number,
  title,
  path,
  mode,
  bg = 'demo',
  scoreboard,
}: {
  number: string;
  title: ReactNode;
  path: string;
  /** What the demo shows, in a few words (tools, mode, API). */
  mode: ReactNode;
  bg?: 'demo' | 'hero';
  scoreboard?: ReactNode;
}) {
  const dark = BACKGROUNDS[bg].dark;
  return (
    <Frame bg={bg}>
      <Region {...SAFE} className="gap-10">
        <div className="flex items-center gap-6">
          <LivePill />
          <Label className={`text-[32px] ${dark ? 'text-gde-blue-light' : ''}`}>{number}</Label>
        </div>
        <h1 className="max-w-[1500px] text-balance text-[88px] font-bold leading-[1.05]">{title}</h1>
        <div className="flex flex-col gap-4">
          <div
            className={`flex w-fit items-center gap-5 rounded-[20px] border-[3px] border-gde-ink px-8 py-4 ${dark ? 'bg-gde-ink' : 'bg-white'}`}
          >
            <Icon name="web" className="h-10 w-10" />
            <Route path={path} className="text-[32px]" />
          </div>
          <p className={`text-[30px] ${dark ? 'text-gde-mist' : 'text-gde-soft'}`}>{mode}</p>
        </div>
        {scoreboard && <div className="mt-auto">{scoreboard}</div>}
      </Region>
    </Frame>
  );
}
