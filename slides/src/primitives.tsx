import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import contentBg from './assets/devfest/content.webp';
import statementRedBg from './assets/devfest/statement-red.webp';
import titleArrowBg from './assets/devfest/title-arrow.webp';
import titleBg from './assets/devfest/title.webp';
import twoPanelBg from './assets/devfest/two-panel.webp';
import gdeLogo from './assets/gde-logo.png';
import { Icon, type IconName } from './icons';

/*
 * Visual language: official "DevFest 2026" template, ported from the
 * "On-Device AI con Gemini Nano" talk deck.
 *
 * - Every slide is a fixed 1920×1080 canvas scaled to fit (Frame). Positions below
 *   are canvas pixels measured from the template backgrounds, so they stay exact
 *   on any viewport, including the 1440×900 speaker preview stage.
 * - Backgrounds are the template's own images (assets/devfest, WebP): the
 *   @DevFest badge, illustrations and GDG logo come from them. HTML content is
 *   placed inside their white panels.
 * - The city in the @DevFest badge is HTML (EVENT_LOCATION), never baked into
 *   the images: the badge pill in every background is empty.
 * - Headlines Google Sans Bold, subheads Roboto Mono Light, body Google Sans,
 *   all text #1e1e1e. Shapes: white / pastel fills with a 3px #1e1e1e outline.
 *
 * Background → slides:
 *   title       → cover
 *   content     → explanation slides (most of the deck)
 *   two-panel   → WebMCP vs. server MCP
 *   statement-red → the security teaser
 *   title-arrow → "¡A rodar!"
 */

/** City shown in the pill under the @DevFest badge. Empty hides it. */
export const EVENT_LOCATION = 'Bogotá';

// ─── Canvas and backgrounds ────────────────────────────────────────────────

const CANVAS = { w: 1920, h: 1080 };

/** Location pill under the @DevFest badge, in canvas px (measured on the template PNGs). */
type PillBox = { x: number; y: number; w: number; h: number };
const BADGE_TITLE: PillBox = { x: 178, y: 233, w: 320, h: 46 };
const BADGE_STATEMENT: PillBox = { x: 1420, y: 233, w: 312, h: 45 };

export type Background = 'title' | 'title-arrow' | 'content' | 'statement-red' | 'two-panel';

const BACKGROUNDS: Record<Background, { src: string; color: string; badge?: PillBox }> = {
  title: { src: titleBg, color: '#f2f1f0', badge: BADGE_TITLE },
  'title-arrow': { src: titleArrowBg, color: '#f2f1f0', badge: BADGE_TITLE },
  content: { src: contentBg, color: '#f2f1f0' },
  'statement-red': { src: statementRedBg, color: '#fed7d7', badge: BADGE_STATEMENT },
  'two-panel': { src: twoPanelBg, color: '#f2f1f0' },
};

let backgroundsPreloaded = false;

/** Fetch and decode every background (and the GDE logo) once, so no slide paints its text before its art. */
function preloadBackgrounds() {
  if (backgroundsPreloaded) return;
  backgroundsPreloaded = true;
  for (const src of [...Object.values(BACKGROUNDS).map((b) => b.src), gdeLogo]) {
    const img = new Image();
    img.src = src;
    img.decode().catch(() => console.warn(`[slides] asset failed to load: ${img.src}`));
  }
}

/** Backgrounds whose panel leaves room for the footer (bottom-left, clear of the GDG logo). */
const NUMBERED_BACKGROUNDS = new Set<Background>(['content', 'two-panel']);

/** Section marker, shown next to the slide number in the footer ("Conceptos · WebMCP"). */
export type Section = { name: string; detail?: string };

/** Slide number (0 = unnumbered) and section, provided by the registry. */
export const SlideMeta = createContext<{ number: number; section?: Section }>({ number: 0 });

// ─── Tokens ────────────────────────────────────────────────────────────────

/** Accent tone: one of the four Google colors. */
export type Tone = 'blue' | 'green' | 'red' | 'yellow';

