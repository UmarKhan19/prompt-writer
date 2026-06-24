import { analyzeCategorySwitchCarryover } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const categorySwitchCarryoverScorer = createContractScorer({
  id: 'category-switch-carryover',
  description:
    'Verifies Category Switch to Agent Prompt carries prior context or asks a gap-fill question',
  analyze: analyzeCategorySwitchCarryover,
});