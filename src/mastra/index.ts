import { Mastra } from '@mastra/core/mastra';
import { VercelDeployer } from '@mastra/deployer-vercel';
import { buildMastraConfig } from './create-mastra';

const config = await buildMastraConfig();

export const mastra = new Mastra({
  ...config,
  deployer: new VercelDeployer({
    studio: true,
  }),
});