import { analyzeAdjacentCategoryMention } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const adjacentCategoryMentionScorer = createContractScorer({
  id: 'adjacent-category-mention',
  description:
    'Verifies Category Confirmation mentions an Adjacent Category with executor distinction',
  analyze: analyzeAdjacentCategoryMention,
});