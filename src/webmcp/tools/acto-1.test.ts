import { describe, expect, it } from 'vitest';
import { PolyfillModelContext } from '../polyfill';
import { getStoreInfoTool } from './get-store-info';
import { storeTools } from './index';
import { run } from './test-utils';

describe('Act 1 · first tool', () => {
  it('get_store_info is read-only and returns hours and shipping', async () => {
    expect(getStoreInfoTool.name).toBe('get_store_info');
    expect(getStoreInfoTool.annotations?.readOnlyHint).toBe(true);
    const info = await run(getStoreInfoTool, {});
    expect(info.openingHours).toMatch(/Lunes a sábado/);
    expect(info.shipping).toHaveLength(2);
  });

  it('every registered store tool has a unique, valid name', async () => {
    const mc = new PolyfillModelContext();
    for (const tool of storeTools) await mc.registerTool(tool);
    const names = (await mc.getTools()).map((tool) => tool.name);
    expect(names).toContain('get_store_info');
    expect(new Set(names).size).toBe(names.length);
  });
});
