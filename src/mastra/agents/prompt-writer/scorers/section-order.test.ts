import { describe, expect, test } from 'bun:test';
import { getCategorySchemaByCategory } from '../category-schema';
import {
  agentPromptSectionOrderScorer,
  codingSectionOrderScorer,
  createSectionOrderScorer,
  unknownDisambiguationSectionOrderScorer,
} from './section-order';

const SAMPLE_CODING_PROMPT = `# Objective
Fix login bug.

# Current Context
Users cannot log in.

# Expected Outcome
Login works.

# Technical Environment
Node.js

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

const SAMPLE_UNKNOWN_DISAMBIGUATION = `# Current Understanding
The user wants help but has not specified the task type.

# Possible Categories
- general-task-prompt: non-code writing or research
- coding-prompt: software work
- agent-prompt: a prompt for an AI coding agent

# Best Guess
unknown-prompt

# One Question
Who will consume the final prompt: a general chatbot, a human developer, or an AI coding agent?`;

describe('section order scorer', () => {
  test('coding section order scorer passes when sections match category schema order', async () => {
    const result = await codingSectionOrderScorer.run({
      output: SAMPLE_CODING_PROMPT,
    });

    expect(result.score).toBe(1);
    expect(result.reason).toContain('sections present in order');
  });

  test('coding section order scorer fails with diagnostics when a section is missing', async () => {
    const incomplete = SAMPLE_CODING_PROMPT.replace(
      '# Verification Steps\nRun npm test.\n\n',
      '',
    );

    const result = await codingSectionOrderScorer.run({ output: incomplete });

    expect(result.score).toBe(0);
    expect(result.reason).toMatch(/missing/i);
    expect(result.reason).toMatch(/verification steps/i);
  });

  test('createSectionOrderScorer uses category schema reader section lists', () => {
    const factoryScorer = createSectionOrderScorer({ category: 'coding' });
    expect(factoryScorer.id).toBe('coding-section-order');

    const schemaSections = getCategorySchemaByCategory('coding').sections;
    expect(schemaSections.length).toBeGreaterThan(0);
    expect(factoryScorer.description).toContain('coding');
  });

  test('unknown disambiguation section order scorer uses unknown category schema', async () => {
    const result = await unknownDisambiguationSectionOrderScorer.run({
      output: SAMPLE_UNKNOWN_DISAMBIGUATION,
    });

    expect(result.score).toBe(1);
  });

  test('agent prompt section order scorer is a separate configured instance', async () => {
    expect(agentPromptSectionOrderScorer.id).toBe('agent-prompt-section-order');
    expect(codingSectionOrderScorer.id).toBe('coding-section-order');
  });
});