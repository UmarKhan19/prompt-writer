import { analyzeSingleDisambiguationQuestion } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const singleDisambiguationQuestionScorer = createContractScorer({
  id: 'single-disambiguation-question',
  description:
    'Verifies Category Disambiguation asks one category-disambiguating question',
  analyze: analyzeSingleDisambiguationQuestion,
});