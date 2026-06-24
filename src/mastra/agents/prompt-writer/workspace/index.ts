import { Workspace, LocalFilesystem } from '@mastra/core/workspace';
import {
  CORE_WRITING_SKILL_PATH,
  listCategorySchemas,
} from '../category-schema';
import { resolveProjectPath } from '../resolve-project-path';

export function createPromptWriterWorkspace(): Workspace {
  const writingSkillsRoot = resolveProjectPath('src/mastra/writing-skills');
  const categorySkillPaths = listCategorySchemas().map((entry) => entry.skillPath);

  return new Workspace({
    id: 'prompt-writer-writing-skills',
    name: 'Prompt Writer Writing Skills',
    filesystem: new LocalFilesystem({
      basePath: writingSkillsRoot,
    }),
    skills: [CORE_WRITING_SKILL_PATH, ...categorySkillPaths],
  });
}

export function getPromptWriterWorkspaceSkillPaths(): readonly string[] {
  return [
    CORE_WRITING_SKILL_PATH,
    ...listCategorySchemas().map((entry) => entry.skillPath),
  ];
}