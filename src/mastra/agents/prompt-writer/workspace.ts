import { Workspace, LocalFilesystem } from '@mastra/core/workspace';
import { resolveProjectPath } from './resolve-project-path';

const writingSkillsRoot = resolveProjectPath('src/mastra/writing-skills');

const WRITING_SKILL_PATHS = [
  'prompt-writing-core',
  'coding-prompt',
  'general-task-prompt',
  'agent-prompt',
  'unknown-prompt',
] as const;

export function createPromptWriterWorkspace(): Workspace {
  return new Workspace({
    id: 'prompt-writer-writing-skills',
    name: 'Prompt Writer Writing Skills',
    filesystem: new LocalFilesystem({
      basePath: writingSkillsRoot,
    }),
    skills: [...WRITING_SKILL_PATHS],
  });
}