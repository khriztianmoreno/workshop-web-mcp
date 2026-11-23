import { useEffect } from 'react';
import { Icon } from './icons';

/**
 * Touch navigation for phones and tablets (no arrow keys).
 *
 * speaker-kit's AudienceView only listens to keydown and does not expose
 * goNext/goPrev, so we dispatch the same ArrowRight/ArrowLeft events it handles.
 * Rendered through AudienceView's `overlay` slot, which gives us index/total.
 */
const press = (key: 'ArrowRight' | 'ArrowLeft') => window.dispatchEvent(new KeyboardEvent('keydown', { key }));

const SWIPE_MIN_PX = 50;

/** Touch devices get the buttons; `?touch` forces them on a laptop (handy for testing). */
export function wantsTouchNav(): boolean {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).has('touch')) return true;
  return window.matchMedia?.('(pointer: coarse)').matches ?? false;
}

export function TouchNav({ index, total }: { index: number; total: number }) {
  // Horizontal swipe anywhere on the slide.
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
      press(dx < 0 ? 'ArrowRight' : 'ArrowLeft');
    };
    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchend', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchend', onEnd);
    };
  }, []);

  const button =
    'flex h-11 w-11 items-center justify-center rounded-full border-2 border-gde-ink bg-white text-gde-ink shadow disabled:opacity-30';

  return (
    <nav
      aria-label="Navegación de slides"
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-white/80 px-2 py-1.5 backdrop-blur"
    >
      <button type="button" aria-label="Slide anterior" className={button} disabled={index === 0} onClick={() => press('ArrowLeft')}>
        <Icon name="chevron_left" className="h-6 w-6" />
      </button>
      <span className="min-w-[4.5rem] text-center font-gde-code text-sm tabular-nums text-gde-ink">
        {index + 1} / {total}
      </span>
      <button
        type="button"
        aria-label="Slide siguiente"
        className={button}
        disabled={index === total - 1}
        onClick={() => press('ArrowRight')}
      >
        <Icon name="chevron_right" className="h-6 w-6" />
      </button>
    </nav>
  );
}
