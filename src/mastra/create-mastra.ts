import { Mastra } from '@mastra/core/mastra';
import type { Config } from '@mastra/core/mastra';
import { PostgresStore } from '@mastra/pg';
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

export type MastraConfigWithoutDeployer = Omit<Config, 'deployer'>;

export function resolveAgents(agents?: CreateMastraOptions['agents']) {
  return agents ?? { promptWriterAgent };
}

function requireDatabaseUrl(): string {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is required. Add your Neon connection string to .env — see .env.example.',
    );
  }
  return connectionString;
}

async function createProductionStorage(
  storage?: CreateMastraOptions['storage'],
): Promise<CreateMastraOptions['storage']> {
  if (storage) {
    return storage;
  }

  return new PostgresStore({
    id: 'mastra-storage',
    connectionString: requireDatabaseUrl(),
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

export async function buildMastraConfig(
  options: CreateMastraOptions = {},
): Promise<MastraConfigWithoutDeployer> {
  return {
    agents: resolveAgents(options.agents),
    storage: await createProductionStorage(options.storage),
    logger: new PinoLogger({
      name: 'Mastra',
      level: 'info',
    }),
    observability: options.observability ?? createProductionObservability(),
    scorers: options.scorers ?? promptWriterScorers,
  };
}

export async function createMastra(
  options: CreateMastraOptions = {},
): Promise<Mastra> {
  return new Mastra(await buildMastraConfig(options));
}