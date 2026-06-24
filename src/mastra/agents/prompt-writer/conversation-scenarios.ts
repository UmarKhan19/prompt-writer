import { assertConversationContract } from './scorers/assert-contract';
import {
  adjacentCategoryMentionScorer,
  agentPromptCategoryConfirmationScorer,
  agentPromptSectionOrderScorer,
  categoryConfirmationScorer,
  categoryConfirmationTurnDisciplineScorer,
  categoryDisambiguationScorer,
  categorySwitchCarryoverScorer,
  codingCategoryConfirmationScorer,
  codingSectionOrderScorer,
  forcedProceedGuardrailsScorer,
  promptOnlyDeliveryScorer,
  singleDisambiguationQuestionScorer,
  turnDisciplineScorer,
  unknownDisambiguationSectionOrderScorer,
} from './scorers';
import type { ConversationScenario } from './run-conversation-scenario';

export const SCRIPTED_CODING_CATEGORY_CONFIRMATION = `I would classify this as coding-prompt because it is about fixing software in a codebase. It could also fit agent-prompt if you want an AI coding agent to execute the fix in your repo with tool scope and permissions. Should I treat it as Coding Prompt or Agent Prompt?`;

export const SCRIPTED_AGENT_PROMPT_CATEGORY_CONFIRMATION = `I would classify this as agent-prompt because you asked for a prompt for opencode, an AI coding agent Executor. Should I treat it as Agent Prompt?`;

export const SCRIPTED_CODING_REFINED_PROMPT = `# Objective
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

export const SCRIPTED_UNKNOWN_DISAMBIGUATION = `# Current Understanding
The user wants help but has not specified the task type.

# Possible Categories
- general-task-prompt: non-code writing or research
- coding-prompt: software work
- agent-prompt: a prompt for an AI coding agent

# Best Guess
unknown-prompt

# One Question
Who will consume the final prompt: a general chatbot, a human developer, or an AI coding agent?`;

export const SCRIPTED_GENERAL_TASK_CATEGORY_CONFIRMATION = `I would classify this as general-task-prompt because you described a general writing task for a blog audience. Should I treat it as General Task?`;

export const SCRIPTED_FORCED_PROCEED_CODING_PROMPT = `# Objective
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

export const SCRIPTED_REVISED_CODING_PROMPT = `# Objective
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
Fix token validation and JWT expiry handling with token refresh behavior.

# Acceptance Criteria
Login succeeds with valid credentials. JWT expiry handling and token refresh behavior must work.

# Verification Steps
Run npm test.

# Out Of Scope
Password reset flow.`;

export const SCRIPTED_CATEGORY_SWITCH_TO_AGENT = `Switching to agent-prompt. I will carry over your prior answers about the React app, JWT auth, and src/auth bug. Which directories may the agent read and edit?`;

