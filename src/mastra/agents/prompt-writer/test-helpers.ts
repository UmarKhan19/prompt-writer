import { MastraLanguageModelV2Mock } from '@mastra/core/test-utils/llm-mock';

const GENERAL_TASK_SECTIONS = [
  '# Goal',
  '# Context',
  '# Audience',
  '# Inputs',
  '# Task Requirements',
  '# Constraints',
  '# Output Format',
  '# Quality Bar',
  '# What To Avoid',
] as const;

const CODING_SECTIONS = [
  '# Objective',
  '# Current Context',
  '# Expected Outcome',
  '# Technical Environment',
  '# Scope',
  '# Relevant Files, Commands, Or Evidence',
  '# Constraints',
  '# Implementation Requirements',
  '# Acceptance Criteria',
  '# Verification Steps',
  '# Out Of Scope',
] as const;

const UNKNOWN_DISAMBIGUATION_SECTIONS = [
  '# Current Understanding',
  '# Possible Categories',
  '# Best Guess',
  '# One Question',
] as const;

const AGENT_PROMPT_SECTIONS = [
  '# Agent Role',
  '# Objective',
  '# Workspace Context',
  '# Tool Scope And Permissions',
  '# Files, Commands, And Evidence To Inspect',
  '# Execution Flow',
  '# Implementation Requirements',
  '# Constraints And Safety Rules',
  '# Approval Triggers',
  '# Acceptance Criteria',
  '# Verification Steps',
  '# Final Report Format',
  '# Stop Condition',
  '# Out Of Scope',
] as const;

export function hasModelCredentials(): boolean {
  return Boolean(
    process.env.PROMPT_WRITER_MODEL ||
      process.env.MASTRA_MODEL ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.OPENCODE_API_KEY ||
      process.env.MASTRA_PLATFORM_ACCESS_TOKEN,
  );
}

export function countQuestionMarks(text: string): number {
  return (text.match(/\?/g) ?? []).length;
}

export function extractOneQuestionSection(text: string): string | null {
  const match = text.match(
    /#+\s*One Question\b\s*\n+([^\n#][\s\S]*?)(?=\n\s*\n|\n#+\s|$)/i,
  );
  return match?.[1]?.trim() ?? null;
}

export function countDisambiguationQuestions(text: string): number {
  const oneQuestionSection = extractOneQuestionSection(text);
  if (oneQuestionSection) {
    return countQuestionMarks(oneQuestionSection);
  }

  return countQuestionMarks(text);
}

export function hasSingleDisambiguationQuestion(text: string): boolean {
  const questionCount = countDisambiguationQuestions(text);
  return questionCount >= 1 && questionCount <= 2;
}

export function createScriptedMockModel(responses: string[]) {
  let callIndex = 0;

  const nextResponse = () =>
    responses[Math.min(callIndex++, Math.max(responses.length - 1, 0))] ?? '';

  return new MastraLanguageModelV2Mock({
    doGenerate: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      content: [{ type: 'text', text: nextResponse() }],
      warnings: [],
    }),
  });
}

