import { analyzeCodingCategoryConfirmation } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const codingCategoryConfirmationScorer = createContractScorer({
  id: 'coding-category-confirmation',
  description: 'Verifies Category Confirmation names Coding Prompt',
  analyze: analyzeCodingCategoryConfirmation,
});