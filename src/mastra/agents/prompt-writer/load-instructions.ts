import { readFileSync } from 'node:fs';
import { resolveProjectPath } from './resolve-project-path';

export function loadPromptWriterInstructions(): string {
  const instructionsPath = resolveProjectPath(
    'src/mastra/agents/prompt-writer/system-instructions.md',
  );

  return readFileSync(instructionsPath, 'utf8');
}