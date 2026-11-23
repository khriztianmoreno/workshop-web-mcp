import '@fontsource-variable/google-sans';
import '@fontsource-variable/google-sans-code';
import '@khriztianmoreno/speaker-kit/styles.css';
import './deck.css';
import { SpeakerView } from '@khriztianmoreno/speaker-kit';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NOTES } from './notes-loader';
import { SLIDES } from './slides';
import { CHANNEL } from './talk';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpeakerView slides={SLIDES} notes={NOTES} channel={CHANNEL} />
  </StrictMode>,
);
