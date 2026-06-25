import { describe, expect, test } from 'bun:test';
import { createMockModel } from '@mastra/core/test-utils/llm-mock';
import { createMastra } from '../../create-mastra';
import { createTestMastra } from '../../create-test-mastra';
import { createPromptWriterAgent } from './index';
import {
  adjacentCategoryMentionScorer,
  codingCategoryConfirmationScorer,
  codingSectionOrderScorer,
  promptOnlyDeliveryScorer,
} from './scorers';
import { hasModelCredentials } from './test-utils';

function createConversationTestMastra(model: ReturnType<typeof createMockModel>) {
  return createTestMastra({
    agents: {
      promptWriterAgent: createPromptWriterAgent({ model }),
    },
  });
}

let productionMastraPromise: ReturnType<typeof createMastra> | undefined;

function getProductionMastra() {
  productionMastraPromise ??= createMastra();
  return productionMastraPromise;
}

describe('Prompt Writer Agent conversation', () => {
  test('thread memory retains prior turns in the same Conversation', async () => {
    const generateCalls: Array<{ prompt?: unknown; messages?: unknown }> = [];
    const mockModel = createMockModel({
      mockText: 'acknowledged',
      spyGenerate: (props) => {
        generateCalls.push(props as { prompt?: unknown; messages?: unknown });
      },
    });

    const testMastra = await createConversationTestMastra(mockModel);
    const agent = testMastra.getAgentById('prompt-writer');
    const memory = {
      resource: 'test-user',
      thread: `memory-thread-${Date.now()}`,
    };

    await agent.generate('Help me plan a research project on urban gardening.', {
      memory,
    });
    await agent.generate('Yes, General Task is correct.', { memory });

    expect(generateCalls.length).toBeGreaterThanOrEqual(2);

    const secondCall = JSON.stringify(generateCalls[1]);
    expect(secondCall).toContain('urban gardening');
  });

  describe.skipIf(!hasModelCredentials())('Coding smoke tracer (live model)', () => {
    test('confirmed Coding conversation delivers a prompt-only Refined Prompt in section order', async () => {
      const mastra = await getProductionMastra();
      const agent = mastra.getAgentById('prompt-writer');
      const memory = {
        resource: 'live-test-user',
        thread: `coding-e2e-${Date.now()}`,
      };

      const confirmation = await agent.generate('Fix the login bug.', { memory });
      const confirmationScore = await codingCategoryConfirmationScorer.run({
        output: confirmation.text,
      });
      const adjacentScore = await adjacentCategoryMentionScorer.run({
        output: confirmation.text,
      });
      expect(confirmationScore.score).toBe(1);
      expect(adjacentScore.score).toBe(1);

      await agent.generate('Yes, Coding Prompt is correct.', { memory });
      await agent.generate(
        'React app with JWT auth. Users get "invalid token" after login. Fix auth/token handling in src/auth. Run npm test to verify.',
        { memory },
      );

      const response = await agent.generate('Just write the refined prompt now.', {
        memory,
      });

      const sectionOrderScore = await codingSectionOrderScorer.run({
        output: response.text,
      });
      const promptOnlyScore = await promptOnlyDeliveryScorer.run({
        output: response.text,
      });
      expect(sectionOrderScore.score).toBe(1);
      expect(promptOnlyScore.score).toBe(1);
    }, 300_000);
  });
});