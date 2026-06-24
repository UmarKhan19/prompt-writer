import { MastraLanguageModelV2Mock } from '@mastra/core/test-utils/llm-mock';

export function hasModelCredentials(): boolean {
  return Boolean(
    process.env.PROMPT_WRITER_MODEL ||
      process.env.MASTRA_MODEL ||
      process.env.OPENAI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.OPENCODE_API_KEY ||
      process.env.MASTRA_PLATFORM_ACCESS_TOKEN,
  );
}

export function createScriptedMockModel(responses: string[]) {
  let callIndex = 0;

  const nextResponse = () =>
    responses[Math.min(callIndex++, Math.max(responses.length - 1, 0))] ?? '';

  return new MastraLanguageModelV2Mock({
    doGenerate: async () => ({
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
      content: [{ type: 'text', text: nextResponse() }],
      warnings: [],
    }),
  });
}