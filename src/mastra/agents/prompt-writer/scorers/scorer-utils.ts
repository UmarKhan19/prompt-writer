import { getCategorySchemaByCategory } from '../category-schema';

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

export function findSectionPosition(text: string, section: string): number {
  const label = section.replace(/^#\s*/, '');
  const headingPattern = new RegExp(
    `#{1,3}\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    'i',
  );
  const match = text.match(headingPattern);
  return match?.index ?? -1;
}

export function hasSectionOrder(
  text: string,
  sections: readonly string[],
): boolean {
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

export type SectionOrderAnalysis = {
  passed: boolean;
  missing: string[];
  outOfOrder: string[];
  summary: string;
};

export function analyzeSectionOrder(
  text: string,
  category: string,
): SectionOrderAnalysis {
  const { sections } = getCategorySchemaByCategory(category);
  const positions = sections.map((section) => findSectionPosition(text, section));
  const missing = sections.filter((_, index) => positions[index] === -1);
  const outOfOrder: string[] = [];

  for (let index = 1; index < positions.length; index += 1) {
    if (
      positions[index] !== -1 &&
      positions[index - 1] !== -1 &&
      positions[index] <= positions[index - 1]
    ) {
      outOfOrder.push(sections[index]);
    }
  }

  const passed = missing.length === 0 && outOfOrder.length === 0;
  const summary = passed
    ? `All ${sections.length} sections present in order`
    : [
        missing.length > 0 ? `Missing: ${missing.join(', ')}` : '',
        outOfOrder.length > 0 ? `Out of order: ${outOfOrder.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('. ');

  return { passed, missing, outOfOrder, summary };
}

export function analyzeCategoryDisambiguation(text: string): {
  passed: boolean;
  summary: string;
} {
  const lower = text.toLowerCase();
  const hasSectionOrderMatch = hasSectionOrder(
    text,
    getCategorySchemaByCategory('unknown').sections,
  );
  const hasPhraseMatch =
    lower.includes('current understanding') &&
    lower.includes('possible categories') &&
    lower.includes('one question');

  const passed = hasSectionOrderMatch || hasPhraseMatch;
  return {
    passed,
    summary: passed
      ? 'Response matches Category Disambiguation shape'
      : 'Expected Current Understanding, Possible Categories, and One Question signals',
  };
}

export function analyzeCategoryConfirmation(text: string): {
  passed: boolean;
  summary: string;
} {
  const disambiguation = analyzeCategoryDisambiguation(text);
  if (disambiguation.passed) {
    return {
      passed: false,
      summary: 'Response looks like Category Disambiguation, not Category Confirmation',
    };
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

  const passed = namesCategory && asksConfirmation;
  return {
    passed,
    summary: passed
      ? 'Response names a Prompt Category and asks for confirmation'
      : 'Expected category naming and a confirmation question',
  };
}

export function analyzeCodingCategoryConfirmation(text: string): {
  passed: boolean;
  summary: string;
} {
  const base = analyzeCategoryConfirmation(text);
  if (!base.passed) {
    return base;
  }

  const lower = text.toLowerCase();
  const namesCoding =
    lower.includes('coding-prompt') || lower.includes('coding prompt');

  return {
    passed: namesCoding,
    summary: namesCoding
      ? 'Response confirms Coding Prompt Category'
      : 'Expected Coding Prompt category naming',
  };
}

export function analyzeAgentPromptCategoryConfirmation(text: string): {
  passed: boolean;
  summary: string;
} {
  const base = analyzeCategoryConfirmation(text);
  if (!base.passed) {
    return base;
  }

  const lower = text.toLowerCase();
  const namesAgentPrompt =
    lower.includes('agent-prompt') || lower.includes('agent prompt');

  return {
    passed: namesAgentPrompt,
    summary: namesAgentPrompt
      ? 'Response confirms Agent Prompt Category'
      : 'Expected Agent Prompt category naming',
  };
}

export function analyzeAdjacentCategoryMention(text: string): {
  passed: boolean;
  summary: string;
} {
  const lower = text.toLowerCase();

  const namesAgentPrompt =
    lower.includes('agent-prompt') || lower.includes('agent prompt');
  if (!namesAgentPrompt) {
    return {
      passed: false,
      summary: 'Expected adjacent Agent Prompt mention',
    };
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

  const passed = namesAdjacent && explainsExecutor;
  return {
    passed,
    summary: passed
      ? 'Adjacent Agent Prompt mentioned with executor distinction'
      : 'Expected adjacent category framing and executor boundary language',
  };
}

const TASK_CLARIFICATION_PHRASES = [
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
] as const;

export function analyzeTurnDiscipline(
  text: string,
  options: { maxQuestionMarks?: number } = {},
): { passed: boolean; summary: string } {
  const lower = text.toLowerCase();
  const lacksTaskClarification = !TASK_CLARIFICATION_PHRASES.some((phrase) =>
    lower.includes(phrase),
  );

  const questionMarks = countQuestionMarks(text);
  const withinQuestionBudget =
    options.maxQuestionMarks === undefined ||
    questionMarks <= options.maxQuestionMarks;

  const passed = lacksTaskClarification && withinQuestionBudget;
  const summary = passed
    ? 'Turn avoids task-specific clarification and respects question budget'
    : [
        !lacksTaskClarification
          ? 'Response includes task-specific clarification questions'
          : '',
        !withinQuestionBudget
          ? `Expected at most ${options.maxQuestionMarks} question marks, found ${questionMarks}`
          : '',
      ]
        .filter(Boolean)
        .join('. ');

  return { passed, summary };
}

export function analyzeForcedProceedGuardrails(text: string): {
  passed: boolean;
  summary: string;
} {
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

  const passed = guardrailPhrases.some((phrase) => lower.includes(phrase));
  return {
    passed,
    summary: passed
      ? 'Refined Prompt encodes unresolved uncertainty as in-prompt guardrails'
      : 'Expected verification or guardrail language inside the Refined Prompt',
  };
}

export function analyzeCategorySwitchCarryover(text: string): {
  passed: boolean;
  summary: string;
} {
  const lower = text.toLowerCase();

  const namesAgentPrompt =
    lower.includes('agent prompt') || lower.includes('agent-prompt');
  if (!namesAgentPrompt) {
    return {
      passed: false,
      summary: 'Expected Agent Prompt category switch language',
    };
  }

  if (analyzeCodingCategoryConfirmation(text).passed) {
    return {
      passed: false,
      summary: 'Expected no Coding Category Confirmation during category switch',
    };
  }

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
  const mentionsCarryover = carryoverSignals.some((phrase) =>
    lower.includes(phrase),
  );
  const asksGapFill =
    /tool scope|file scope|permission|cursor/i.test(text) ||
    countQuestionMarks(text) >= 1;

  const passed = mentionsCarryover || asksGapFill;
  return {
    passed,
    summary: passed
      ? 'Category switch carries prior context or asks a category-specific gap-fill question'
      : 'Expected prior context carryover or an Agent Prompt gap-fill question',
  };
}

export function analyzePromptOnlyDelivery(text: string): {
  passed: boolean;
  summary: string;
} {
  const lower = text.toLowerCase();
  const forbidden = [
    'production note',
    'chain of thought',
    'here is why',
    'i chose this',
    'commentary',
  ];

  const violations = forbidden.filter((phrase) => lower.includes(phrase));
  const passed = violations.length === 0;
  return {
    passed,
    summary: passed
      ? 'Delivery is prompt-only without production commentary'
      : `Forbidden commentary detected: ${violations.join(', ')}`,
  };
}

export function analyzeSingleDisambiguationQuestion(text: string): {
  passed: boolean;
  summary: string;
} {
  const questionCount = countDisambiguationQuestions(text);
  const passed = questionCount >= 1 && questionCount <= 2;
  return {
    passed,
    summary: passed
      ? 'Disambiguation turn asks exactly one category question'
      : `Expected 1-2 question marks in the One Question section, found ${questionCount}`,
  };
}