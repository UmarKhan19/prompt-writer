import { createScorer } from '@mastra/core/evals';

type ContractAnalysis = {
  passed: boolean;
  summary: string;
};

export function createContractScorer({
  id,
  description,
  analyze,
}: {
  id: string;
  description: string;
  analyze: (text: string) => ContractAnalysis;
}) {
  return createScorer({
    id,
    description,
  })
    .analyze(({ run }) => analyze(String(run.output)))
    .generateScore(({ results }) => (results.analyzeStepResult.passed ? 1 : 0))
    .generateReason(({ results }) => results.analyzeStepResult.summary);
}