const PASTEL: Record<Tone, string> = {
  blue: 'bg-df-pastel-blue',
  green: 'bg-df-pastel-green',
  red: 'bg-df-pastel-red',
  yellow: 'bg-df-pastel-yellow',
};

/** Halftone fills: accent dots, markers, pills and numbered discs (ink text on top). */
export const HALFTONE: Record<Tone, string> = {
  blue: 'bg-df-halftone-blue',
  green: 'bg-df-halftone-green',
  red: 'bg-df-halftone-red',
  yellow: 'bg-df-halftone-yellow',
};

// ─── Frame ─────────────────────────────────────────────────────────────────

/**
 * Slide surface: fills the viewport (or the speaker preview stage), paints the
 * letterbox with the background color and scales the 1920×1080 canvas to fit.
 * Draws the city in the @DevFest badge and, on panel backgrounds, the footer
 * with the slide number and section.
 */
export function Frame({ bg, children }: { bg: Background; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);
  const { number, section } = useContext(SlideMeta);
  const { src, color, badge } = BACKGROUNDS[bg];

  useEffect(preloadBackgrounds, []);

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
    <div ref={ref} className="deck-frame relative w-full overflow-hidden" style={{ backgroundColor: color }}>
      <div
        className="absolute left-1/2 top-1/2 overflow-hidden font-df text-df-ink"
        style={{
          width: CANVAS.w,
          height: CANVAS.h,
          backgroundImage: `url(${src})`,
          backgroundSize: '100% 100%',
          transform: `translate(-50%, -50%) scale(${scale ?? 1})`,
          visibility: scale === null ? 'hidden' : undefined,
        }}
      >
        {badge && EVENT_LOCATION && (
          <p
            className="absolute flex items-center justify-center text-[24px] font-medium"
            style={{ left: badge.x, top: badge.y, width: badge.w, height: badge.h }}
          >
            {EVENT_LOCATION}
          </p>
        )}
        {children}
        {number > 0 && NUMBERED_BACKGROUNDS.has(bg) && (
          <p className="absolute left-[132px] top-[930px] font-df-mono text-[22px] font-light tabular-nums text-df-soft">
            {String(number).padStart(2, '0')}
            {section && (
              <>
                {'  ·  '}
                {section.name}
                {section.detail && ` · ${section.detail}`}
              </>
            )}
          </p>
        )}
      </div>
    </div>
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

/** Subhead: Roboto Mono Light, with an optional accent dot. At most one per slide. */
export function Label({ tone, children, className = 'text-[28px]' }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <p className={`flex items-center gap-4 font-df-mono font-light ${className}`}>
      {tone && <span aria-hidden className={`h-5 w-5 shrink-0 rounded-full border-[3px] border-df-ink ${HALFTONE[tone]}`} />}
      {children}
    </p>
  );
}

