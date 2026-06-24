import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { resolveProjectPath } from './resolve-project-path';

export type SectionKind = 'refined-prompt' | 'disambiguation-response';

export type CategorySchemaEntry = {
  category: string;
  skillPath: string;
  sectionKind: SectionKind;
  sections: string[];
};

export type CategorySchemaReaderOptions = {
  writingSkillsRoot?: string;
};

export const CORE_WRITING_SKILL_PATH = 'prompt-writing-core';

type CategoryMetadata = {
  category: string;
  skillPath: string;
  sectionKind: SectionKind;
  sectionHeading: '## Exact Refined Prompt Sections' | '## Exact Response Sections';
};

const CATEGORY_METADATA: readonly CategoryMetadata[] = [
  {
    category: 'coding',
    skillPath: 'coding-prompt',
    sectionKind: 'refined-prompt',
    sectionHeading: '## Exact Refined Prompt Sections',
  },
  {
    category: 'general-task',
    skillPath: 'general-task-prompt',
    sectionKind: 'refined-prompt',
    sectionHeading: '## Exact Refined Prompt Sections',
  },
  {
    category: 'agent-prompt',
    skillPath: 'agent-prompt',
    sectionKind: 'refined-prompt',
    sectionHeading: '## Exact Refined Prompt Sections',
  },
  {
    category: 'unknown',
    skillPath: 'unknown-prompt',
    sectionKind: 'disambiguation-response',
    sectionHeading: '## Exact Response Sections',
  },
] as const;

const cache = new Map<string, CategorySchemaEntry>();

function resolveWritingSkillsRoot(options?: CategorySchemaReaderOptions): string {
  return (
    options?.writingSkillsRoot ??
    resolveProjectPath('src/mastra/writing-skills')
  );
}

function cacheKey(
  metadata: CategoryMetadata,
  options?: CategorySchemaReaderOptions,
): string {
  return `${resolveWritingSkillsRoot(options)}:${metadata.category}`;
}

function parseSectionsFromSkillMarkdown(
  content: string,
  sectionHeading: CategoryMetadata['sectionHeading'],
  context: string,
): string[] {
  const headingIndex = content.indexOf(sectionHeading);
  if (headingIndex === -1) {
    throw new Error(
      `${context}: missing section block "${sectionHeading}" in SKILL.md`,
    );
  }

  const fencedBlockStart = content.indexOf('```md', headingIndex);
  if (fencedBlockStart === -1) {
    throw new Error(
      `${context}: missing fenced section list after "${sectionHeading}" in SKILL.md`,
    );
  }

  const blockContentStart = fencedBlockStart + '```md'.length;
  const fencedBlockEnd = content.indexOf('```', blockContentStart);
  if (fencedBlockEnd === -1) {
    throw new Error(
      `${context}: unclosed fenced section list after "${sectionHeading}" in SKILL.md`,
    );
  }

  const sections = content
    .slice(blockContentStart, fencedBlockEnd)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^#\s+/.test(line));

  if (sections.length === 0) {
    throw new Error(
      `${context}: no "#" section headings found under "${sectionHeading}" in SKILL.md`,
    );
  }

  return sections;
}

function loadCategorySchemaEntry(
  metadata: CategoryMetadata,
  options?: CategorySchemaReaderOptions,
): CategorySchemaEntry {
  const key = cacheKey(metadata, options);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const writingSkillsRoot = resolveWritingSkillsRoot(options);
  const skillFilePath = join(writingSkillsRoot, metadata.skillPath, 'SKILL.md');
  const content = readFileSync(skillFilePath, 'utf-8');
  const context = `Category schema for "${metadata.category}" (${metadata.skillPath})`;
  const sections = parseSectionsFromSkillMarkdown(
    content,
    metadata.sectionHeading,
    context,
  );

  const entry: CategorySchemaEntry = {
    category: metadata.category,
    skillPath: metadata.skillPath,
    sectionKind: metadata.sectionKind,
    sections,
  };

  cache.set(key, entry);
  return entry;
}

function findMetadataByCategory(category: string): CategoryMetadata {
  const metadata = CATEGORY_METADATA.find((entry) => entry.category === category);
  if (!metadata) {
    throw new Error(`Unknown Prompt Category: "${category}"`);
  }

  return metadata;
}

function findMetadataBySkillPath(skillPath: string): CategoryMetadata {
  const metadata = CATEGORY_METADATA.find(
    (entry) => entry.skillPath === skillPath,
  );
  if (!metadata) {
    throw new Error(`Unknown Category Writing Skill path: "${skillPath}"`);
  }

  return metadata;
}

export function listCategorySchemas(
  options?: CategorySchemaReaderOptions,
): readonly CategorySchemaEntry[] {
  return CATEGORY_METADATA.map((metadata) =>
    loadCategorySchemaEntry(metadata, options),
  );
}

export function getCategorySchemaByCategory(
  category: string,
  options?: CategorySchemaReaderOptions,
): CategorySchemaEntry {
  return loadCategorySchemaEntry(findMetadataByCategory(category), options);
}

export function getCategorySchemaBySkillPath(
  skillPath: string,
  options?: CategorySchemaReaderOptions,
): CategorySchemaEntry {
  return loadCategorySchemaEntry(findMetadataBySkillPath(skillPath), options);
}