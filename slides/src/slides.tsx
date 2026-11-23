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
  CodeSlide,
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
  SlideMeta,
  SOLID,
  Statement,
  Tech,
  TEXT_ON_DARK,
  type Tone,
} from './primitives';
import { CATCH_UP, REGISTER_TOOL, SETUP } from './snippets';
import { TALK } from './talk';

/*
 * Opening deck for the 90-minute WebMCP workshop (first part of Act 1).
 *
 * Arc: the incident (a chatbot that invents) → the concepts (agent, MCP, the
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
      <Icon name={icon} className="h-16 w-16" />
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
        className={`rounded-[36px] border-[3px] border-gde-ink px-10 py-6 text-[34px] font-medium leading-snug ${
          user ? 'rounded-tl-[8px] bg-white text-gde-ink' : 'rounded-tr-[8px] bg-gde-ink text-white'
        }`}
      >
        {children}
      </p>
    </div>
  );
}

/** Numbered disc used by the step lists (rules, Act 1 tasks). */
function Step({ n, tone, children }: { n: ReactNode; tone: Tone; children: ReactNode }) {
  return (
    <div className="flex items-center gap-6">
      <span
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-gde-ink text-[32px] font-bold ${SOLID[tone]} ${
          tone === 'yellow' ? 'text-gde-ink' : 'text-white'
        }`}
      >
        {n}
      </span>
      <div className="text-[32px] leading-snug">{children}</div>
    </div>
  );
}

// ─── Opening ───────────────────────────────────────────────────────────────

function Cover() {
  return (
    <Frame bg="hero">
      <Region x={160} y={120} w={1600} h={840} className="justify-between">
        <div className="flex items-center gap-4">
          <Pill fill="white">{TALK.event}</Pill>
          <Pill fill="yellow">{TALK.date}</Pill>
          <Pill fill="ink">
            <Icon name="timer" className="h-8 w-8" />
            {TALK.duration}
          </Pill>
        </div>
        <div className="flex flex-col gap-8">
          <Label tone="red" className="text-[36px]">
            Taller · {TALK.subtitle}
          </Label>
          <h1 className="text-[150px] font-bold leading-[1] tracking-tight">
            Misión:
            <br />
            El <Mark tone="red">Checkout</Mark> Roto
          </h1>
          <p className="max-w-[1300px] text-[44px] font-medium leading-tight text-gde-soft">
            Dale ojos y manos a un agente de IA dentro de tu propia página, con <Tech>document.modelContext</Tech>
          </p>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex flex-col gap-4">
            <p className="text-[40px] font-bold">{TALK.speaker}</p>
            <p className="font-gde-code text-[30px] text-gde-soft">{TALK.handle}</p>
          </div>
          <GdeLogo />
        </div>
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
      className="relative w-full overflow-hidden rounded-[32px] border-[3px] border-gde-ink bg-gde-pastel-blue"
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
          <p className="mt-4 font-gde-code text-[32px] text-gde-soft">{TALK.handle}</p>
        </div>
        <dl className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-baseline gap-6">
              <dt className="w-56 shrink-0 font-gde-code text-[26px] text-gde-soft">{item.label}</dt>
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
        <div className="flex flex-col items-center gap-3 rounded-[24px] border-[3px] border-gde-ink bg-gde-ink py-5">
          <img src={siteLogo} alt="" className="h-10 w-auto" />
          <p className="font-gde-code text-[24px] text-gde-mist">{TALK.site}</p>
        </div>
      </Region>
    </Frame>
  );
}

// ─── The incident ──────────────────────────────────────────────────────────

function Ticket() {
  return (
    <Statement label="Lunes, 8:12 a. m. · Llega un ticket de soporte" tone="red">
      <div className="flex items-start gap-8">
        <Disc tone="red" icon="support_agent" className="h-32 w-32" />
        <p className="max-w-[1400px] rounded-[40px] rounded-tl-[8px] border-[3px] border-gde-ink bg-white px-12 py-8 text-[52px] font-bold leading-[1.2] text-gde-ink">
          “El asistente me recomendó el <Mark tone="red">Casco Vulcano Pro</Mark> a 890.000 en talla M. Lo busqué y no existe.”
        </p>
      </div>
      <p className="text-[40px] text-gde-mist">Rodada · tienda de equipo para motociclistas</p>
    </Statement>
  );
}

function ChatbotMudo() {
  const blind: { icon: IconName; text: string }[] = [
    { icon: 'storefront', text: 'No ve el catálogo' },
    { icon: 'visibility', text: 'No sabe qué tallas quedan' },
    { icon: 'touch_app', text: 'No puede hacer nada en la página' },
  ];
  return (
    <Content tone="red" label="El chatbot mudo" title="Un chat que solo habla no puede actuar sobre tu app">
      <div className="flex flex-1 items-center gap-16">
        <div className="flex flex-1 flex-col gap-8">
          <Bubble from="user">¿Qué cascos ECE hay en talla M por menos de 1.200.000?</Bubble>
          <Bubble from="bot">¡Claro! Te recomiendo el Casco Vulcano Pro a 890.000…</Bubble>
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
      <Scoreboard ok={false} question="¿El cliente recibió una respuesta correcta?">
        Sonó segura y era falsa: el modelo no falla, adivina.
      </Scoreboard>
    </Content>
  );
}

// ─── Concepts ──────────────────────────────────────────────────────────────

function Agente() {
  const loop = ['Lee el pedido', 'Elige una herramienta', 'La ejecuta', 'Lee el resultado'];
  return (
    <Content tone="blue" label="Primero, una definición" title="Un agente es un modelo que usa herramientas en un ciclo">
      <div className="flex items-center justify-center gap-8">
        <IconCard icon="psychology" title="Modelo" fill="white" className="w-[420px]">
          Entiende el pedido y decide qué hacer.
        </IconCard>
        <p aria-hidden className="text-[72px] font-bold">
          +
        </p>
        <IconCard icon="build" title="Herramientas" fill="blue" className="w-[420px]">
          Funciones con nombre, descripción y esquema.
        </IconCard>
        <p aria-hidden className="text-[72px] font-bold">
          +
        </p>
        <IconCard icon="sync" title="Ciclo" fill="yellow" className="w-[420px]">
          Repite hasta tener la respuesta.
        </IconCard>
      </div>
      <div className="flex flex-1 items-center gap-4">
        {loop.map((step, i) => (
          <div key={step} className="flex items-center gap-4">
            <Pill fill={i === 1 ? 'blue' : 'white'} className="px-7 py-3 text-[30px]">
              {step}
            </Pill>
            <Arrow className="w-12" />
          </div>
        ))}
        <Pill fill="ink" className="px-7 py-3 text-[30px]">
          <Icon name="sync" className="h-8 w-8" />
          repite
        </Pill>
      </div>
    </Content>
  );
}

function Mcp() {
  return (
    <Content tone="blue" label="MCP · Model Context Protocol" title="Un protocolo para conectar modelos con herramientas">
      <div className="flex flex-1 items-center gap-8">
        <IconCard icon="smart_toy" title="Cliente MCP" fill="white" className="h-[360px] flex-1">
          La app que tiene el modelo: un chat, tu IDE, un agente.
        </IconCard>
        <div className="flex flex-col items-center gap-3">
          <Pill fill="ink" className="px-6 py-2 font-gde-code text-[26px]">
            tools/list · tools/call
          </Pill>
          <Arrow className="w-48" />
        </div>
        <IconCard icon="dns" title="Servidor MCP" fill="blue" className="h-[360px] flex-1">
          Un proceso aparte que expone herramientas: GitHub, una base de datos, tus archivos.
        </IconCard>
      </div>
      <p className="text-[36px] font-medium">
        Hasta hoy, las herramientas vivían <Mark tone="blue">del lado del servidor</Mark>, con su propia autenticación.
      </p>
    </Content>
  );
}

function Brecha() {
  const has: { icon: IconName; title: string; fill: BoxFill; body: ReactNode }[] = [
    { icon: 'storefront', title: 'El estado', fill: 'white', body: <>Catálogo, filtros y carrito ya están en memoria.</> },
    { icon: 'login', title: 'La sesión', fill: 'yellow', body: <>El usuario ya inició sesión. Sus cookies ya están ahí.</> },
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
      <div className="grid flex-1 grid-cols-3 content-center gap-10">
        {has.map((h) => (
          <IconCard key={h.title} icon={h.icon} title={h.title} fill={h.fill} className="h-[340px]">
            {h.body}
          </IconCard>
        ))}
      </div>
      <p className="text-[38px] font-medium">
        ¿Por qué construir <Mark tone="red">otra API y otro servidor</Mark> solo para el agente?
      </p>
    </Content>
  );
}

function Pregunta() {
  return (
    <Frame bg="hero">
      <Region x={160} y={150} w={1600} h={780} className="justify-center gap-10">
        <Label tone="blue" className="text-[32px]">
          La idea
        </Label>
        <h1 className="max-w-[1500px] text-balance text-[120px] font-bold leading-[1.05] tracking-tight">
          ¿Y si la página le diera <Mark tone="yellow">sus propias herramientas</Mark> al agente?
        </h1>
      </Region>
    </Frame>
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
    <Content bg="hero" tone="blue" label="WebMCP" title="La página registra herramientas y el agente las llama">
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

function Anatomia() {
  const parts: { plain: string; tech: string; example: ReactNode; fill: BoxFill }[] = [
    { plain: 'Nombre', tech: 'name', example: <Tech>get_store_info</Tech>, fill: 'white' },
    { plain: 'Para qué sirve', tech: 'description', example: <>Escrita para el modelo, no para humanos</>, fill: 'blue' },
    { plain: 'Qué datos pide', tech: 'inputSchema', example: <>JSON Schema</>, fill: 'yellow' },
    { plain: 'Qué hace', tech: 'execute()', example: <>Llama a tu código de siempre</>, fill: 'green' },
    { plain: 'Cómo tratarla', tech: 'annotations', example: <Tech>readOnlyHint</Tech>, fill: 'red' },
  ];
  return (
    <Content tone="green" label="Anatomía" title="Una herramienta tiene cinco partes">
      <div className="grid flex-1 grid-cols-5 content-center gap-6">
        {parts.map((p) => (
          <Box key={p.tech} fill={p.fill} className="h-[400px] justify-between px-8">
            <p className="text-[40px] font-bold leading-tight">{p.plain}</p>
            <div className="flex flex-col gap-5">
              <Pill fill="ink" className="px-5 py-2 font-gde-code text-[26px]">
                {p.tech}
              </Pill>
              <p className="text-[28px] leading-snug">{p.example}</p>
            </div>
          </Box>
        ))}
      </div>
    </Content>
  );
}

function Registro() {
  return (
    <CodeSlide tone="green" label="registerTool(tool, { signal })" title="Registrar y desregistrar con un AbortSignal">
      <div className="flex flex-1 gap-10">
        <Code code={REGISTER_TOOL} file="DevTools → Console" dense className="flex-1" />
        <div className="flex w-[420px] shrink-0 flex-col justify-center gap-8">
          <Box fill="green" className="gap-3">
            <p className="text-[32px] font-bold leading-tight">No existe unregisterTool()</p>
            <p className="text-[28px] leading-snug">Abortar la señal la quita.</p>
          </Box>
          <Box fill="yellow" className="gap-3">
            <p className="text-[32px] font-bold leading-tight">Nombres únicos</p>
            <p className="text-[28px] leading-snug">Registrar dos veces el mismo nombre lanza un error.</p>
          </Box>
        </div>
      </div>
    </CodeSlide>
  );
}

function LadoAgente() {
  const cols: { title: string; tone: Tone; fill: BoxFill; items: [string, string][] }[] = [
    {
      title: 'El agente usa',
      tone: 'blue',
      fill: 'blue',
      items: [
        ['getTools()', 'lista lo registrado'],
        ['executeTool()', 'ejecuta una herramienta'],
      ],
    },
    {
      title: 'Eventos',
      tone: 'yellow',
      fill: 'yellow',
      items: [
        ['toolchange', 'cambió la lista'],
        ['toolactivated', 'el agente usó una'],
        ['toolcancel', 'se canceló'],
      ],
    },
    {
      title: 'Anotaciones',
      tone: 'red',
      fill: 'red',
      items: [
        ['readOnlyHint', 'solo lee'],
        ['untrustedContentHint', 'devuelve texto ajeno'],
        ['consequentialHint', 'tiene consecuencias'],
      ],
    },
  ];
  return (
    <Content tone="blue" label="El resto de la API" title="El otro lado: lo que ve y usa el agente">
      <div className="grid flex-1 grid-cols-3 content-center gap-8">
        {cols.map((c) => (
          <Box key={c.title} fill={c.fill} className="h-[460px] gap-6">
            <p className="text-[40px] font-bold">{c.title}</p>
            <ul className="flex flex-col gap-5">
              {c.items.map(([tech, plain]) => (
                <li key={tech} className="flex flex-col gap-1">
                  <Tech className="text-[28px] font-bold">{tech}</Tech>
                  <span className="text-[26px] text-gde-soft">{plain}</span>
                </li>
              ))}
            </ul>
          </Box>
        ))}
      </div>
      <p className="text-[32px] font-medium">
        Nuestra tienda escucha <Tech>toolactivated</Tech> para iluminar lo que toca el agente.
      </p>
    </Content>
  );
}

function Estado() {
  const facts: { icon: IconName; title: ReactNode; body: ReactNode; fill: BoxFill }[] = [
    {
      icon: 'menu_book',
      title: 'Borrador del W3C',
      body: <>WebML Community Group, 13 de noviembre de 2026.</>,
      fill: 'white',
    },
    {
      icon: 'api',
      title: <Tech>document.modelContext</Tech>,
      body: (
        <>
          <Tech>navigator.modelContext</Tech> está obsoleto desde Chrome 150.
        </>
      ),
      fill: 'blue',
    },
    {
      icon: 'flag',
      title: 'Origin trial',
      body: (
        <>
          Chrome 149–156. En local: <Tech>#enable-webmcp-testing</Tech>
        </>
      ),
      fill: 'yellow',
    },
    {
      icon: 'close',
      title: 'Solo herramientas',
      body: (
        <>
          <Tech>provideContext</Tech> y los recursos se eliminaron.
        </>
      ),
      fill: 'red',
    },
  ];
  return (
    <Content tone="yellow" label="Con honestidad" title="WebMCP todavía es experimental">
      <div className="grid flex-1 grid-cols-2 content-center gap-8">
        {facts.map((f, i) => (
          <Box key={i} fill={f.fill} className="flex-row items-center gap-8">
            <Icon name={f.icon} className="h-16 w-16 shrink-0" />
            <div className="flex flex-col gap-2">
              <p className="text-[36px] font-bold leading-tight">{f.title}</p>
              <p className="text-[28px] leading-snug">{f.body}</p>
            </div>
          </Box>
        ))}
      </div>
      <p className="text-[32px] font-medium">
        Hoy no necesitas la flag: el taller trae un <Mark tone="green">polyfill</Mark> con la forma de la especificación.
      </p>
    </Content>
  );
}

/** One column of the comparison: icon header + bullet list. */
function CompareColumn({ icon, title, fill, items }: { icon: IconName; title: string; fill: BoxFill; items: string[] }) {
  return (
    <Box fill={fill} size="lg" className="gap-8">
      <div className="flex items-center gap-5">
        <Icon name={icon} className="h-14 w-14" />
        <p className="text-[48px] font-bold">{title}</p>
      </div>
      <ul className="flex flex-col gap-5 text-[30px] leading-snug">
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
    <Content tone="green" label="No compiten, se complementan" title="WebMCP o MCP de servidor: ¿cuándo cada uno?">
      <div className="grid flex-1 grid-cols-2 content-center gap-10">
        <CompareColumn icon="web" title="WebMCP" fill="green" items={web} />
        <CompareColumn icon="dns" title="MCP de servidor" fill="blue" items={server} />
      </div>
    </Content>
  );
}

function Seguridad() {
  return (
    <Statement label="Un aviso para más tarde" tone="red">
      <h1 className="max-w-[1600px] text-balance text-[104px] font-bold leading-[1.05]">
        La amenaza real no es el usuario.
        <br />
        <span className={TEXT_ON_DARK.red}>Es el texto que lee el agente.</span>
      </h1>
      <div className="flex flex-wrap gap-6">
        <Pill fill="white" className="px-8 py-4 text-[32px]">
          <Icon name="warning" className="h-9 w-9" />
          Inyección de prompts
        </Pill>
        <Pill fill="white" className="px-8 py-4 text-[32px]">
          <Icon name="verified_user" className="h-9 w-9" />
          Las anotaciones son pistas, no controles
        </Pill>
      </div>
      <p className="text-[36px] text-gde-mist">Guarda esta idea. En el Acto 4 alguien va a intentar darle órdenes a tu agente.</p>
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
      <Pill fill="ink" className="px-5 py-1 font-gde-code text-[24px]">
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

function Mision() {
  const acts: { n: string; name: string; min: string; tag: string; goal: string; tone: Tone }[] = [
    { n: '1', name: 'El incidente', min: "15'", tag: 'acto-1', goal: 'Tu primera herramienta', tone: 'red' },
    { n: '2', name: 'Darle ojos', min: "25'", tag: 'acto-2', goal: 'Herramientas de lectura', tone: 'blue' },
    { n: '3', name: 'Darle manos', min: "30'", tag: 'acto-3', goal: 'Herramientas de escritura', tone: 'green' },
    { n: '4', name: 'El sabotaje', min: "15'", tag: 'acto-4', goal: 'Defensa en profundidad', tone: 'red' },
    { n: '5', name: 'Cierre', min: "5'", tag: 'final', goal: 'Producción y próximos pasos', tone: 'yellow' },
  ];
  return (
    <Content bg="hero" tone="red" label="La misión" title="Cinco actos para pasar de un chatbot que inventa a un agente útil y seguro">
      <div className="grid flex-1 grid-cols-5 content-center gap-6">
        {acts.map((a) => (
          <Box key={a.n} fill="white" className="h-[400px] justify-between px-7">
            <div className="flex items-center justify-between">
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-gde-ink text-[32px] font-bold ${SOLID[a.tone]} ${
                  a.tone === 'yellow' ? 'text-gde-ink' : 'text-white'
                }`}
              >
                {a.n}
              </span>
              <p className="font-gde-code text-[36px] font-bold tabular-nums">{a.min}</p>
            </div>
            <p className="text-[36px] font-bold leading-tight">{a.name}</p>
            <p className="text-[26px] leading-snug text-gde-soft">{a.goal}</p>
            <Pill fill="ink" className="px-5 py-1 font-gde-code text-[24px]">
              {a.tag}
            </Pill>
          </Box>
        ))}
      </div>
    </Content>
  );
}

