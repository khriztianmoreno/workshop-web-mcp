/**
 * Event facts shown on the slides. Fill the `[…]` placeholders before the
 * workshop: they are projected as-is on the setup slide.
 */
export const TALK = {
  title: 'Misión: El Checkout Roto',
  subtitle: 'WebMCP hands-on',
  event: 'DevFest Bogotá 2026',
  date: '28 nov 2026',
  duration: '90 min',
  speaker: 'Cristian Moreno',
  handle: '@khriztianmoreno',
  site: 'khriztianmoreno.dev',
  /** Public clone URL of this repository. */
  repoUrl: 'github.com/khriztianmoreno/workshop-web-mcp',
  /** Instructor proxy for attendees without a Gemini key (AGENT_BASE_URL). Never put the real token here: share it privately. */
  proxyUrl: 'workshop-webmcp.khriztianmoreno.cloud/t/<token>',
  wifi: '[red · clave]',
  /** Published live guide (npm run build:guide → GitHub Pages). Locally: http://localhost:5173/guide/ */
  guideUrl: 'khriztianmoreno.github.io/workshop-web-mcp',
} as const;

/** Sync channel shared by the audience and speaker views. Must match on both. */
export const CHANNEL = 'rodada-webmcp-workshop';

/** Speaker view path, opened with the "S" key from the deck. */
export const SPEAKER_HREF = '/slides/speaker.html';
