import { describe, expect, test } from 'bun:test';
import { createMockModel } from '@mastra/core/test-utils/llm-mock';
import { Mastra } from '@mastra/core/mastra';
import { LibSQLStore } from '@mastra/libsql';
import { createPromptWriterAgent } from './index';
import {
  countQuestionMarks,
  createScriptedMockModel,
  hasAgentPromptSectionOrder,
  hasCodingSectionOrder,
  hasGeneralTaskSectionOrder,
  hasModelCredentials,
  hasSingleDisambiguationQuestion,
  isPromptOnlyDelivery,
  lacksTaskSpecificClarification,
  looksLikeAgentPromptCategoryConfirmation,
  looksLikeCategoryConfirmation,
  hasInPromptUncertaintyGuardrails,
  hasUnknownDisambiguationSectionOrder,
  looksLikeCategoryDisambiguation,
  looksLikeCodingCategoryConfirmation,
  mentionsAdjacentAgentPromptWithExecutorDistinction,
  mentionsPriorContextCarryover,
} from './test-helpers';

const SCRIPTED_CODING_CATEGORY_CONFIRMATION = `I would classify this as coding-prompt because it is about fixing software in a codebase. It could also fit agent-prompt if you want an AI coding agent to execute the fix in your repo with tool scope and permissions. Should I treat it as Coding Prompt or Agent Prompt?`;

const SCRIPTED_AGENT_PROMPT_CATEGORY_CONFIRMATION = `I would classify this as agent-prompt because you asked for a prompt for opencode, an AI coding agent Executor. Should I treat it as Agent Prompt?`;

const SCRIPTED_CODING_REFINED_PROMPT = `# Objective
Fix login bug.

# Current Context
Users cannot log in.

# Expected Outcome
Login works.

# Technical Environment
React app with JWT auth.

# Scope
Auth module only.

# Relevant Files, Commands, Or Evidence
src/auth.ts

# Constraints
No schema changes.

# Implementation Requirements
Fix token validation.

# Acceptance Criteria
Login succeeds with valid credentials.

# Verification Steps
Run npm test.

# Out Of Scope
Password reset flow.`;

const SCRIPTED_AGENT_REFINED_PROMPT = `# Agent Role
You are an AI coding agent.

# Objective
Fix the JWT login bug.

# Workspace Context
React app with JWT auth.

# Tool Scope And Permissions
Read and edit src/auth only.

# Files, Commands, And Evidence To Inspect
src/auth/login.ts

# Execution Flow
Reproduce, diagnose, fix, verify.

# Implementation Requirements
Fix token expiry handling.

# Constraints And Safety Rules
No dependency changes.

# Approval Triggers
Ask before deleting files.

# Acceptance Criteria
Login works with valid credentials.

# Verification Steps
npm test

# Final Report Format
Summarize root cause and files changed.

# Stop Condition
All tests pass and login verified.

# Out Of Scope
Password reset.`;

