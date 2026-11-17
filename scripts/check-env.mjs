#!/usr/bin/env node
/**
 * Pre-workshop environment check. Uses only Node built-ins so it works before `npm install`.
 * Exit code 1 only for blocking problems; warnings never fail.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIN_NODE = [22, 12, 0];
const REQUIRED_PACKAGES = ['react', 'vite', 'vitest', '@google/genai', 'hono', 'tsx', 'concurrently'];

const color = (code) => (text) => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
const green = color(32);
const yellow = color(33);
const red = color(31);
const bold = color(1);

let errors = 0;
let warnings = 0;
const ok = (msg) => console.log(`${green('✔')} ${msg}`);
const warn = (msg, tip) => {
  warnings += 1;
  console.log(`${yellow('⚠')} ${msg}${tip ? `\n    ${tip}` : ''}`);
};
const fail = (msg, tip) => {
  errors += 1;
  console.log(`${red('✖')} ${msg}${tip ? `\n    ${tip}` : ''}`);
};

function parseEnvFile(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

console.log(bold('\nRodada · Taller WebMCP · verificación del entorno\n'));

// 1. Node
const current = process.versions.node.split('.').map(Number);
const nodeOk = current[0] > MIN_NODE[0] || (current[0] === MIN_NODE[0] && (current[1] > MIN_NODE[1] || current[1] === MIN_NODE[1]));
if (nodeOk) ok(`Node ${process.versions.node}`);
else fail(`Node ${process.versions.node} es muy antiguo. Se necesita ${MIN_NODE.join('.')} o superior.`, 'Instala Node 22 LTS o 24 LTS desde https://nodejs.org o con nvm/fnm.');

// 2. Dependencies
const require = createRequire(join(root, 'package.json'));
const missing = REQUIRED_PACKAGES.filter((name) => {
  try {
    require.resolve(`${name}/package.json`);
    return false;
  } catch {
    return !existsSync(join(root, 'node_modules', name));
  }
});
if (!existsSync(join(root, 'node_modules'))) fail('No encontré node_modules.', 'Ejecuta: npm install');
else if (missing.length > 0) fail(`Faltan dependencias: ${missing.join(', ')}`, 'Ejecuta: npm install');
else ok('Dependencias instaladas');

// 3. .env
const envPath = join(root, '.env');
let fileEnv = {};
if (!existsSync(envPath)) {
  warn('No existe el archivo .env (opcional).', 'Ejecuta: cp env.example .env  — sin clave el asistente usa el "Modo simulado".');
} else {
  fileEnv = parseEnvFile(envPath);
  ok('Archivo .env encontrado');
}
const env = { ...fileEnv, ...process.env };
const mode = (env.AGENT_MODE || '').toLowerCase();
if (mode === 'mock') ok('AGENT_MODE=mock: usarás el agente simulado (no necesita internet).');
else if (env.GEMINI_API_KEY) ok(`GEMINI_API_KEY configurada (modelo: ${env.GEMINI_MODEL || 'gemini-3.8-flash'})`);
else if (env.AGENT_BASE_URL || env.VITE_AGENT_URL) ok(`Usarás el proxy del instructor: ${env.AGENT_BASE_URL || env.VITE_AGENT_URL}`);
else warn('Sin GEMINI_API_KEY: el proxy usará el "Modo simulado".', 'Es suficiente para el taller. Clave gratuita (opcional): https://aistudio.google.com/apikey');

// 4. Proxy reachability
const proxyUrl = (env.AGENT_BASE_URL || env.VITE_AGENT_URL || `http://localhost:${env.PORT || 8787}`).replace(/\/$/, '');
try {
  const response = await fetch(`${proxyUrl}/api/health`, { signal: AbortSignal.timeout(2500) });
  const health = await response.json();
  ok(`Proxy disponible en ${proxyUrl} (${health.mode === 'mock' ? 'modo simulado' : `Gemini · ${health.model}`})`);
} catch {
  if (env.AGENT_BASE_URL || env.VITE_AGENT_URL) {
    fail(`No pude conectar con el proxy remoto ${proxyUrl}.`, 'Revisa la URL o tu conexión. Alternativa: deja vacías AGENT_BASE_URL/VITE_AGENT_URL y usa el modo simulado.');
  } else {
    warn(`El proxy local (${proxyUrl}) no está corriendo.`, 'Es normal si aún no ejecutaste "npm run dev". Vuelve a correr "npm run check" con la app encendida.');
  }
}

// 5. Browser reminder
console.log(
  `\n${bold('Navegador:')} usa Chrome actualizado. Para probar WebMCP nativo activa ${bold('chrome://flags/#enable-webmcp-testing')}.\n` +
    'Sin la flag la app funciona igual con el polyfill incluido.\n',
);

if (errors > 0) {
  console.log(red(bold(`Hay ${errors} problema(s) por resolver antes del taller.\n`)));
  process.exit(1);
}
console.log(green(bold(`Todo listo${warnings ? ` (con ${warnings} aviso(s))` : ''}. ¡Nos vemos en el DevFest Bogotá!\n`)));
