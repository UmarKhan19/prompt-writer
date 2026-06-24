import { createScorer } from '@mastra/core/evals';
import { analyzeTurnDiscipline } from './scorer-utils';

export function createTurnDisciplineScorer(options?: {
  maxQuestionMarks?: number;
}) {
  const id =
    options?.maxQuestionMarks === undefined
      ? 'turn-discipline'
      : `turn-discipline-max-${options.maxQuestionMarks}-questions`;

  return createScorer({
    id,
    description:
      'Verifies the turn avoids task-specific clarification and respects question budget',
  })
    .analyze(({ run }) =>
      analyzeTurnDiscipline(String(run.output), options ?? {}),
    )
    .generateScore(({ results }) => (results.analyzeStepResult.passed ? 1 : 0))
    .generateReason(({ results }) => results.analyzeStepResult.summary);
}

export const turnDisciplineScorer = createTurnDisciplineScorer();

export const categoryConfirmationTurnDisciplineScorer = createTurnDisciplineScorer({
  maxQuestionMarks: 2,
});