// Speaker notes: one markdown file per slide id, imported as raw strings (Vite `?raw`).
import cover from '../notes/cover.md?raw';
import aboutMe from '../notes/about-me.md?raw';
import incidente from '../notes/incidente.md?raw';
import agente from '../notes/agente.md?raw';
import brecha from '../notes/brecha.md?raw';
import queEs from '../notes/que-es.md?raw';
import registro from '../notes/registro.md?raw';
import ladoAgente from '../notes/lado-agente.md?raw';
import vsMcp from '../notes/vs-mcp.md?raw';
import seguridad from '../notes/seguridad.md?raw';
import arquitectura from '../notes/arquitectura.md?raw';
import mision from '../notes/mision.md?raw';
import setup from '../notes/setup.md?raw';
import vamos from '../notes/vamos.md?raw';

export const NOTES: Record<string, string> = {
  cover,
  'about-me': aboutMe,
  incidente,
  agente,
  brecha,
  'que-es': queEs,
  registro,
  'lado-agente': ladoAgente,
  'vs-mcp': vsMcp,
  seguridad,
  arquitectura,
  mision,
  setup,
  vamos,
};
