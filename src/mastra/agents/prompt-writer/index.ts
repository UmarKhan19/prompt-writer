import { Agent } from '@mastra/core/agent';
import type { AgentConfig } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { loadPromptWriterInstructions } from './load-instructions';
import { resolvePromptWriterModels } from './resolve-model';
import { createPromptWriterWorkspace } from './workspace';

type PromptWriterAgentOptions = {
  model?: AgentConfig['model'];
};

export function createPromptWriterAgent(
  options: PromptWriterAgentOptions = {},
): Agent {
  return new Agent({
    id: 'prompt-writer',
    name: 'Prompt Writer Agent',
    instructions: loadPromptWriterInstructions(),
    model: options.model ?? resolvePromptWriterModels(),
    workspace: createPromptWriterWorkspace(),
    memory: new Memory({
      options: {
        lastMessages: 50,
      },
    }),
  });
}

export const promptWriterAgent = createPromptWriterAgent();