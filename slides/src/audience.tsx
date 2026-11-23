import '@fontsource-variable/google-sans';
import '@fontsource-variable/google-sans-code';
import '@fontsource-variable/roboto-mono';
import '@khriztianmoreno/speaker-kit/styles.css';
import './deck.css';
import { AudienceView } from '@khriztianmoreno/speaker-kit';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SLIDES } from './slides';
import { CHANNEL, SPEAKER_HREF } from './talk';
import { TouchNav, wantsTouchNav } from './touch-nav';

// Same-browser sync only (BroadcastChannel): no Supabase, so the deck works offline.
// The deck draws its own slide number on the canvas, so the kit counter is hidden.
const touch = wantsTouchNav();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AudienceView
      slides={SLIDES}
      channel={CHANNEL}
      speakerHref={SPEAKER_HREF}
      hideCounter
      overlay={touch ? (ctx) => <TouchNav {...ctx} /> : undefined}
    />
  </StrictMode>,
);
