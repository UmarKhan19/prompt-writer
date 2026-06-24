import type { MastraScorers } from '@mastra/core/evals';
import { agentPromptCategoryConfirmationScorer } from './agent-prompt-category-confirmation';
import { adjacentCategoryMentionScorer } from './adjacent-category-mention';
import { categoryConfirmationScorer } from './category-confirmation';
import { categoryDisambiguationScorer } from './category-disambiguation';
import { categorySwitchCarryoverScorer } from './category-switch-carryover';
import { codingCategoryConfirmationScorer } from './coding-category-confirmation';
import { forcedProceedGuardrailsScorer } from './forced-proceed-guardrails';
import { promptOnlyDeliveryScorer } from './prompt-only-delivery';
import {
  agentPromptSectionOrderScorer,
  codingSectionOrderScorer,
  createSectionOrderScorer,
  generalTaskSectionOrderScorer,
  unknownDisambiguationSectionOrderScorer,
} from './section-order';
import { singleDisambiguationQuestionScorer } from './single-disambiguation-question';
import {
  categoryConfirmationTurnDisciplineScorer,
  createTurnDisciplineScorer,
  turnDisciplineScorer,
} from './turn-discipline';

export {
  agentPromptCategoryConfirmationScorer,
  adjacentCategoryMentionScorer,
  categoryConfirmationScorer,
  categoryConfirmationTurnDisciplineScorer,
  categoryDisambiguationScorer,
  categorySwitchCarryoverScorer,
  codingCategoryConfirmationScorer,
  codingSectionOrderScorer,
  createSectionOrderScorer,
  createTurnDisciplineScorer,
  forcedProceedGuardrailsScorer,
  generalTaskSectionOrderScorer,
  agentPromptSectionOrderScorer,
  promptOnlyDeliveryScorer,
  singleDisambiguationQuestionScorer,
  turnDisciplineScorer,
  unknownDisambiguationSectionOrderScorer,
};

export const promptWriterScorers = {
  codingSectionOrder: codingSectionOrderScorer,
  generalTaskSectionOrder: generalTaskSectionOrderScorer,
  agentPromptSectionOrder: agentPromptSectionOrderScorer,
  unknownDisambiguationSectionOrder: unknownDisambiguationSectionOrderScorer,
  categoryConfirmation: categoryConfirmationScorer,
  codingCategoryConfirmation: codingCategoryConfirmationScorer,
  agentPromptCategoryConfirmation: agentPromptCategoryConfirmationScorer,
  categoryDisambiguation: categoryDisambiguationScorer,
  adjacentCategoryMention: adjacentCategoryMentionScorer,
  turnDiscipline: turnDisciplineScorer,
  categoryConfirmationTurnDiscipline: categoryConfirmationTurnDisciplineScorer,
  forcedProceedGuardrails: forcedProceedGuardrailsScorer,
  categorySwitchCarryover: categorySwitchCarryoverScorer,
  promptOnlyDelivery: promptOnlyDeliveryScorer,
  singleDisambiguationQuestion: singleDisambiguationQuestionScorer,
} satisfies MastraScorers;