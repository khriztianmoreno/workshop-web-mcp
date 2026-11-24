import { useEffect, useState, type FC, type ReactNode } from 'react';
import { DEMO_PROMPTS, DEMO_PROMPT_LABELS } from '../../shared/demo-prompts';
import photoPortrait from './assets/image2.jpg';
import photoStage from './assets/image1.jpg';
import siteLogo from './assets/logo.png';
import { Code } from './code';
import { Icon, type IconName } from './icons';
import {
  Arrow,
  Box,
  type BoxFill,
  Content,
  Disc,
  Frame,
  GdeLogo,
  Label,
  Mark,
  Pill,
  type PillFill,
  Region,
  Scoreboard,
  type Section,
  EVENT_LOCATION,
  SlideMeta,
  NumberDisc,
  Statement,
  Tech,
  type Tone,
} from './primitives';
import { CATCH_UP, REGISTER_TOOL, SETUP } from './snippets';
import { TALK } from './talk';

/*
 * Opening deck for the 90-minute WebMCP workshop: the first ~9 minutes of
 * Act 1, so attendees keep ~6 minutes of hands-on time.
 *
 * Arc: the incident (an honest but useless chatbot) → the concepts (agent + MCP, the
 * gap, WebMCP and its API) → how this repo is built → the mission, the rules
 * and the setup → straight into Act 1.
 *
 * Copy rules (same as the talk deck): one message per slide, neutral Spanish
 * (no voseo), API and product names in English, plain words first and the
 * technical name second. API facts follow the W3C WebML CG draft of
 * 13 Nov 2026 (README.md, "Sobre la especificación").
 */

// ─── Sections (badge on every slide of the section) ───────────────────────

const INCIDENTE: Section = { name: 'Acto 1', detail: 'El incidente' };
const CONCEPTOS: Section = { name: 'Conceptos' };
const WEBMCP: Section = { name: 'Conceptos', detail: 'WebMCP' };
const TALLER: Section = { name: 'El taller' };

// ─── Shared pieces ─────────────────────────────────────────────────────────

/** Icon + title + one line, inside a Box. */
function IconCard({
  icon,
  title,
  fill,
  children,
  className = '',
}: {
  icon: IconName;
  title: ReactNode;
  fill: BoxFill;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Box fill={fill} className={`gap-5 ${className}`}>
      <Icon name={icon} className="h-16 w-16 shrink-0" />
      <p className="text-[40px] font-bold leading-tight">{title}</p>
      <div className="text-[30px] leading-snug">{children}</div>
    </Box>
  );
}

/** A chat bubble: the customer (left, white) or the assistant (right, ink). */
function Bubble({ from, children }: { from: 'user' | 'bot'; children: ReactNode }) {
  const user = from === 'user';
  return (
    <div className={`flex items-start gap-6 ${user ? '' : 'flex-row-reverse'}`}>
      <Disc tone={user ? 'yellow' : 'blue'} icon={user ? 'person' : 'smart_toy'} className="h-24 w-24" />
      <p
        className={`rounded-[36px] border-[3px] border-df-ink px-10 py-6 text-[34px] font-medium leading-snug ${
          user ? 'rounded-tl-[8px] bg-white text-df-ink' : 'rounded-tr-[8px] bg-df-ink text-df-offwhite'
        }`}
      >
        {children}
      </p>
    </div>
  );
}

/** Numbered disc used by the step lists (Act 1 tasks). */
function Step({ n, tone, children }: { n: ReactNode; tone: Tone; children: ReactNode }) {
  return (
    <div className="flex items-center gap-6">
      <NumberDisc n={n} tone={tone} />
      <div className="text-[32px] leading-snug">{children}</div>
    </div>
  );
}

// ─── Opening ───────────────────────────────────────────────────────────────