/** Highlighted phrase: halftone marker behind ink text. */
export function Mark({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <mark className={`rounded-lg px-2 text-df-ink [box-decoration-break:clone] ${HALFTONE[tone]}`}>{children}</mark>;
}

/** Inline technical name (API, property): code face, never cut. */
export function Tech({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <code className={`whitespace-nowrap font-df-code ${className}`}>{children}</code>;
}

/**
 * Content slide on the plain template panel (x 75–1844, y 79–1003; GDG logo notch
 * bottom-right). Content stays inside y 130–830 so it never reaches the notch.
 */
export function Content({
  label,
  tone,
  title,
  children,
}: {
  label?: ReactNode;
  tone: Tone;
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Frame bg="content">
      <Region x={155} y={130} w={1610} h={700}>
        <div className="flex flex-col gap-4">
          {label && <Label tone={tone}>{label}</Label>}
          {title && <h2 className="max-w-[1500px] text-balance text-[68px] font-bold leading-[1.1]">{title}</h2>}
        </div>
        <div className="mt-10 flex flex-1 flex-col gap-8">{children}</div>
      </Region>
    </Frame>
  );
}

/** Statement: text between the festoon edges (x 230–1110); badge and illustration on the right. */
export function Statement({ label, tone = 'red', children }: { label?: ReactNode; tone?: Tone; children: ReactNode }) {
  return (
    <Frame bg="statement-red">
      <Region x={230} y={110} w={880} h={860} className="justify-center gap-8">
        {label && <Label tone={tone}>{label}</Label>}
        {children}
      </Region>
    </Frame>
  );
}

/** Large outlined circle with an icon. */
export function Disc({ tone, icon, className = 'h-72 w-72' }: { tone: Tone | 'white'; icon: IconName; className?: string }) {
  const fill = tone === 'white' ? 'bg-white' : PASTEL[tone];
  return (
    <div aria-hidden className={`flex shrink-0 items-center justify-center rounded-full border-[3px] border-df-ink ${fill} ${className}`}>
      <Icon name={icon} className="h-1/2 w-1/2" />
    </div>
  );
}

/** GDE credential: the logo is white, so it sits on a dark label (template "dark label"). */
export function GdeLogo({ className = 'h-9' }: { className?: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border-[3px] border-df-ink bg-df-ink px-7 py-3">
      <img src={gdeLogo} alt="Google Developer Experts" className={`w-auto ${className}`} />
    </span>
  );
}

// ─── Template component library (boxes, labels, arrows) ───────────────────

/** Box fill: pastel tone, white, or ink (dark). */
export type BoxFill = Tone | 'white' | 'ink';

const BOX_SURFACE: Record<BoxFill, string> = {
  ...PASTEL,
  white: 'bg-white',
  ink: 'bg-df-ink text-df-offwhite',
};

/** Rounded outlined box: "lg" = Large Box (hero shape), "md" = Medium Box (grid items). */
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
  return <div className={`flex flex-col border-[3px] border-df-ink ${shape} ${BOX_SURFACE[fill]} ${className}`}>{children}</div>;
}

/** Pill fill: halftone tone, white, or ink (dark label). */
export type PillFill = Tone | 'white' | 'ink';

const PILL_SURFACE: Record<PillFill, string> = {
  ...HALFTONE,
  white: 'bg-white',
  ink: 'bg-df-ink text-df-offwhite',
};

/** Outlined pill label (Google Sans Medium). */
export function Pill({ fill, children, className = 'px-8 py-3 text-[26px]' }: { fill: PillFill; children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex w-fit items-center justify-center gap-3 whitespace-nowrap rounded-full border-[3px] border-df-ink font-medium ${PILL_SURFACE[fill]} ${className}`}
    >
      {children}
    </span>
  );
}

/** Thin 3px ink arrow (template "Arrows"). */
export function Arrow({ className = 'w-16' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 12" className={`shrink-0 text-df-ink ${className}`} fill="none">
      <path d="M0 6h58" stroke="currentColor" strokeWidth="3" />
      <path d="M56 1l7 5-7 5z" fill="currentColor" />
    </svg>
  );
}

/** Numbered halftone disc (rules, acts, tasks). */
export function NumberDisc({ n, tone, className = 'h-16 w-16 text-[32px]' }: { n: ReactNode; tone: Tone; className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full border-[3px] border-df-ink font-bold text-df-ink ${HALFTONE[tone]} ${className}`}
    >
      {n}
    </span>
  );
}

/**
 * Scoreboard: a question + a big ✅ / ❌ and one line of evidence, in a white
 * outlined box (template Medium Box).
 */
export function Scoreboard({ ok, question, children }: { ok: boolean; question: ReactNode; children: ReactNode }) {
  return (
    <div className="flex w-fit items-center gap-8 rounded-[28px] border-[3px] border-df-ink bg-white py-5 pl-5 pr-12">
      <span
        className={`flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-full border-[3px] border-df-ink ${
          ok ? HALFTONE.green : HALFTONE.red
        }`}
      >
        <Icon name={ok ? 'check' : 'close'} className="h-16 w-16" label={ok ? 'Sí' : 'No'} />
      </span>
      <div className="flex flex-col gap-2">
        <p className="text-[34px] font-bold leading-tight">{question}</p>
        <p className="text-[28px] leading-snug text-df-soft">{children}</p>
      </div>
    </div>
  );
}