function createTestMastra(model: ReturnType<typeof createMockModel>) {
  const agent = createPromptWriterAgent({ model });

  return new Mastra({
    agents: { promptWriterAgent: agent },
    storage: new LibSQLStore({
      id: 'prompt-writer-test-storage',
      url: ':memory:',
    }),
  });
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

    const testMastra = createTestMastra(mockModel);
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

  describe('deterministic scripted scenarios', () => {
    test('scenario 7: first agent response does not batch task-specific clarification with Category Confirmation', async () => {
      const testMastra = createTestMastra(
        createScriptedMockModel([SCRIPTED_CODING_CATEGORY_CONFIRMATION]),
      );
      const agent = testMastra.getAgentById('prompt-writer');
      const memory = {
        resource: 'scripted-test-user',
        thread: `category-discipline-${Date.now()}`,
      };

      const response = await agent.generate('Fix the login bug.', { memory });

      expect(looksLikeCodingCategoryConfirmation(response.text)).toBe(true);
      expect(
        mentionsAdjacentAgentPromptWithExecutorDistinction(response.text),
      ).toBe(true);
      expect(lacksTaskSpecificClarification(response.text)).toBe(true);
      expect(countQuestionMarks(response.text)).toBeLessThanOrEqual(2);
    });

    test('scenario 1: Coding happy path reaches prompt-only Refined Prompt with Coding section headers', async () => {
      const testMastra = createTestMastra(
        createScriptedMockModel([
          SCRIPTED_CODING_CATEGORY_CONFIRMATION,
          'What error or behavior do you see when login fails?',
          SCRIPTED_CODING_REFINED_PROMPT,
        ]),
      );
      const agent = testMastra.getAgentById('prompt-writer');
      const memory = {
        resource: 'scripted-test-user',
        thread: `coding-happy-path-${Date.now()}`,
      };

      const confirmation = await agent.generate('Fix the login bug.', { memory });
      expect(looksLikeCodingCategoryConfirmation(confirmation.text)).toBe(true);

      await agent.generate('Yes, Coding Prompt is correct.', { memory });
      await agent.generate(
        'React app with JWT auth. Users get invalid token after login.',
        { memory },
      );

      const refined = await agent.generate('Just write the refined prompt now.', {
        memory,
      });

      expect(hasCodingSectionOrder(refined.text)).toBe(true);
      expect(isPromptOnlyDelivery(refined.text)).toBe(true);
    });

    test('scenario 2: Agent Prompt happy path includes tool scope and stop condition sections', async () => {
      const testMastra = createTestMastra(
        createScriptedMockModel([
          SCRIPTED_AGENT_PROMPT_CATEGORY_CONFIRMATION,
          'Which directories may the agent read and edit?',
          SCRIPTED_AGENT_REFINED_PROMPT,
        ]),
      );
      const agent = testMastra.getAgentById('prompt-writer');
      const memory = {
        resource: 'scripted-test-user',
        thread: `agent-prompt-happy-path-${Date.now()}`,
      };

      const confirmation = await agent.generate(
        'Write a prompt for opencode to fix the JWT login bug in my React repo.',
        { memory },
      );
      expect(looksLikeAgentPromptCategoryConfirmation(confirmation.text)).toBe(
        true,
      );

      await agent.generate('Yes, Agent Prompt is correct.', { memory });
      await agent.generate(
        'Agent may read and edit src/auth only. Stop when npm test passes.',
        { memory },
      );

      const refined = await agent.generate('Just write the refined prompt now.', {
        memory,
      });

      expect(hasAgentPromptSectionOrder(refined.text)).toBe(true);
      expect(refined.text).toMatch(/tool scope/i);
      expect(refined.text).toMatch(/stop condition/i);
      expect(isPromptOnlyDelivery(refined.text)).toBe(true);
    });
  });

  describe.skipIf(!hasModelCredentials())(
    'General Task tracer (live model)',
    () => {
      test('vague General Task Source Prompt yields Category Confirmation before task-specific clarification', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `general-task-${Date.now()}`,
        };

        const response = await agent.generate(
          'Help me write something interesting about climate change for a general audience.',
          { memory },
        );

        expect(looksLikeCategoryConfirmation(response.text)).toBe(true);
        expect(lacksTaskSpecificClarification(response.text)).toBe(true);
        expect(countQuestionMarks(response.text)).toBeLessThanOrEqual(2);
      }, 120_000);

      test('confirmed General Task conversation delivers a prompt-only Refined Prompt in section order', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `general-task-e2e-${Date.now()}`,
        };

        await agent.generate(
          'Help me write something interesting about climate change for a general audience.',
          { memory },
        );
        await agent.generate('Yes, General Task is correct.', { memory });
        await agent.generate(
          'High school students. Keep it engaging and about 500 words. Focus on local impacts.',
          { memory },
        );

        const response = await agent.generate(
          'Just write the refined prompt now.',
          { memory },
        );

        expect(hasGeneralTaskSectionOrder(response.text)).toBe(true);
        expect(isPromptOnlyDelivery(response.text)).toBe(true);
      }, 300_000);
    },
  );

  describe.skipIf(!hasModelCredentials())(
    'Coding tracer (live model)',
    () => {
      test('vague software Source Prompt yields Coding Category Confirmation with Agent Prompt as Adjacent Category', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `coding-tracer-${Date.now()}`,
        };

        const response = await agent.generate('Fix the login bug.', { memory });

        expect(looksLikeCodingCategoryConfirmation(response.text)).toBe(true);
        expect(
          mentionsAdjacentAgentPromptWithExecutorDistinction(response.text),
        ).toBe(true);
        expect(lacksTaskSpecificClarification(response.text)).toBe(true);
        expect(countQuestionMarks(response.text)).toBeLessThanOrEqual(2);
      }, 120_000);

      test('confirmed Coding conversation delivers a prompt-only Refined Prompt in section order', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `coding-e2e-${Date.now()}`,
        };

        await agent.generate('Fix the login bug.', { memory });
        await agent.generate('Yes, Coding Prompt is correct.', { memory });
        await agent.generate(
          'React app with JWT auth. Users get "invalid token" after login. Fix auth/token handling in src/auth. Run npm test to verify.',
          { memory },
        );

        const response = await agent.generate(
          'Just write the refined prompt now.',
          { memory },
        );

        expect(hasCodingSectionOrder(response.text)).toBe(true);
        expect(isPromptOnlyDelivery(response.text)).toBe(true);
      }, 300_000);
    },
  );

  describe.skipIf(!hasModelCredentials())(
    'Agent Prompt tracer (live model)',
    () => {
      test('Source Prompt for a coding agent Executor classifies as Agent Prompt', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `agent-prompt-tracer-${Date.now()}`,
        };

        const response = await agent.generate(
          'Write a prompt for opencode to fix the JWT login bug in my React repo.',
          { memory },
        );

        expect(looksLikeAgentPromptCategoryConfirmation(response.text)).toBe(
          true,
        );
        expect(lacksTaskSpecificClarification(response.text)).toBe(true);
        expect(countQuestionMarks(response.text)).toBeLessThanOrEqual(2);
      }, 120_000);

      test('confirmed Agent Prompt conversation delivers a prompt-only Refined Prompt with tool scope and stop condition', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `agent-prompt-e2e-${Date.now()}`,
        };

        await agent.generate(
          'Write a prompt for opencode to fix the JWT login bug in my React repo.',
          { memory },
        );
        await agent.generate('Yes, Agent Prompt is correct.', { memory });
        await agent.generate(
          'Local React repo. Auth code in src/auth. Agent may read and edit src/auth only. Ask before dependency changes. Stop when npm test passes.',
          { memory },
        );

        const response = await agent.generate(
          'Just write the refined prompt now.',
          { memory },
        );

        expect(hasAgentPromptSectionOrder(response.text)).toBe(true);
        expect(response.text).toMatch(/tool scope/i);
        expect(response.text).toMatch(/stop condition/i);
        expect(isPromptOnlyDelivery(response.text)).toBe(true);
      }, 300_000);
    },
  );

  describe.skipIf(!hasModelCredentials())(
    'Conversation edge cases (live model)',
    () => {
      test('highly vague Source Prompt yields exactly one Category Disambiguation turn before Category Confirmation', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `unknown-disambiguation-${Date.now()}`,
        };

        const response = await agent.generate(
          'Do something about my project.',
          { memory },
        );

        expect(looksLikeCategoryDisambiguation(response.text)).toBe(true);
        expect(hasUnknownDisambiguationSectionOrder(response.text)).toBe(true);
        expect(looksLikeCategoryConfirmation(response.text)).toBe(false);
        expect(lacksTaskSpecificClarification(response.text)).toBe(true);
        expect(hasSingleDisambiguationQuestion(response.text)).toBe(true);
      }, 120_000);

      test('after Category Disambiguation answer agent re-classifies and proceeds to Category Confirmation', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `unknown-reclassify-${Date.now()}`,
        };

        await agent.generate('Do something about my project.', { memory });
        const response = await agent.generate(
          'It is a general writing task for a blog audience.',
          { memory },
        );

        expect(looksLikeCategoryConfirmation(response.text)).toBe(true);
        expect(lacksTaskSpecificClarification(response.text)).toBe(true);
      }, 120_000);

      test('Forced Proceed mid-clarification delivers Refined Prompt with uncertainty encoded inside the prompt', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `forced-proceed-${Date.now()}`,
        };

        await agent.generate('Fix the login bug.', { memory });
        await agent.generate('Yes, Coding Prompt is correct.', { memory });
        const response = await agent.generate('Just write it now.', { memory });

        expect(hasCodingSectionOrder(response.text)).toBe(true);
        expect(isPromptOnlyDelivery(response.text)).toBe(true);
        expect(hasInPromptUncertaintyGuardrails(response.text)).toBe(true);
      }, 180_000);

      test('revision request updates existing Refined Prompt without restarting from Source Prompt', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `revision-${Date.now()}`,
        };

        await agent.generate('Fix the login bug.', { memory });
        await agent.generate('Yes, Coding Prompt is correct.', { memory });
        await agent.generate(
          'React app with JWT auth. Users get "invalid token" after login. Fix auth in src/auth. Run npm test to verify.',
          { memory },
        );
        await agent.generate('Just write the refined prompt now.', { memory });

        let response = await agent.generate(
          'Revise the acceptance criteria to explicitly require JWT expiry handling and token refresh behavior.',
          { memory },
        );

        if (
          !hasCodingSectionOrder(response.text) &&
          response.text.includes('?')
        ) {
          response = await agent.generate(
            'Yes — include JWT expiry handling and token refresh in the acceptance criteria. Deliver the revised Coding prompt now.',
            { memory },
          );
        }

        expect(hasCodingSectionOrder(response.text)).toBe(true);
        expect(isPromptOnlyDelivery(response.text)).toBe(true);
        expect(response.text).toMatch(/jwt|expir|token refresh/i);
        expect(looksLikeCategoryConfirmation(response.text)).toBe(false);
      }, 300_000);

      test('Category Switch from Coding to Agent Prompt carries over prior answers and asks only gap-fill questions', async () => {
        const { mastra } = await import('../../index');
        const agent = mastra.getAgentById('prompt-writer');
        const memory = {
          resource: 'live-test-user',
          thread: `category-switch-${Date.now()}`,
        };

        await agent.generate('Fix the login bug.', { memory });
        await agent.generate('Yes, Coding Prompt is correct.', { memory });
        await agent.generate(
          'React app with JWT auth. Valid credentials fail after login because JWT expiry is not handled. Bug in src/auth. Run npm test to verify.',
          { memory },
        );

        const switchResponse = await agent.generate(
          'Switch to Agent Prompt — I will use Cursor to execute this in my repo.',
          { memory },
        );

        expect(
          switchResponse.text.toLowerCase().includes('agent prompt') ||
            switchResponse.text.toLowerCase().includes('agent-prompt'),
        ).toBe(true);
        expect(looksLikeCodingCategoryConfirmation(switchResponse.text)).toBe(
          false,
        );
        expect(
          mentionsPriorContextCarryover(switchResponse.text) ||
            /tool scope|file scope|permission|cursor/i.test(switchResponse.text),
        ).toBe(true);

        if (switchResponse.text.includes('?')) {
          await agent.generate(
            'Agent may read and edit src/auth only. Ask before dependency changes. Stop when npm test passes.',
            { memory },
          );
        }

        const refinedResponse = await agent.generate(
          'Write the refined Agent Prompt now.',
          { memory },
        );

        expect(hasAgentPromptSectionOrder(refinedResponse.text)).toBe(true);
        expect(refinedResponse.text).toMatch(/tool scope/i);
        expect(refinedResponse.text).toMatch(/stop condition/i);
        expect(isPromptOnlyDelivery(refinedResponse.text)).toBe(true);
      }, 300_000);
    },
  );
});