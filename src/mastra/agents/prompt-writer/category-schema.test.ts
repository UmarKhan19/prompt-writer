import { describe, expect, test } from 'bun:test';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { resolveProjectPath } from './resolve-project-path';
import {
  CORE_WRITING_SKILL_PATH,
  getCategorySchemaByCategory,
  getCategorySchemaBySkillPath,
  listCategorySchemas,
} from './category-schema';

function extractSectionsFromSkillFile(
  skillFilePath: string,
  sectionHeading: string,
): string[] {
  const content = readFileSync(skillFilePath, 'utf-8');
  const headingIndex = content.indexOf(sectionHeading);
  if (headingIndex === -1) {
    throw new Error(`Missing section heading: ${sectionHeading}`);
  }

  const fencedBlockStart = content.indexOf('```md', headingIndex);
  if (fencedBlockStart === -1) {
    throw new Error(`Missing fenced section block after ${sectionHeading}`);
  }

  const blockContentStart = fencedBlockStart + '```md'.length;
  const fencedBlockEnd = content.indexOf('```', blockContentStart);
  if (fencedBlockEnd === -1) {
    throw new Error(`Unclosed fenced section block after ${sectionHeading}`);
  }

  return content
    .slice(blockContentStart, fencedBlockEnd)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^#\s+/.test(line));
}

describe('Category Schema', () => {
  test('coding sections match its Category Writing Skill file', () => {
    const skillFilePath = resolveProjectPath(
      'src/mastra/writing-skills/coding-prompt/SKILL.md',
    );
    const expectedSections = extractSectionsFromSkillFile(
      skillFilePath,
      '## Exact Refined Prompt Sections',
    );

    const entry = getCategorySchemaByCategory('coding');

    expect(entry.sections).toEqual(expectedSections);
  });

  test('parses section headers from all four Category Writing Skills', () => {
    const schemas = listCategorySchemas();

    expect(schemas).toHaveLength(4);
    expect(schemas.map((entry) => entry.category).sort()).toEqual([
      'agent-prompt',
      'coding',
      'general-task',
      'unknown',
    ]);

    for (const entry of schemas) {
      const sectionHeading =
        entry.sectionKind === 'disambiguation-response'
          ? '## Exact Response Sections'
          : '## Exact Refined Prompt Sections';
      const skillFilePath = resolveProjectPath(
        'src/mastra/writing-skills',
        entry.skillPath,
        'SKILL.md',
      );
      const expectedSections = extractSectionsFromSkillFile(
        skillFilePath,
        sectionHeading,
      );

      expect(entry.sections.length).toBeGreaterThan(0);
      expect(entry.sections).toEqual(expectedSections);
    }
  });

  test('unknown uses disambiguation-response; other categories use refined-prompt', () => {
    expect(getCategorySchemaByCategory('unknown').sectionKind).toBe(
      'disambiguation-response',
    );
    expect(getCategorySchemaByCategory('coding').sectionKind).toBe(
      'refined-prompt',
    );
    expect(getCategorySchemaByCategory('general-task').sectionKind).toBe(
      'refined-prompt',
    );
    expect(getCategorySchemaByCategory('agent-prompt').sectionKind).toBe(
      'refined-prompt',
    );
  });

  test('supports dual lookup by Prompt Category id and skill path', () => {
    const byCategory = getCategorySchemaByCategory('agent-prompt');
    const bySkillPath = getCategorySchemaBySkillPath('agent-prompt');

    expect(bySkillPath).toEqual(byCategory);
    expect(byCategory.skillPath).toBe('agent-prompt');
    expect(byCategory.category).toBe('agent-prompt');
  });

  test('does not include Core Writing Skill in the category registry', () => {
    const schemas = listCategorySchemas();
    const skillPaths = schemas.map((entry) => entry.skillPath);

    expect(skillPaths).not.toContain(CORE_WRITING_SKILL_PATH);
    expect(() => getCategorySchemaBySkillPath(CORE_WRITING_SKILL_PATH)).toThrow(
      /Unknown Category Writing Skill path/i,
    );
  });

  test('throws a descriptive error when a section block is missing', () => {
    const tempRoot = mkdtempSync(join(tmpdir(), 'prompt-writer-schema-'));
    const skillDir = join(tempRoot, 'coding-prompt');

    try {
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(
        join(skillDir, 'SKILL.md'),
        '# Broken Prompt Skill\n\n## Clarification Priorities\n\nNo section schema here.\n',
      );

      expect(() =>
        getCategorySchemaByCategory('coding', { writingSkillsRoot: tempRoot }),
      ).toThrow(/missing section block "## Exact Refined Prompt Sections"/i);
    } finally {
      rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});