import { Mastra } from '@mastra/core/mastra';
import type { Config } from '@mastra/core/mastra';
import { MastraCompositeStore } from '@mastra/core/storage';
import { DuckDBStore } from '@mastra/duckdb';
import { VercelDeployer } from '@mastra/deployer-vercel';
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import {
  Observability,
  MastraStorageExporter,
  MastraPlatformExporter,
  SensitiveDataFilter,
} from '@mastra/observability';
import { promptWriterAgent } from './agents/prompt-writer';
import { promptWriterScorers } from './agents/prompt-writer/scorers';

export type CreateMastraOptions = Pick<
  Config,
  'storage' | 'observability' | 'scorers' | 'agents'
>;

function resolveAgents(agents?: CreateMastraOptions['agents']) {
  return agents ?? { promptWriterAgent };
}

async function createProductionStorage(
  storage?: CreateMastraOptions['storage'],
): Promise<CreateMastraOptions['storage']> {
  if (storage) {
    return storage;
  }

  return new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: 'mastra-storage',
      url: 'file:./mastra.db',
    }),
    domains: {
      observability: await new DuckDBStore().getStore('observability'),
    },
  });
}

function createProductionObservability() {
  return new Observability({
    configs: {
      default: {
        serviceName: 'mastra',
        exporters: [
          new MastraStorageExporter(),
          new MastraPlatformExporter(),
        ],
        spanOutputProcessors: [new SensitiveDataFilter()],
      },
    },
  });
}

export async function createMastra(
  options: CreateMastraOptions = {},
): Promise<Mastra> {
  return new Mastra({
    deployer: new VercelDeployer({
      studio: true,
    }),
    agents: resolveAgents(options.agents),
    storage: await createProductionStorage(options.storage),
    logger: new PinoLogger({
      name: 'Mastra',
      level: 'info',
    }),
    observability: options.observability ?? createProductionObservability(),
    scorers: options.scorers ?? promptWriterScorers,
  });
}

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