function findSectionPosition(text: string, section: string): number {
  const label = section.replace(/^#\s*/, '');
  const headingPattern = new RegExp(
    `#{1,3}\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    'i',
  );
  const match = text.match(headingPattern);
  return match?.index ?? -1;
}

function hasSectionOrder(text: string, sections: readonly string[]): boolean {
  const positions = sections.map((section) => findSectionPosition(text, section));
  if (positions.some((position) => position === -1)) {
    return false;
  }

  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index] <= positions[index - 1]) {
      return false;
    }
  }

  return true;
}

export function looksLikeCategoryDisambiguation(text: string): boolean {
  if (hasUnknownDisambiguationSectionOrder(text)) {
    return true;
  }

  const lower = text.toLowerCase();
  return (
    lower.includes('current understanding') &&
    lower.includes('possible categories') &&
    lower.includes('one question')
  );
}

export function looksLikeCategoryConfirmation(text: string): boolean {
  if (looksLikeCategoryDisambiguation(text)) {
    return false;
  }

  const lower = text.toLowerCase();
  const namesCategory =
    lower.includes('general-task-prompt') ||
    lower.includes('general task') ||
    lower.includes('coding-prompt') ||
    lower.includes('coding prompt') ||
    lower.includes('agent-prompt') ||
    lower.includes('agent prompt');

  const asksConfirmation =
    lower.includes('confirm') ||
    lower.includes('should i treat') ||
    lower.includes('should i classify') ||
    lower.includes('correct') ||
    lower.includes('does that sound') ||
    lower.includes('does this sound') ||
    lower.includes('is that right') ||
    lower.includes('?');

  return namesCategory && asksConfirmation;
}

export function looksLikeCodingCategoryConfirmation(text: string): boolean {
  const lower = text.toLowerCase();
  const namesCoding =
    lower.includes('coding-prompt') || lower.includes('coding prompt');

  return looksLikeCategoryConfirmation(text) && namesCoding;
}

export function looksLikeAgentPromptCategoryConfirmation(text: string): boolean {
  const lower = text.toLowerCase();
  const namesAgentPrompt =
    lower.includes('agent-prompt') || lower.includes('agent prompt');

  return looksLikeCategoryConfirmation(text) && namesAgentPrompt;
}

export function mentionsAdjacentAgentPromptWithExecutorDistinction(
  text: string,
): boolean {
  const lower = text.toLowerCase();

  const namesAgentPrompt =
    lower.includes('agent-prompt') || lower.includes('agent prompt');
  if (!namesAgentPrompt) {
    return false;
  }

  const namesAdjacent =
    lower.includes('adjacent') ||
    lower.includes('could also') ||
    lower.includes('could fit') ||
    lower.includes('might fit') ||
    lower.includes('also fit') ||
    lower.includes('alternative') ||
    lower.includes('or agent');

  const explainsExecutor =
    lower.includes('ai coding agent') ||
    lower.includes('coding agent') ||
    lower.includes('execute') ||
    lower.includes('executor') ||
    lower.includes('autonomous') ||
    lower.includes('tool scope') ||
    lower.includes('tool-enabled');

  return namesAdjacent && explainsExecutor;
}

export function lacksTaskSpecificClarification(text: string): boolean {
  const lower = text.toLowerCase();
  const taskClarificationQuestions = [
    'what error',
    'what exactly',
    'what is going wrong',
    'what stack',
    'which file',
    'which framework',
    'can you share',
    'can you provide',
    'can you describe',
    'can you tell me',
    'tell me more about',
    'what constraints',
    'what audience',
    'what tone',
    'how long',
    'deadline',
    'what format',
    'what length',
    'what is the desired',
    'what should the output',
    'are there any constraints',
    'any constraints i should know',
    'one more question',
  ];

  return !taskClarificationQuestions.some((phrase) => lower.includes(phrase));
}

export function hasGeneralTaskSectionOrder(text: string): boolean {
  return hasSectionOrder(text, GENERAL_TASK_SECTIONS);
}

export function hasCodingSectionOrder(text: string): boolean {
  return hasSectionOrder(text, CODING_SECTIONS);
}

export function hasAgentPromptSectionOrder(text: string): boolean {
  return hasSectionOrder(text, AGENT_PROMPT_SECTIONS);
}

export function hasUnknownDisambiguationSectionOrder(text: string): boolean {
  return hasSectionOrder(text, UNKNOWN_DISAMBIGUATION_SECTIONS);
}

export function hasInPromptUncertaintyGuardrails(text: string): boolean {
  const lower = text.toLowerCase();
  const guardrailPhrases = [
    'verify',
    'confirm with',
    'guardrail',
    'assumption',
    'if unclear',
    'if unknown',
    'validate',
    'check with',
    'user should confirm',
    'needs confirmation',
    'uncertain',
    'to be confirmed',
  ];

  return guardrailPhrases.some((phrase) => lower.includes(phrase));
}

export function mentionsPriorContextCarryover(text: string): boolean {
  const lower = text.toLowerCase();
  const carryoverSignals = [
    'carry over',
    'carried over',
    'still apply',
    'already mentioned',
    'you mentioned',
    'you said',
    'from earlier',
    'previous answer',
    'prior context',
    'jwt',
    'react',
    'src/auth',
  ];

  return carryoverSignals.some((phrase) => lower.includes(phrase));
}

export function isPromptOnlyDelivery(text: string): boolean {
  const lower = text.toLowerCase();
  const forbidden = [
    'production note',
    'chain of thought',
    'here is why',
    'i chose this',
    'commentary',
  ];

  return !forbidden.some((phrase) => lower.includes(phrase));
}