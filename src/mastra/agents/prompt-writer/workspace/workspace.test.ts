import { describe, expect, test } from 'bun:test';
import { createTestMastra } from '../../../create-test-mastra';
import {
  CORE_WRITING_SKILL_PATH,
  listCategorySchemas,
} from '../category-schema';
import { getPromptWriterWorkspaceSkillPaths } from './index';

describe('Prompt Writer Workspace', () => {
  test('registers Core Writing Skill first, then category skills from schema reader', () => {
    const expectedSkillPaths = [
      CORE_WRITING_SKILL_PATH,
      ...listCategorySchemas().map((entry) => entry.skillPath),
    ];

    expect(getPromptWriterWorkspaceSkillPaths()).toEqual(expectedSkillPaths);
  });

  test('exposes all five Writing Skills for agent discovery', async () => {
    const mastra = await createTestMastra();
    const agent = mastra.getAgentById('prompt-writer');
    const workspace = await agent.getWorkspace();
    expect(workspace).toBeDefined();

    const skills = await workspace!.skills.list();
    const skillNames = skills.map((skill) => skill.name).sort();

    expect(skillNames).toEqual(
      [...getPromptWriterWorkspaceSkillPaths()].sort(),
    );
  });
});