export const SCRIPTED_AGENT_REFINED_PROMPT = `# Agent Role
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

export const scenario1CodingHappyPath: ConversationScenario = {
  name: 'scenario-1-coding-happy-path',
  steps: [
    {
      user: 'Fix the login bug.',
      model: SCRIPTED_CODING_CATEGORY_CONFIRMATION,
      phase: 'category-confirmation',
      assert: async (response) => {
        await assertConversationContract(
          codingCategoryConfirmationScorer,
          response.text,
        );
      },
    },
    {
      user: 'Yes, Coding Prompt is correct.',
      model: 'What error or behavior do you see when login fails?',
    },
    {
      user: 'React app with JWT auth. Users get invalid token after login.',
      model: SCRIPTED_CODING_REFINED_PROMPT,
    },
    {
      user: 'Just write the refined prompt now.',
      model: SCRIPTED_CODING_REFINED_PROMPT,
      phase: 'refined-prompt',
      assert: async (response) => {
        await assertConversationContract(
          codingSectionOrderScorer,
          response.text,
        );
        await assertConversationContract(
          promptOnlyDeliveryScorer,
          response.text,
        );
      },
    },
  ],
};

export const scenario2AgentPromptHappyPath: ConversationScenario = {
  name: 'scenario-2-agent-prompt-happy-path',
  steps: [
    {
      user: 'Write a prompt for opencode to fix the JWT login bug in my React repo.',
      model: SCRIPTED_AGENT_PROMPT_CATEGORY_CONFIRMATION,
      phase: 'category-confirmation',
      assert: async (response) => {
        await assertConversationContract(
          agentPromptCategoryConfirmationScorer,
          response.text,
        );
      },
    },
    {
      user: 'Yes, Agent Prompt is correct.',
      model: 'Which directories may the agent read and edit?',
    },
    {
      user: 'Agent may read and edit src/auth only. Stop when npm test passes.',
      model: SCRIPTED_AGENT_REFINED_PROMPT,
    },
    {
      user: 'Just write the refined prompt now.',
      model: SCRIPTED_AGENT_REFINED_PROMPT,
      phase: 'refined-prompt',
      assert: async (response) => {
        await assertConversationContract(
          agentPromptSectionOrderScorer,
          response.text,
        );
        await assertConversationContract(
          promptOnlyDeliveryScorer,
          response.text,
        );
      },
    },
  ],
};

export const scenario3UnknownDisambiguation: ConversationScenario = {
  name: 'scenario-3-unknown-disambiguation',
  steps: [
    {
      user: 'Do something about my project.',
      model: SCRIPTED_UNKNOWN_DISAMBIGUATION,
      phase: 'category-disambiguation',
      assert: async (response) => {
        await assertConversationContract(
          categoryDisambiguationScorer,
          response.text,
        );
        await assertConversationContract(
          unknownDisambiguationSectionOrderScorer,
          response.text,
        );
        await assertConversationContract(
          categoryConfirmationScorer,
          response.text,
          0,
        );
        await assertConversationContract(turnDisciplineScorer, response.text);
        await assertConversationContract(
          singleDisambiguationQuestionScorer,
          response.text,
        );
      },
    },
    {
      user: 'It is a general writing task for a blog audience.',
      model: SCRIPTED_GENERAL_TASK_CATEGORY_CONFIRMATION,
      phase: 'category-confirmation',
      assert: async (response) => {
        await assertConversationContract(
          categoryConfirmationScorer,
          response.text,
        );
        await assertConversationContract(turnDisciplineScorer, response.text);
      },
    },
  ],
};

export const scenario4ForcedProceed: ConversationScenario = {
  name: 'scenario-4-forced-proceed',
  steps: [
    {
      user: 'Fix the login bug.',
      model: SCRIPTED_CODING_CATEGORY_CONFIRMATION,
      phase: 'category-confirmation',
      assert: async (response) => {
        await assertConversationContract(
          codingCategoryConfirmationScorer,
          response.text,
        );
      },
    },
    {
      user: 'Yes, Coding Prompt is correct.',
      model: 'What error or behavior do you see when login fails?',
    },
    {
      user: 'Just write it now.',
      model: SCRIPTED_FORCED_PROCEED_CODING_PROMPT,
      phase: 'refined-prompt',
      assert: async (response) => {
        await assertConversationContract(
          codingSectionOrderScorer,
          response.text,
        );
        await assertConversationContract(
          promptOnlyDeliveryScorer,
          response.text,
        );
        await assertConversationContract(
          forcedProceedGuardrailsScorer,
          response.text,
        );
      },
    },
  ],
};

export const scenario5Revision: ConversationScenario = {
  name: 'scenario-5-revision',
  steps: [
    {
      user: 'Fix the login bug.',
      model: SCRIPTED_CODING_CATEGORY_CONFIRMATION,
      phase: 'category-confirmation',
      assert: async (response) => {
        await assertConversationContract(
          codingCategoryConfirmationScorer,
          response.text,
        );
      },
    },
    {
      user: 'Yes, Coding Prompt is correct.',
      model: 'What error or behavior do you see when login fails?',
    },
    {
      user:
        'React app with JWT auth. Users get "invalid token" after login. Fix auth in src/auth. Run npm test to verify.',
      model: SCRIPTED_CODING_REFINED_PROMPT,
    },
    {
      user: 'Just write the refined prompt now.',
      model: SCRIPTED_CODING_REFINED_PROMPT,
      phase: 'refined-prompt',
      assert: async (response) => {
        await assertConversationContract(
          codingSectionOrderScorer,
          response.text,
        );
        await assertConversationContract(
          promptOnlyDeliveryScorer,
          response.text,
        );
      },
    },
    {
      user:
        'Revise the acceptance criteria to explicitly require JWT expiry handling and token refresh behavior.',
      model: SCRIPTED_REVISED_CODING_PROMPT,
      phase: 'refined-prompt',
      assert: async (response) => {
        await assertConversationContract(
          codingSectionOrderScorer,
          response.text,
        );
        await assertConversationContract(
          promptOnlyDeliveryScorer,
          response.text,
        );
        if (!/jwt|expir|token refresh/i.test(response.text)) {
          throw new Error('Expected revised acceptance criteria');
        }
        await assertConversationContract(
          categoryConfirmationScorer,
          response.text,
          0,
        );
      },
    },
  ],
};

export const scenario6CategorySwitch: ConversationScenario = {
  name: 'scenario-6-category-switch',
  steps: [
    {
      user: 'Fix the login bug.',
      model: SCRIPTED_CODING_CATEGORY_CONFIRMATION,
      phase: 'category-confirmation',
      assert: async (response) => {
        await assertConversationContract(
          codingCategoryConfirmationScorer,
          response.text,
        );
      },
    },
    {
      user: 'Yes, Coding Prompt is correct.',
      model: 'What error or behavior do you see when login fails?',
    },
    {
      user:
        'React app with JWT auth. Valid credentials fail after login because JWT expiry is not handled. Bug in src/auth. Run npm test to verify.',
      model: 'Thanks — that helps.',
    },
    {
      user: 'Switch to Agent Prompt — I will use Cursor to execute this in my repo.',
      model: SCRIPTED_CATEGORY_SWITCH_TO_AGENT,
      phase: 'category-confirmation',
      assert: async (response) => {
        await assertConversationContract(
          categorySwitchCarryoverScorer,
          response.text,
        );
      },
    },
    {
      user:
        'Agent may read and edit src/auth only. Ask before dependency changes. Stop when npm test passes.',
      model: SCRIPTED_AGENT_REFINED_PROMPT,
    },
    {
      user: 'Write the refined Agent Prompt now.',
      model: SCRIPTED_AGENT_REFINED_PROMPT,
      phase: 'refined-prompt',
      assert: async (response) => {
        await assertConversationContract(
          agentPromptSectionOrderScorer,
          response.text,
        );
        await assertConversationContract(
          promptOnlyDeliveryScorer,
          response.text,
        );
      },
    },
  ],
};

export const scenario7CategoryConfirmationDiscipline: ConversationScenario = {
  name: 'scenario-7-category-confirmation-discipline',
  steps: [
    {
      user: 'Fix the login bug.',
      model: SCRIPTED_CODING_CATEGORY_CONFIRMATION,
      phase: 'category-confirmation',
      assert: async (response) => {
        await assertConversationContract(
          codingCategoryConfirmationScorer,
          response.text,
        );
        await assertConversationContract(
          adjacentCategoryMentionScorer,
          response.text,
        );
        await assertConversationContract(
          categoryConfirmationTurnDisciplineScorer,
          response.text,
        );
      },
    },
  ],
};

export const ALL_CONVERSATION_SCENARIOS: ConversationScenario[] = [
  scenario1CodingHappyPath,
  scenario2AgentPromptHappyPath,
  scenario3UnknownDisambiguation,
  scenario4ForcedProceed,
  scenario5Revision,
  scenario6CategorySwitch,
  scenario7CategoryConfirmationDiscipline,
];