function Dinamica() {
  return (
    <CodeSlide tone="yellow" label="Reglas del juego" title="Cada acto termina a tiempo. Nadie se queda atrás.">
      <div className="flex flex-1 gap-12">
        <div className="flex flex-1 flex-col justify-center gap-8">
          <Step n="1" tone="blue">
            Cada <b>tag</b> es el punto de partida de un acto y la solución del anterior.
          </Step>
          <Step n="2" tone="green">
            ¿Te quedaste atrás? Guarda tu avance y salta al tag siguiente.
          </Step>
          <Step n="3" tone="yellow">
            Las guías están en <Tech>docs/</Tech>: una por acto, con la solución plegada.
          </Step>
          <Step n="4" tone="red">
            ¿Atascado? Levanta la mano o trabaja con tu vecino.
          </Step>
          <Step n="5" tone="blue">
            ¿Sin clave o sin Wi-Fi? <b>Modo simulado</b>: el taller funciona igual.
          </Step>
        </div>
        <div className="flex w-[760px] shrink-0 flex-col justify-center gap-6">
          <Code code={CATCH_UP} lang="sh" file="Ponerse al día" compact />
          <Code code={'npm run server:mock   # agente simulado, sin red'} lang="sh" file="Plan B" compact />
        </div>
      </div>
    </CodeSlide>
  );
}

