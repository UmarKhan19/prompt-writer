import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import type { CreateMastraOptions } from './create-mastra';
import { resolveAgents } from './create-mastra';

export async function createTestMastra(
  overrides: Partial<CreateMastraOptions> = {},
): Promise<Mastra> {
  return new Mastra({
    agents: resolveAgents(overrides.agents),
    storage:
      overrides.storage ??
      new LibSQLStore({
        id: 'prompt-writer-test-storage',
        url: ':memory:',
      }),
    scorers: overrides.scorers,
    ...(overrides.observability !== undefined
      ? { observability: overrides.observability }
      : {}),
  });
}