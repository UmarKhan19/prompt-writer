import { describe, expect, test } from 'bun:test';
import { createMockModel } from '@mastra/core/test-utils/llm-mock';
import { LibSQLStore } from '@mastra/libsql';
import { createPromptWriterAgent } from './agents/prompt-writer';
import { createMastra } from './create-mastra';
import { createTestMastra } from './create-test-mastra';
import { promptWriterScorers } from './agents/prompt-writer/scorers';

const EXPECTED_WRITING_SKILLS = [
  'prompt-writing-core',
  'coding-prompt',
  'general-task-prompt',
  'agent-prompt',
  'unknown-prompt',
] as const;

describe('createTestMastra', () => {
  test('registers the Prompt Writer Agent with test defaults', async () => {
    const mastra = await createTestMastra();

    const agent = mastra.getAgentById('prompt-writer');
    expect(agent).toBeDefined();
    expect(agent.id).toBe('prompt-writer');
  });

  test('uses in-memory storage without observability side effects', async () => {
    const mastra = await createTestMastra();
    const agent = mastra.getAgentById('prompt-writer');

    const workspace = await agent.getWorkspace();
    expect(workspace).toBeDefined();

    const skills = await workspace!.skills.list();
    const skillNames = skills.map((skill) => skill.name).sort();

    expect(skillNames).toEqual([...EXPECTED_WRITING_SKILLS].sort());

    const memory = await agent.getMemory();
    expect(memory).toBeDefined();
  });

  test('accepts agents override for mock model injection', async () => {
    const mockModel = createMockModel({ mockText: 'mocked response' });
    const mastra = await createTestMastra({
      agents: {
        promptWriterAgent: createPromptWriterAgent({ model: mockModel }),
      },
    });

    const agent = mastra.getAgentById('prompt-writer');
    const response = await agent.generate('Hello');

    expect(response.text).toBe('mocked response');
  });

});

describe('createMastra', () => {
  test('is async and registers the Prompt Writer Agent', async () => {
    const mastra = await createMastra({
      storage: new LibSQLStore({
        id: 'create-mastra-test-storage',
        url: ':memory:',
      }),
    });

    const agent = mastra.getAgentById('prompt-writer');
    expect(agent).toBeDefined();
    expect(agent.id).toBe('prompt-writer');
  });

  test('applies a production logger by default', async () => {
    const mastra = await createMastra({
      storage: new LibSQLStore({
        id: 'create-mastra-prod-internals-storage',
        url: ':memory:',
      }),
    });

    expect(mastra.getLogger()).toBeDefined();
  });

  test('registers Conversation contract scorers for Studio visibility', async () => {
    const mastra = await createMastra({
      storage: new LibSQLStore({
        id: 'create-mastra-scorers-storage',
        url: ':memory:',
      }),
    });

    for (const scorer of Object.values(promptWriterScorers)) {
      expect(mastra.getScorerById(scorer.id)).toBeDefined();
    }
  });
});