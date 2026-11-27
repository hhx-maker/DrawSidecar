import { describe, expect, it } from 'vitest';
import { ToolRegistry } from '../../src/tools/registry';

describe('ToolRegistry', () => {
  it('rejects duplicate IDs and retrieves registered tools', () => {
    const registry = new ToolRegistry();
    const tool = { id: 'x', label: 'X', validate: (_: unknown): _ is null => true, run: async () => 1 };
    registry.register(tool);
    expect(registry.get('x')?.label).toBe('X');
    expect(() => registry.register(tool)).toThrow('工具已注册');
  });
});
