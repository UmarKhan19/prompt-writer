import { createScorer } from '@mastra/core/evals';
import { analyzeSectionOrder } from './scorer-utils';

export function createSectionOrderScorer({ category }: { category: string }) {
  return createScorer({
    id: `${category}-section-order`,
    description: `Verifies ${category} output sections appear in category schema order`,
  })
    .analyze(({ run }) => analyzeSectionOrder(String(run.output), category))
    .generateScore(({ results }) => (results.analyzeStepResult.passed ? 1 : 0))
    .generateReason(({ results }) => results.analyzeStepResult.summary);
}

export const codingSectionOrderScorer = createSectionOrderScorer({
  category: 'coding',
});

export const generalTaskSectionOrderScorer = createSectionOrderScorer({
  category: 'general-task',
});

export const agentPromptSectionOrderScorer = createSectionOrderScorer({
  category: 'agent-prompt',
});

export const unknownDisambiguationSectionOrderScorer = createSectionOrderScorer({
  category: 'unknown',
});