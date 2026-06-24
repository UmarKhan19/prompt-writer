import { analyzeForcedProceedGuardrails } from './scorer-utils';
import { createContractScorer } from './create-contract-scorer';

export const forcedProceedGuardrailsScorer = createContractScorer({
  id: 'forced-proceed-guardrails',
  description:
    'Verifies Forced Proceed encodes unresolved uncertainty inside the Refined Prompt',
  analyze: analyzeForcedProceedGuardrails,
});