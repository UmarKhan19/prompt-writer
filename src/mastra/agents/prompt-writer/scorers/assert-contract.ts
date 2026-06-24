import type { MastraScorer } from '@mastra/core/evals';

export async function assertConversationContract(
  scorer: MastraScorer<string, string, string, Record<string, unknown>>,
  text: string,
  expectedScore: 0 | 1 = 1,
): Promise<void> {
  const result = await scorer.run({ output: text });
  if (result.score !== expectedScore) {
    throw new Error(
      result.reason ??
        `Conversation contract "${scorer.id}" failed with score ${result.score}`,
    );
  }
}