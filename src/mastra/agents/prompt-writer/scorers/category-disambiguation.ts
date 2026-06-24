import { analyzeCategoryDisambiguation } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const categoryDisambiguationScorer = createContractScorer({
  id: 'category-disambiguation',
  description:
    'Verifies Unknown Source Prompt yields a Category Disambiguation response',
  analyze: analyzeCategoryDisambiguation,
});