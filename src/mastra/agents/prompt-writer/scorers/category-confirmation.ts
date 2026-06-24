import { analyzeCategoryConfirmation } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const categoryConfirmationScorer = createContractScorer({
  id: 'category-confirmation',
  description:
    'Verifies the agent announces a Prompt Category and asks the user to confirm or correct',
  analyze: analyzeCategoryConfirmation,
});