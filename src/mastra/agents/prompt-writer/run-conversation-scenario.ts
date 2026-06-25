import { createTestMastra } from '../../create-test-mastra';
import { createPromptWriterAgent } from './index';
import { createScriptedMockModel } from './test-utils';

export type ConversationStep = {
  user: string;
  model: string;
  phase?: string;
  assert?: (response: { text: string }) => void | Promise<void>;
};

export type ConversationScenario = {
  name: string;
  steps: ConversationStep[];
};

export type RunConversationScenarioOptions = {
  memory?: {
    resource: string;
    thread: string;
  };
};

const PHASES_REQUIRING_ASSERT = new Set([
  'category-disambiguation',
  'category-confirmation',
  'refined-prompt',
]);

function validateScenario(scenario: ConversationScenario): void {
  if (scenario.steps.length === 0) {
    throw new Error(`Scenario "${scenario.name}" must have at least one step`);
  }

  const finalStep = scenario.steps[scenario.steps.length - 1];
  if (!finalStep.assert) {
    throw new Error(
      `Scenario "${scenario.name}" final step must include an assert callback`,
    );
  }

  for (const step of scenario.steps) {
    if (step.phase && PHASES_REQUIRING_ASSERT.has(step.phase) && !step.assert) {
      throw new Error(
        `Scenario "${scenario.name}" step with phase "${step.phase}" must include an assert callback`,
      );
    }
  }
}

function createIsolatedMemory(
  scenario: ConversationScenario,
  override?: RunConversationScenarioOptions['memory'],
) {
  if (override) {
    return override;
  }

  const slug = scenario.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  return {
    resource: 'scripted-test-user',
    thread: `${slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  };
}

export async function runConversationScenario(
  scenario: ConversationScenario,
  options: RunConversationScenarioOptions = {},
): Promise<{
  text: string;
  memory: { resource: string; thread: string };
}> {
  validateScenario(scenario);

  const model = createScriptedMockModel(scenario.steps.map((step) => step.model));
  const testMastra = await createTestMastra({
    agents: {
      promptWriterAgent: createPromptWriterAgent({ model }),
    },
  });
  const agent = testMastra.getAgentById('prompt-writer');
  const memory = createIsolatedMemory(scenario, options.memory);

  let lastResponse = { text: '' };

  for (const step of scenario.steps) {
    lastResponse = await agent.generate(step.user, { memory });
    if (step.assert) {
      await step.assert(lastResponse);
    }
  }

  return { ...lastResponse, memory };
}