function Cover() {
  return (
    <Frame bg="title">
      {/* Upper-right panel: x 672–1844, y 79–348. */}
      <Region x={740} y={79} w={1040} h={269} className="justify-center gap-4">
        <p className="text-[40px] font-medium leading-tight">
          Dale ojos y manos a un agente de IA dentro de tu propia página
        </p>
        <p className="font-df-mono text-[26px] font-light text-df-soft">
          {['Taller · ' + TALK.duration, 'WebMCP', 'document.modelContext'].join('  ·  ')}
        </p>
      </Region>
      {/* Lower panel: x 75–1844, y 348–1003 (GDG logo notch bottom-right). */}
      <Region x={167} y={400} w={1563}>
        <h1 className="text-balance text-[120px] font-bold leading-[1.02] tracking-tight">
          Misión: El <Mark tone="red">Checkout</Mark> Roto
        </h1>
        <p className="mt-6 font-df-mono text-[40px] font-light">{TALK.subtitle}</p>
      </Region>
      <Region x={171} y={786} w={1100} className="gap-2">
        <p className="font-df-mono text-[36px] font-light">
          {TALK.speaker} · {TALK.handle}
        </p>
        <p className="font-df-mono text-[26px] font-light text-df-soft">
          GDE Web Technologies · DevFest {EVENT_LOCATION} · {TALK.date}
        </p>
      </Region>
    </Frame>
  );
}

function PhotoCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), 3000);
    return () => clearInterval(t);
  }, [images.length]);

  return (
    <div
      className="relative w-full overflow-hidden rounded-[32px] border-[3px] border-df-ink bg-df-pastel-blue"
      style={{ aspectRatio: '3/4' }}
    >
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
          style={{ opacity: i === idx ? 1 : 0 }}
        />
      ))}
      <div aria-hidden className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((src, i) => (
          <span
            key={src}
            className={`h-2 rounded-full bg-white transition-all duration-300 ${i === idx ? 'w-8 opacity-100' : 'w-2 opacity-40'}`}
          />
        ))}
      </div>
    </div>
  );
}

