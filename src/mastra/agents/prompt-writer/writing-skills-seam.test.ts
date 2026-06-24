import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolveProjectPath } from './resolve-project-path';

function loadWritingSkill(skillPath: string): string {
  return readFileSync(
    resolveProjectPath('src/mastra/writing-skills', skillPath, 'SKILL.md'),
    'utf-8',
  );
}

function skillIntroBeforeFirstSection(content: string): string {
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n/, '');
  const firstSectionIndex = withoutFrontmatter.indexOf('\n## ');

  return firstSectionIndex === -1
    ? withoutFrontmatter
    : withoutFrontmatter.slice(0, firstSectionIndex);
}

describe('Writing Skills conversation-flow seam (ADR-0005)', () => {
  test('Core Writing Skill opens with a pointer to system instructions for phase rules', () => {
    const content = loadWritingSkill('prompt-writing-core');
    expect(skillIntroBeforeFirstSection(content)).toMatch(
      /conversation phase rules live in system instructions/i,
    );
  });

  test('Core Writing Skill keeps writing craft and omits Conversation flow sections', () => {
    const content = loadWritingSkill('prompt-writing-core');

    expect(content).toMatch(/## Universal Mental Model/);
    expect(content).toMatch(/## Universal Prompt-Writing Workflow/);
    expect(content).toMatch(/## Reliability Checklist/);
    expect(content).toMatch(/## References/);
    expect(content).not.toMatch(/## Load Order/);
    expect(content).not.toMatch(/## Clarify-First Rules/);
    expect(content).not.toMatch(/## Universal Output Discipline/);
  });

  test.each([
    'coding-prompt',
    'general-task-prompt',
    'agent-prompt',
    'unknown-prompt',
  ] as const)('%s lists clarification priorities without turn-discipline phrasing', (skillPath) => {
    const content = loadWritingSkill(skillPath);
    const prioritiesMatch = content.match(
      /## Clarification Priorit(?:y|ies)\n+([\s\S]*?)(?=\n## )/,
    );

    expect(prioritiesMatch).not.toBeNull();
    const prioritiesSection = prioritiesMatch![1];

    expect(prioritiesSection).toMatch(/prioritize missing information in this order/i);
    expect(prioritiesSection).not.toMatch(/ask one question at a time/i);
  });

  test('Unknown Category Writing Skill has no Forced Proceed flow section', () => {
    const content = loadWritingSkill('unknown-prompt');

    expect(content).not.toMatch(/## If The User Forces A Prompt Anyway/i);
    expect(content).toMatch(/## Exact Response Sections/);
    expect(content).toMatch(/## Section Rules/);
  });
});