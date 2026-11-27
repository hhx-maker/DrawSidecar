export interface ToolDefinition<P, R> {
  id: string;
  label: string;
  validate: (params: unknown) => params is P;
  run: (params: P) => Promise<R>;
}

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<unknown, unknown>>();

  register<P, R>(tool: ToolDefinition<P, R>): void {
    if (this.tools.has(tool.id)) throw new Error(`工具已注册：${tool.id}`);
    this.tools.set(tool.id, tool as ToolDefinition<unknown, unknown>);
  }

  get<P, R>(id: string): ToolDefinition<P, R> | undefined {
    return this.tools.get(id) as ToolDefinition<P, R> | undefined;
  }

  list(): ToolDefinition<unknown, unknown>[] { return [...this.tools.values()]; }
}

export const phase1ToolRegistry = new ToolRegistry();
phase1ToolRegistry.register({
  id: 'ping',
  label: 'Worker 检查',
  validate: (params: unknown): params is Record<string, never> => typeof params === 'object' && params !== null,
  run: async () => ({ ok: true })
});