function Setup() {
  const room: { icon: IconName; label: string; value: string }[] = [
    { icon: 'fork_right', label: 'Repo', value: TALK.repoUrl },
    { icon: 'key', label: 'Proxy', value: TALK.proxyUrl },
    { icon: 'wifi', label: 'Wi-Fi', value: TALK.wifi },
  ];
  return (
    <CodeSlide tone="green" label="Verificación rápida · Node 22.12 o superior" title="¿Todo listo? Verifica tu entorno">
      <Code code={SETUP} lang="sh" file="Terminal" size="lg" />
      <div className="flex flex-wrap gap-6">
        {room.map((r) => (
          <Pill key={r.label} fill="white" className="px-7 py-3 text-[28px]">
            <Icon name={r.icon} className="h-8 w-8" />
            <span className="text-gde-soft">{r.label}</span>
            <span className="font-gde-code">{r.value}</span>
          </Pill>
        ))}
      </div>
    </CodeSlide>
  );
}

function Vamos() {
  return (
    <Frame bg="hero">
      <Region x={160} y={120} w={1600} h={840} className="justify-between">
        <div className="flex items-center gap-6">
          <Label tone="red" className="text-[32px]">
            Acto 1 · El incidente · 15 min
          </Label>
          <Pill fill="ink" className="px-6 py-2 font-gde-code text-[26px]">
            docs/01-acto-1-incidente.md
          </Pill>
        </div>
        <h1 className="text-[120px] font-bold leading-[1] tracking-tight">
          ¡A <Mark tone="yellow">rodar</Mark>!
        </h1>
        <div className="flex flex-col gap-6">
          <Step n="1" tone="red">
            Reproduce el incidente con <b>“{DEMO_PROMPT_LABELS.catalog}”</b>:
            <p className="mt-2 rounded-[20px] border-[3px] border-gde-ink bg-white px-6 py-3 text-[30px] italic">“{DEMO_PROMPTS.catalog}”</p>
          </Step>
          <Step n="2" tone="blue">
            Escribe el hook <Tech>useWebMcpTools</Tech> con <Tech>AbortSignal</Tech>
          </Step>
          <Step n="3" tone="green">
            Registra <Tech>get_store_info</Tech> y agrégala a <Tech>storeTools</Tech>
          </Step>
          <Step n="4" tone="yellow">
            Verifica con <b>“{DEMO_PROMPT_LABELS.storeInfo}”</b>: la píldora brilla y dice “Ejecutado por agente”
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
  { id: 'ticket', Component: Ticket, title: 'El ticket del Casco Vulcano Pro', section: INCIDENTE },
  { id: 'chatbot-mudo', Component: ChatbotMudo, title: 'El chatbot mudo ❌', section: INCIDENTE },
  // Concepts
  { id: 'agente', Component: Agente, title: 'Qué es un agente', section: CONCEPTOS },
  { id: 'mcp', Component: Mcp, title: 'Qué es MCP', section: CONCEPTOS },
  { id: 'brecha', Component: Brecha, title: 'La brecha: la app ya lo tiene todo', section: CONCEPTOS },
  { id: 'pregunta', Component: Pregunta, title: '¿Y si la página diera las herramientas?', section: WEBMCP },
  { id: 'que-es', Component: QueEs, title: 'Qué es WebMCP', section: WEBMCP },
  { id: 'anatomia', Component: Anatomia, title: 'Anatomía de una herramienta', section: WEBMCP },
  { id: 'registro', Component: Registro, title: 'registerTool + AbortSignal', section: WEBMCP },
  { id: 'lado-agente', Component: LadoAgente, title: 'getTools, eventos y anotaciones', section: WEBMCP },
  { id: 'estado', Component: Estado, title: 'Estado de la especificación', section: WEBMCP },
  { id: 'vs-mcp', Component: VsMcp, title: 'WebMCP vs. MCP de servidor', section: WEBMCP },
  { id: 'seguridad', Component: Seguridad, title: 'Avance: inyección de prompts', section: WEBMCP },
  // The workshop
  { id: 'arquitectura', Component: Arquitectura, title: 'Arquitectura del taller', section: TALLER },
  { id: 'mision', Component: Mision, title: 'La misión: cinco actos', section: TALLER },
  { id: 'dinamica', Component: Dinamica, title: 'Reglas del juego', section: TALLER },
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
