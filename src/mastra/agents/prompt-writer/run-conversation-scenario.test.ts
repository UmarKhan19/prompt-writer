import { describe, expect, test } from 'bun:test';
import {
  agentPromptSectionOrderScorer,
  codingCategoryConfirmationScorer,
  codingSectionOrderScorer,
  promptOnlyDeliveryScorer,
} from './scorers';
import {
  ALL_CONVERSATION_SCENARIOS,
  scenario1CodingHappyPath,
  scenario2AgentPromptHappyPath,
  scenario3UnknownDisambiguation,
  scenario4ForcedProceed,
  scenario5Revision,
  scenario6CategorySwitch,
  scenario7CategoryConfirmationDiscipline,
} from './conversation-scenarios';
import { runConversationScenario } from './run-conversation-scenario';

describe('runConversationScenario', () => {
  test('defines all seven PRD Conversation scenarios', () => {
    expect(ALL_CONVERSATION_SCENARIOS).toHaveLength(7);
  });

  test('scenario 7: first agent response does not batch task-specific clarification with Category Confirmation', async () => {
    const finalResponse = await runConversationScenario(
      scenario7CategoryConfirmationDiscipline,
    );

    const confirmationScore = await codingCategoryConfirmationScorer.run({
      output: finalResponse.text,
    });
    expect(confirmationScore.score).toBe(1);
  });

  test('scenario 1: Coding happy path reaches prompt-only Refined Prompt with Coding section headers', async () => {
    const finalResponse = await runConversationScenario(scenario1CodingHappyPath);

    const sectionOrderScore = await codingSectionOrderScorer.run({
      output: finalResponse.text,
    });
    const promptOnlyScore = await promptOnlyDeliveryScorer.run({
      output: finalResponse.text,
    });
    expect(sectionOrderScore.score).toBe(1);
    expect(promptOnlyScore.score).toBe(1);
  });

  test('scenario 3: Unknown Source Prompt yields Disambiguation Response then Category Confirmation', async () => {
    await runConversationScenario(scenario3UnknownDisambiguation);
  });

  test('scenario 4: Forced Proceed mid-clarification delivers Refined Prompt with in-prompt guardrails', async () => {
    const finalResponse = await runConversationScenario(scenario4ForcedProceed);

    const sectionOrderScore = await codingSectionOrderScorer.run({
      output: finalResponse.text,
    });
    const promptOnlyScore = await promptOnlyDeliveryScorer.run({
      output: finalResponse.text,
    });
    expect(sectionOrderScore.score).toBe(1);
    expect(promptOnlyScore.score).toBe(1);
  });

  test('scenario 5: Revision updates delivered Refined Prompt without restart', async () => {
    const finalResponse = await runConversationScenario(scenario5Revision);

    const sectionOrderScore = await codingSectionOrderScorer.run({
      output: finalResponse.text,
    });
    const promptOnlyScore = await promptOnlyDeliveryScorer.run({
      output: finalResponse.text,
    });
    expect(sectionOrderScore.score).toBe(1);
    expect(promptOnlyScore.score).toBe(1);
    expect(finalResponse.text).toMatch(/jwt|expir|token refresh/i);
  });

  test('scenario 6: Category Switch from Coding to Agent Prompt carries over prior context', async () => {
    const finalResponse = await runConversationScenario(scenario6CategorySwitch);

    const sectionOrderScore = await agentPromptSectionOrderScorer.run({
      output: finalResponse.text,
    });
    const promptOnlyScore = await promptOnlyDeliveryScorer.run({
      output: finalResponse.text,
    });
    expect(sectionOrderScore.score).toBe(1);
    expect(promptOnlyScore.score).toBe(1);
  });

  test('scenario 2: Agent Prompt happy path includes tool scope and stop condition sections', async () => {
    const finalResponse = await runConversationScenario(
      scenario2AgentPromptHappyPath,
    );

    const sectionOrderScore = await agentPromptSectionOrderScorer.run({
      output: finalResponse.text,
    });
    const promptOnlyScore = await promptOnlyDeliveryScorer.run({
      output: finalResponse.text,
    });
    expect(sectionOrderScore.score).toBe(1);
    expect(promptOnlyScore.score).toBe(1);
    expect(finalResponse.text).toMatch(/tool scope/i);
    expect(finalResponse.text).toMatch(/stop condition/i);
  });

  test('creates isolated memory per scenario by default', async () => {
    const resultA = await runConversationScenario(
      scenario7CategoryConfirmationDiscipline,
    );
    const resultB = await runConversationScenario(
      scenario7CategoryConfirmationDiscipline,
    );

    expect(resultA.memory.thread).not.toBe(resultB.memory.thread);
    expect(resultA.memory.resource).toBe('scripted-test-user');
    expect(resultB.memory.resource).toBe('scripted-test-user');
  });

  test('supports optional memory override', async () => {
    const memory = {
      resource: 'override-user',
      thread: `override-thread-${Date.now()}`,
    };

    const result = await runConversationScenario(
      scenario7CategoryConfirmationDiscipline,
      { memory },
    );

    expect(result.memory).toEqual(memory);
  });
});