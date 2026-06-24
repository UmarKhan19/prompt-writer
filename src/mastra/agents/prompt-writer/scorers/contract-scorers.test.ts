import { describe, expect, test } from 'bun:test';
import {
  adjacentCategoryMentionScorer,
  agentPromptSectionOrderScorer,
  categoryDisambiguationScorer,
  codingSectionOrderScorer,
  forcedProceedGuardrailsScorer,
  singleDisambiguationQuestionScorer,
  unknownDisambiguationSectionOrderScorer,
} from './index';

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

const SAMPLE_AGENT_PROMPT = `# Agent Role
You are an AI coding agent.

# Objective
Fix the login bug.

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

const SAMPLE_FORCED_PROCEED_PROMPT = `# Objective
Fix login bug.

# Current Context
Users cannot log in.

# Expected Outcome
Login works.

# Technical Environment
Unknown — verify stack with user before implementing.

# Scope
Auth module.

# Relevant Files, Commands, Or Evidence
Inspect src/auth.

# Constraints
None specified.

# Implementation Requirements
Fix token validation.

# Acceptance Criteria
Login succeeds.

# Verification Steps
Run tests after confirming framework.

# Out Of Scope
Password reset.`;

describe('Conversation contract scorers', () => {
  test('coding section order scorer detects Coding category sections in order', async () => {
    const result = await codingSectionOrderScorer.run({
      output: SAMPLE_CODING_PROMPT,
    });
    expect(result.score).toBe(1);
  });

  test('agent prompt section order scorer detects Agent Prompt sections in order', async () => {
    const result = await agentPromptSectionOrderScorer.run({
      output: SAMPLE_AGENT_PROMPT,
    });
    expect(result.score).toBe(1);
  });

  test('unknown disambiguation section order and disambiguation scorers pass together', async () => {
    const sectionResult = await unknownDisambiguationSectionOrderScorer.run({
      output: SAMPLE_UNKNOWN_DISAMBIGUATION,
    });
    const disambiguationResult = await categoryDisambiguationScorer.run({
      output: SAMPLE_UNKNOWN_DISAMBIGUATION,
    });

    expect(sectionResult.score).toBe(1);
    expect(disambiguationResult.score).toBe(1);
  });

  test('single disambiguation question scorer counts questions inside the One Question section only', async () => {
    const withRhetoricalQuestionElsewhere = `# Current Understanding
The user wants help but has not specified the task type.

# Possible Categories
- general-task-prompt
- coding-prompt

# Best Guess
unknown-prompt

# One Question
Who will consume the final prompt: a general chatbot or an AI coding agent?

Does that framing help?`;

    const result = await singleDisambiguationQuestionScorer.run({
      output: withRhetoricalQuestionElsewhere,
    });
    expect(result.score).toBe(1);
  });

  test('forced proceed guardrails scorer detects verification language inside a Refined Prompt', async () => {
    const result = await forcedProceedGuardrailsScorer.run({
      output: SAMPLE_FORCED_PROCEED_PROMPT,
    });
    expect(result.score).toBe(1);
  });

  test('adjacent category mention scorer detects executor boundary language', async () => {
    const text =
      'I would classify this as coding-prompt because it is about fixing software. It could also fit agent-prompt if you are using an AI coding agent to execute this in your repo. Should I treat it as Coding Prompt or Agent Prompt?';

    const result = await adjacentCategoryMentionScorer.run({ output: text });
    expect(result.score).toBe(1);
  });

  test('failed scorer runs include a useful generateReason', async () => {
    const result = await codingSectionOrderScorer.run({
      output: 'No sections here.',
    });

    expect(result.score).toBe(0);
    expect(result.reason).toBeTruthy();
    expect(result.reason!.length).toBeGreaterThan(10);
  });
});