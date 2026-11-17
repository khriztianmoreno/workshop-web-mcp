import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { startAgentActivity } from './webmcp/activity';
import { installWebMcp } from './webmcp/polyfill';
import './styles.css';

// 1. Make sure document.modelContext exists (native, adapted or polyfilled).
const { mode, modelContext } = installWebMcp();
console.info(`[webmcp] mode: ${mode}`);

// 2. Visual feedback for every tool an agent runs (listens to "toolactivated").
startAgentActivity(modelContext);

// 3. StrictMode on purpose: tool registration must survive mount → unmount → mount.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App webMcpMode={mode} />
  </StrictMode>,
);
