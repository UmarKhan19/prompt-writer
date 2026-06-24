import { analyzePromptOnlyDelivery } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const promptOnlyDeliveryScorer = createContractScorer({
  id: 'prompt-only-delivery',
  description:
    'Verifies Refined Prompt delivery excludes production notes and commentary',
  analyze: analyzePromptOnlyDelivery,
});