import type { ModelWithRetries } from '@mastra/core/agent';

const FALLBACK_MODEL = 'opencode/deepseek-v4-flash-free';

const PROVIDER_ENV_KEYS: Record<string, string> = {
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
  google: 'GOOGLE_GENERATIVE_AI_API_KEY',
  opencode: 'OPENCODE_API_KEY',
};

const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  openai: 'openai/gpt-4.1-mini',
  anthropic: 'anthropic/claude-sonnet-4-6',
  google: 'google/gemini-2.5-flash',
  opencode: FALLBACK_MODEL,
};

function resolvePrimaryModel(): string | undefined {
  const explicitModel = process.env.PROMPT_WRITER_MODEL ?? process.env.MASTRA_MODEL;
  if (explicitModel) {
    return explicitModel;
  }

  for (const [provider, envKey] of Object.entries(PROVIDER_ENV_KEYS)) {
    if (process.env[envKey]) {
      return PROVIDER_DEFAULT_MODELS[provider];
    }
  }

  return undefined;
}

export function resolvePromptWriterModels(): ModelWithRetries[] {
  const primaryModel = resolvePrimaryModel();
  const models: ModelWithRetries[] = [];

  if (primaryModel && primaryModel !== FALLBACK_MODEL) {
    models.push({ model: primaryModel });
  }

  models.push({ model: FALLBACK_MODEL });

  return models;
}