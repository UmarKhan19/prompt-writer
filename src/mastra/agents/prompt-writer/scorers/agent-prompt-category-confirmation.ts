import { analyzeAgentPromptCategoryConfirmation } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const agentPromptCategoryConfirmationScorer = createContractScorer({
  id: 'agent-prompt-category-confirmation',
  description: 'Verifies Category Confirmation names Agent Prompt',
  analyze: analyzeAgentPromptCategoryConfirmation,
});