function AboutMe() {
  const items = [
    { label: 'Rol', value: 'Senior Software Engineer & Tech Lead · Honest' },
    { label: 'GDE', value: 'Google Developer Expert · Web Technologies' },
    { label: 'Comunidad', value: 'Organizador y speaker · MedellínJS · JSConf Colombia' },
    { label: 'Foco actual', value: 'IA en la web · WebMCP · APIs de IA integradas en Chrome' },
  ];
  const tags: { text: string; fill: PillFill }[] = [
    { text: 'GDE Web', fill: 'white' },
    { text: 'WebMCP', fill: 'blue' },
    { text: 'Agentes en la web', fill: 'yellow' },
  ];

  return (
    <Frame bg="content">
      <Region x={160} y={130} w={1150} h={820} className="justify-center gap-8">
        <GdeLogo />
        <Label tone="blue">¿Quién los acompaña hoy?</Label>
        <div>
          <h1 className="text-[88px] font-bold leading-none">{TALK.speaker}</h1>
          <p className="mt-4 font-df-code text-[32px] text-df-soft">{TALK.handle}</p>
        </div>
        <dl className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-baseline gap-6">
              <dt className="w-56 shrink-0 font-df-code text-[26px] text-df-soft">{item.label}</dt>
              <dd className="text-[32px]">{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-4">
          {tags.map((t) => (
            <Pill key={t.text} fill={t.fill}>
              {t.text}
            </Pill>
          ))}
        </div>
      </Region>
      <Region x={1400} y={130} w={360} className="gap-4">
        <PhotoCarousel images={[photoPortrait, photoStage]} />
        <div className="flex flex-col items-center gap-3 rounded-[24px] border-[3px] border-df-ink bg-df-ink py-5">
          <img src={siteLogo} alt="" className="h-10 w-auto" />
          <p className="font-df-code text-[24px] text-df-soft">{TALK.site}</p>
        </div>
      </Region>
    </Frame>
  );
}

// ─── The incident ──────────────────────────────────────────────────────────

/** The support ticket and the honest but useless chatbot in one slide. */
function Incidente() {
  const blind: { icon: IconName; text: string }[] = [
    { icon: 'storefront', text: 'No ve el catálogo' },
    { icon: 'visibility', text: 'No sabe qué tallas quedan' },
    { icon: 'touch_app', text: 'No puede actuar en la página' },
  ];
  return (
    <Content tone="red" label="Lunes, 8:12 a. m. · Ticket de soporte" title="Le pidió que lo hiciera. Le respondió: hazlo tú.">
      <div className="flex flex-1 items-center gap-16">
        <div className="flex flex-1 flex-col gap-8">
          <Bubble from="user">Agrega un casco ECE y guantes talla M, y aplica el cupón.</Bubble>
          <Bubble from="bot">No puedo agregar productos ni aplicar cupones. Hazlo en la web.</Bubble>
        </div>
        <div className="flex w-[560px] flex-col gap-5">
          {blind.map((b) => (
            <Pill key={b.text} fill="white" className="justify-start px-8 py-4 text-[32px]">
              <Icon name={b.icon} className="h-10 w-10" />
              {b.text}
            </Pill>
          ))}
        </div>
      </div>
      <Scoreboard ok={false} question="¿El cliente pudo comprar?">
        Ya estaba en la web. Abandonó el carrito: el modelo no ve ni toca la página.
      </Scoreboard>
    </Content>
  );
}

// ─── Concepts ──────────────────────────────────────────────────────────────

/** Agent = model + tools + loop, and MCP as the standard way to ship the tools. */
function Agente() {
  return (
    <Content tone="blue" label="Primero, dos definiciones" title="Un agente es un modelo que usa herramientas en un ciclo">
      <div className="flex items-stretch justify-center gap-8">
        <IconCard icon="psychology" title="Modelo" fill="white" className="w-[420px]">
          Entiende el pedido y decide.
        </IconCard>
        <p aria-hidden className="self-center text-[72px] font-bold">
          +
        </p>
        <IconCard icon="build" title="Herramientas" fill="blue" className="w-[420px]">
          Funciones con nombre y esquema.
        </IconCard>
        <p aria-hidden className="self-center text-[72px] font-bold">
          +
        </p>
        <IconCard icon="sync" title="Ciclo" fill="yellow" className="w-[420px]">
          Pide, ejecuta, lee, repite.
        </IconCard>
      </div>
      <div className="flex w-fit max-w-[1180px] flex-col gap-4 rounded-[28px] border-[3px] border-df-ink bg-white px-10 py-5">
        <p className="text-[30px] font-bold">
          <Mark tone="blue">MCP</Mark> las estandariza en un servidor aparte, con su propia auth
        </p>
        <div className="flex items-center gap-6">
        <Pill fill="white" className="px-6 py-2 text-[28px]">
          <Icon name="smart_toy" className="h-8 w-8" />
          Cliente
        </Pill>
        <div className="flex flex-col items-center">
          <Tech className="text-[24px] text-df-soft">tools/list · tools/call</Tech>
          <Arrow className="w-48" />
        </div>
        <Pill fill="blue" className="px-6 py-2 text-[28px]">
          <Icon name="dns" className="h-8 w-8" />
          Servidor MCP
        </Pill>
        </div>
      </div>
    </Content>
  );
}

/** The app already has everything; ends on the question that introduces WebMCP. */
function Brecha() {
  const has: { icon: IconName; title: string; fill: BoxFill; body: ReactNode }[] = [
    { icon: 'storefront', title: 'El estado', fill: 'white', body: <>Catálogo, filtros y carrito ya en memoria.</> },
    { icon: 'login', title: 'La sesión', fill: 'yellow', body: <>El usuario ya inició sesión.</> },
    {
      icon: 'touch_app',
      title: 'Las acciones',
      fill: 'green',
      body: (
        <>
          Los botones ya llaman a <Tech>addToCart()</Tech>.
        </>
      ),
    },
  ];
  return (
    <Content tone="yellow" label="La brecha" title="Tu app web ya tiene todo lo que el agente necesita">
      <div className="grid grid-cols-3 gap-10">
        {has.map((h) => (
          <IconCard key={h.title} icon={h.icon} title={h.title} fill={h.fill} className="h-[290px]">
            {h.body}
          </IconCard>
        ))}
      </div>
      <h3 className="mt-auto max-w-[1600px] text-balance text-[64px] font-bold leading-[1.1]">
        ¿Y si la página le diera <Mark tone="yellow">sus propias herramientas</Mark> al agente?
      </h3>
    </Content>
  );
}

function QueEs() {
  const steps: { icon: IconName; title: string; fill: BoxFill; body: ReactNode }[] = [
    {
      icon: 'web',
      title: 'La página',
      fill: 'white',
      body: (
        <>
          Registra lo que sabe hacer: <Tech>search_products</Tech>
        </>
      ),
    },
    {
      icon: 'public',
      title: 'El navegador',
      fill: 'blue',
      body: (
        <>
          Las guarda en <Tech>document.modelContext</Tech>
        </>
      ),
    },
    { icon: 'smart_toy', title: 'El agente', fill: 'yellow', body: <>Las llama como funciones. Sin clics, sin scraping.</> },
  ];
  return (
    <Content tone="blue" label="WebMCP" title="La página registra herramientas y el agente las llama">
      <div className="flex flex-1 items-center gap-6">
        {steps.map((s, i) => (
          <div key={s.title} className="flex flex-1 items-center gap-6">
            <IconCard icon={s.icon} title={s.title} fill={s.fill} className="h-[340px] flex-1">
              {s.body}
            </IconCard>
            {i < steps.length - 1 && <Arrow className="w-20" />}
          </div>
        ))}
      </div>
      <p className="text-[36px] font-medium">
        Corre <Mark tone="green">en la pestaña, con la sesión del usuario</Mark> y la misma lógica de la UI.
      </p>
    </Content>
  );
}

/** Anatomy of a tool + registration with an AbortSignal, around one code card. */
function Registro() {
  const parts: [string, string][] = [
    ['name', 'Nombre único'],
    ['description', 'Escrita para el modelo'],
    ['inputSchema', 'Qué datos pide'],
    ['execute()', 'Tu código de siempre'],
    ['annotations', 'Cómo tratarla'],
  ];
  return (
    <Content tone="green" label="Anatomía · registerTool(tool, { signal }) · DevTools → Console" title="Cinco partes y un AbortSignal">
      <div className="flex flex-1 gap-10">
        <Code code={REGISTER_TOOL} dense compact className="flex-1 self-start" />
        <div className="flex w-[420px] shrink-0 flex-col gap-2">
          {parts.map(([tech, plain]) => (
            <div key={tech} className="flex flex-col leading-tight">
              <Tech className="text-[26px] font-bold">{tech}</Tech>
              <span className="text-[24px] text-df-soft">{plain}</span>
            </div>
          ))}
          <Box fill="green" className="mt-1 gap-1 px-7 py-3">
            <p className="text-[28px] font-bold leading-tight">No existe unregisterTool()</p>
            <p className="text-[24px] leading-tight">Abortar la señal la quita.</p>
          </Box>
        </div>
      </div>
    </Content>
  );
}

/** Agent side of the API, with the spec status as a compact footer strip. */
function LadoAgente() {
  const cols: { title: string; fill: BoxFill; items: [string, string][] }[] = [
    {
      title: 'El agente usa',
      fill: 'blue',
      items: [
        ['getTools()', 'lista lo registrado'],
        ['executeTool()', 'ejecuta una herramienta'],
      ],
    },
    {
      title: 'Eventos',
      fill: 'yellow',
      items: [
        ['toolchange', 'cambió la lista'],
        ['toolactivated', 'el agente usó una'],
        ['toolcancel', 'se canceló'],
      ],
    },
    {
      title: 'Anotaciones',
      fill: 'red',
      items: [
        ['readOnlyHint', 'solo lee'],
        ['untrustedContentHint', 'devuelve texto ajeno'],
        ['consequentialHint', 'tiene consecuencias'],
      ],
    },
  ];
  const status: ReactNode[] = [
    <>Borrador W3C · 13 nov 2026</>,
    <>Origin trial · Chrome 149–156</>,
    <>
      <Tech>navigator.modelContext</Tech> obsoleto
    </>,
    <>Sin provideContext: solo herramientas</>,
    <Tech>chrome://flags/#enable-webmcp-testing</Tech>,
  ];
  return (
    <Content tone="blue" label="El resto de la API" title="El otro lado: lo que ve y usa el agente">
      <div className="grid grid-cols-3 gap-8">
        {cols.map((c) => (
          <Box key={c.title} fill={c.fill} className="gap-2 py-5">
            <p className="text-[34px] font-bold">{c.title}</p>
            <ul className="flex flex-col gap-2">
              {c.items.map(([tech, plain]) => (
                <li key={tech} className="flex flex-col leading-tight">
                  <Tech className="text-[28px] font-bold">{tech}</Tech>
                  <span className="text-[26px] text-df-soft">{plain}</span>
                </li>
              ))}
            </ul>
          </Box>
        ))}
      </div>
      <Box fill="white" className="w-[1180px] gap-2 px-8 py-4">
        <Label tone="yellow" className="text-[26px]">
          Estado: experimental
        </Label>
        <ul className="grid grid-cols-[auto_1fr] gap-x-10 gap-y-1 text-[24px] leading-tight">
          {status.map((s, i) => (
            <li key={i}>— {s}</li>
          ))}
          <li className="font-bold">— Polyfill incluido: sin flags</li>
        </ul>
      </Box>
    </Content>
  );
}

/** One column of the comparison: icon header + bullet list. */
function CompareColumn({ icon, title, fill, items }: { icon: IconName; title: string; fill: BoxFill; items: string[] }) {
  return (
    <Box fill={fill} className="gap-6">
      <div className="flex items-center gap-5">
        <Icon name={icon} className="h-12 w-12 shrink-0" />
        <p className="text-[44px] font-bold">{title}</p>
      </div>
      <ul className="flex flex-col gap-4 text-[28px] leading-snug">
        {items.map((t) => (
          <li key={t} className="flex gap-4">
            <span aria-hidden>—</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Box>
  );
}

function VsMcp() {
  const web = [
    'Corre en la pestaña, con la sesión del usuario',
    'Reutiliza el estado y las acciones de la UI',
    'El usuario ve lo que hace el agente',
    'Necesita la página abierta',
  ];
  const server = [
    'Corre sin navegador: agentes en segundo plano',
    'Ideal para backends, datos y automatización',
    'Su propia autenticación y despliegue',
    'No ve lo que el usuario tiene en pantalla',
  ];
  return (
    <Frame bg="two-panel">
      {/* Left panel: x 75–922, y 79–1003. */}
      <Region x={140} y={140} w={720} h={740} className="gap-8">
        <Label tone="green">No compiten, se complementan</Label>
        <h1 className="text-balance text-[60px] font-bold leading-[1.08]">¿WebMCP o MCP de servidor?</h1>
        <CompareColumn icon="web" title="WebMCP" fill="green" items={web} />
      </Region>
      {/* Right panel: x 997–1844, content above the GDG logo notch (y 844). */}
      <Region x={1050} y={140} w={740} h={680} className="justify-center">
        <CompareColumn icon="dns" title="MCP de servidor" fill="blue" items={server} />
      </Region>
    </Frame>
  );
}

function Seguridad() {
  return (
    <Statement label="Un aviso para más tarde" tone="red">
      <h1 className="text-balance text-[68px] font-bold leading-[1.08]">
        La amenaza real no es el usuario. <Mark tone="red">Es el texto que lee el agente.</Mark>
      </h1>
      <div className="flex flex-col gap-4">
        <Pill fill="white" className="px-7 py-3 text-[28px]">
          <Icon name="warning" className="h-8 w-8" />
          Inyección de prompts
        </Pill>
        <Pill fill="white" className="px-7 py-3 text-[28px]">
          <Icon name="verified_user" className="h-8 w-8" />
          Las anotaciones son pistas, no controles
        </Pill>
      </div>
      <p className="text-[32px] leading-snug">Guarda esta idea. En el Acto 4 alguien va a intentar darle órdenes a tu agente.</p>
    </Statement>
  );
}

// ─── The workshop ──────────────────────────────────────────────────────────

/** One block of the architecture diagram: what it is, where it lives, one line. */
function ArchBox({ icon, title, path, fill, children }: { icon: IconName; title: string; path: string; fill: BoxFill; children: ReactNode }) {
  return (
    <Box fill={fill} className="h-[390px] flex-1 gap-4 px-7">
      <Icon name={icon} className="h-14 w-14" />
      <p className="text-[34px] font-bold leading-tight">{title}</p>
      <Pill fill="ink" className="px-5 py-1 font-df-code text-[24px]">
        {path}
      </Pill>
      <div className="text-[26px] leading-snug">{children}</div>
    </Box>
  );
}

function Arquitectura() {
  return (
    <Content tone="blue" label="Cómo está armado este repo" title="Todo corre en tu navegador, menos la clave">
      <div className="flex flex-1 items-center gap-4">
        <ArchBox icon="storefront" title="Tienda Rodada" path="src/store" fill="white">
          React. Los botones y las herramientas usan <b>las mismas acciones</b>.
        </ArchBox>
        <Arrow className="w-10" />
        <ArchBox icon="extension" title="Polyfill" path="src/webmcp" fill="green">
          <Tech>document.modelContext</Tech> con la forma de la spec. Funciona sin flags.
        </ArchBox>
        <Arrow className="w-10" />
        <ArchBox icon="forum" title="Panel de chat" path="src/agent" fill="yellow">
          El ciclo del agente: <Tech>getTools()</Tech> → modelo → <Tech>executeTool()</Tech>. Máximo 8 pasos.
        </ArchBox>
        <Arrow className="w-10" />
        <ArchBox icon="key" title="Proxy" path="server/" fill="blue">
          Hono en el puerto 8787. Guarda la clave de Gemini. Sin clave: <b>Modo simulado</b>.
        </ArchBox>
      </div>
      <p className="text-[32px] font-medium">
        El proxy no toca la página; <Mark tone="yellow">la página nunca ve la clave.</Mark>
      </p>
    </Content>
  );
}

/** The five acts (timeline) + the rules of the game (tag catch-up). */
function Mision() {
  const acts: { n: string; name: string; min: string; tag: string; tone: Tone }[] = [
    { n: '1', name: 'El incidente', min: "15'", tag: 'acto-1', tone: 'red' },
    { n: '2', name: 'Darle ojos', min: "25'", tag: 'acto-2', tone: 'blue' },
    { n: '3', name: 'Darle manos', min: "30'", tag: 'acto-3', tone: 'green' },
    { n: '4', name: 'El sabotaje', min: "15'", tag: 'acto-4', tone: 'red' },
    { n: '5', name: 'Cierre', min: "5'", tag: 'final', tone: 'yellow' },
  ];
  const rules: { icon: IconName; text: ReactNode }[] = [
    { icon: 'menu_book', text: <>Guías en <Tech>docs/</Tech>, una por acto</> },
    { icon: 'group', text: <>¿Atascado? Levanta la mano</> },
    { icon: 'wifi_off', text: <>¿Sin clave o sin red? Modo simulado</> },
  ];
  return (
    <Content tone="red" label="La misión · 90 minutos" title="Cinco actos. Nadie se queda atrás.">
      <div className="grid grid-cols-5 gap-6">
        {acts.map((a) => (
          <Box key={a.n} fill="white" className="h-[230px] justify-between px-7 py-6">
            <div className="flex items-center justify-between">
              <NumberDisc n={a.n} tone={a.tone} className="h-14 w-14 text-[28px]" />
              <p className="font-df-code text-[32px] font-bold tabular-nums">{a.min}</p>
            </div>
            <p className="text-[34px] font-bold leading-tight">{a.name}</p>
            <Pill fill="ink" className="px-5 py-1 font-df-code text-[24px]">
              {a.tag}
            </Pill>
          </Box>
        ))}
      </div>
      <div className="mt-auto flex items-stretch gap-8">
        <div className="flex flex-1 flex-col gap-3">
          <p className="text-[30px] font-bold">Cada tag es el inicio de un acto. ¿Te quedaste atrás? Salta:</p>
          <Code code={CATCH_UP} lang="sh" compact />
        </div>
        <div className="flex w-[560px] shrink-0 flex-col justify-end gap-4">
          {rules.map((r, i) => (
            <Pill key={i} fill="white" className="justify-start px-6 py-2 text-[26px]">
              <Icon name={r.icon} className="h-8 w-8" />
              {r.text}
            </Pill>
          ))}
        </div>
      </div>
    </Content>
  );
}

function Setup() {
  const room: { icon: IconName; label: string; value: string }[] = [
    { icon: 'menu_book', label: 'Guía', value: TALK.guideUrl },
    { icon: 'fork_right', label: 'Repo', value: TALK.repoUrl },
    { icon: 'key', label: 'Proxy', value: TALK.proxyUrl },
    { icon: 'wifi', label: 'Wi-Fi', value: TALK.wifi },
  ];
  return (
    <Content tone="green" label="Verificación rápida · Node 22.12 o superior" title="¿Todo listo? Verifica tu entorno">
      <Code code={SETUP} lang="sh" file="Terminal" size="lg" />
      <div className="flex flex-wrap gap-5">
        {room.map((r) => (
          <Pill key={r.label} fill="white" className="px-7 py-3 text-[26px]">
            <Icon name={r.icon} className="h-8 w-8" />
            <span className="text-df-soft">{r.label}</span>
            <span className="font-df-code">{r.value}</span>
          </Pill>
        ))}
      </div>
    </Content>
  );
}

function Vamos() {
  return (
    <Frame bg="title-arrow">
      {/* Upper-right panel: x 1357–1844, y 79–308 (after the arrow and globe). */}
      <Region x={1357} y={79} w={487} h={229} className="items-center justify-center gap-2">
        <Label tone="red" className="text-[34px]">
          Acto 1 · 6 min
        </Label>
        <p className="font-df-mono text-[22px] font-light text-df-soft">Manos a la obra</p>
      </Region>
      {/* Lower panel: x 75–1844, y 308–1003 (GDG logo notch bottom-right). */}
      <Region x={167} y={350} w={1563} className="gap-8">
        <div className="flex items-center gap-8">
          <h1 className="text-[104px] font-bold leading-none tracking-tight">
            ¡A <Mark tone="yellow">rodar</Mark>!
          </h1>
          <Pill fill="ink" className="px-6 py-2 font-df-code text-[24px]">
            docs/01-acto-1-incidente.md
          </Pill>
        </div>
        <div className="flex w-[1200px] flex-col gap-5">
          <Step n="1" tone="red">
            Reproduce el incidente con <b>“{DEMO_PROMPT_LABELS.boss}”</b> (sí, el del Acto 3):
            <p className="mt-2 rounded-[20px] border-[3px] border-df-ink bg-white px-6 py-3 text-[26px] italic">“{DEMO_PROMPTS.boss}”</p>
          </Step>
          <Step n="2" tone="blue">
            Escribe el hook <Tech>useWebMcpTools</Tech> con <Tech>AbortSignal</Tech>
          </Step>
          <Step n="3" tone="green">
            Registra <Tech>get_store_info</Tech> y agrégala a <Tech>storeTools</Tech>
          </Step>
          <Step n="4" tone="yellow">
            Verifica con <b>“{DEMO_PROMPT_LABELS.storeInfo}”</b>: la píldora brilla
          </Step>
        </div>
      </Region>
    </Frame>
  );
}

// ─── Registry ──────────────────────────────────────────────────────────────

export type DeckSlide = {
  id: string;
  Component: FC;
  title: string;
  /** Section badge; omitted on cover, about-me and closing slides. */
  section?: Section;
};

const DECK: DeckSlide[] = [
  { id: 'cover', Component: Cover, title: 'Misión: El Checkout Roto' },
  { id: 'about-me', Component: AboutMe, title: 'Quién les habla' },
  // The incident
  { id: 'incidente', Component: Incidente, title: 'El incidente: «hazlo tú» ❌', section: INCIDENTE },
  // Concepts
  { id: 'agente', Component: Agente, title: 'Agente y MCP', section: CONCEPTOS },
  { id: 'brecha', Component: Brecha, title: 'La brecha y la pregunta', section: CONCEPTOS },
  { id: 'que-es', Component: QueEs, title: 'Qué es WebMCP', section: WEBMCP },
  { id: 'registro', Component: Registro, title: 'Anatomía + registerTool', section: WEBMCP },
  { id: 'lado-agente', Component: LadoAgente, title: 'Lado del agente + estado', section: WEBMCP },
  { id: 'vs-mcp', Component: VsMcp, title: 'WebMCP vs. MCP de servidor', section: WEBMCP },
  { id: 'seguridad', Component: Seguridad, title: 'Avance: inyección de prompts', section: WEBMCP },
  // The workshop
  { id: 'arquitectura', Component: Arquitectura, title: 'Arquitectura del taller', section: TALLER },
  { id: 'mision', Component: Mision, title: 'La misión y las reglas', section: TALLER },
  { id: 'setup', Component: Setup, title: 'Verificación del entorno', section: TALLER },
  { id: 'vamos', Component: Vamos, title: '¡A rodar! Acto 1' },
];

/** Cover and closing carry no slide number. */
const UNNUMBERED = new Set(['cover', 'vamos']);

/** Provides the slide number and section to Frame, which draws them on the canvas. */
function withMeta(Slide: FC, number: number, section?: Section): FC {
  function SlideWithMeta() {
    return (
      <SlideMeta.Provider value={{ number, section }}>
        <Slide />
      </SlideMeta.Provider>
    );
  }
  SlideWithMeta.displayName = `Slide${number}`;
  return SlideWithMeta;
}

export const SLIDES: DeckSlide[] = DECK.map((entry, i) => ({
  ...entry,
  Component: withMeta(entry.Component, UNNUMBERED.has(entry.id) ? 0 : i + 1, entry.section),
}));
