import { beforeEach, describe, expect, it } from 'vitest';
import { mockAgent } from '../../server/mock-agent';
import type { ChatMessage } from '../../shared/agent-protocol';
import { DEMO_PROMPTS } from '../../shared/demo-prompts';
import { getCartSummary } from '../store/selectors';
import { getState, resetStore } from '../store/store';
import { respondToConfirmation } from '../ui/confirmation';
import { PolyfillModelContext } from '../webmcp/polyfill';
import { storeTools } from '../webmcp/tools';
import { runAgentTurn } from './agent-loop';

/** End-to-end: real tools + polyfill + in-browser loop + the scripted mock agent. */
async function ask(prompt: string, confirmTool = async () => true) {
  const modelContext = new PolyfillModelContext();
  for (const tool of storeTools) await modelContext.registerTool(tool);
  const history: ChatMessage[] = [{ role: 'user', text: prompt }];
  const texts: string[] = [];
  await runAgentTurn({
    modelContext,
    history,
    sendChat: async (request) => mockAgent(request),
    confirmTool,
    onModelText: (text) => texts.push(text),
  });
  return texts.join('\n');
}

beforeEach(() => {
  respondToConfirmation(false);
  resetStore();
});

describe('workshop flow (final)', () => {
  it('boss prompt: filters, cart, coupon and drawer update in cascade', async () => {
    const text = await ask(DEMO_PROMPTS.boss);
    const state = getState();
    expect(state.filters).toMatchObject({ category: 'cascos', certification: 'ECE 22.06', maxPrice: 1200000, size: 'M' });
    expect(state.cart.map((line) => `${line.productId}:${line.size}`)).toEqual(['casco-altamira-gtr:M', 'guantes-altamira-track:M']);
    expect(state.couponCode).toBe('BIENVENIDA10');
    expect(state.cartOpen).toBe(true);
    expect(getCartSummary(state).total).toBe(1170000);
    expect(text).toContain('BIENVENIDA10');
  });

  // TODO(acto-4): `git checkout final -- src/agent/workshop-flow.test.ts` once the defenses are in place.
  it.todo('injection prompt: the untrusted review is ignored, 1 unit added, no checkout');
});
