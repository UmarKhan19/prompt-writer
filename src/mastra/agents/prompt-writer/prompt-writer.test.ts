import { describe, expect, test } from 'bun:test';
import { mastra } from '../../index';
import { loadPromptWriterInstructions } from './load-instructions';

const EXPECTED_WRITING_SKILLS = [
  'prompt-writing-core',
  'coding-prompt',
  'general-task-prompt',
  'agent-prompt',
  'unknown-prompt',
] as const;

describe('Prompt Writer Agent', () => {
  test('is registered on the Mastra instance', () => {
    const agent = mastra.getAgentById('prompt-writer');
    expect(agent).toBeDefined();
    expect(agent.id).toBe('prompt-writer');
  });

  test('workspace exposes all five Writing Skills for discovery', async () => {
    const agent = mastra.getAgentById('prompt-writer');
    const workspace = await agent.getWorkspace();
    expect(workspace).toBeDefined();

    const skills = await workspace!.skills.list();
    const skillNames = skills.map((skill) => skill.name).sort();

    expect(skillNames).toEqual([...EXPECTED_WRITING_SKILLS].sort());
  });

  test('uses thread-scoped memory for conversations', async () => {
    const agent = mastra.getAgentById('prompt-writer');
    const memory = await agent.getMemory();

    expect(memory).toBeDefined();
  });

  test('system instructions include Unknown one-turn Category Disambiguation rule', () => {
    const instructions = loadPromptWriterInstructions();

    expect(instructions).toContain('unknown-prompt');
    expect(instructions).toMatch(/Category Disambiguation/i);
    expect(instructions).toMatch(/one Category Disambiguation turn/i);
    expect(instructions).toMatch(/re-classify/i);
  });

  test('system instructions include Coding and Agent Prompt executor distinction for Adjacent Categories', () => {
    const instructions = loadPromptWriterInstructions();

    expect(instructions).toContain('coding-prompt');
    expect(instructions).toContain('agent-prompt');
    expect(instructions).toMatch(/adjacent categor/i);
    expect(instructions).toMatch(/AI coding agent/i);
    expect(instructions).toMatch(/coding-prompt.*agent-prompt|agent-prompt.*coding-prompt/s);
  });

  test('system instructions distinguish Unknown disambiguation format from Category Confirmation', () => {
    const instructions = loadPromptWriterInstructions();

    expect(instructions).toMatch(/Current Understanding/i);
    expect(instructions).toMatch(/Possible Categories/i);
    expect(instructions).toMatch(/One Question/i);
    expect(instructions).toMatch(/not the Category Confirmation format/i);
    expect(instructions).toMatch(/exactly one Category Disambiguation turn/i);
    expect(instructions).toMatch(/do something about my project/i);
    expect(instructions).toMatch(/Do not guess a category/i);
  });

  test('system instructions encode Forced Proceed uncertainty inside the prompt without external notes', () => {
    const instructions = loadPromptWriterInstructions();

    expect(instructions).toMatch(/Forced Proceed|proceed before all ambiguity/i);
    expect(instructions).toMatch(/verification or guardrail/i);
    expect(instructions).toMatch(/no external production notes|Do not add external production notes/i);
  });

  test('system instructions preserve category and section schema during Revision', () => {
    const instructions = loadPromptWriterInstructions();

    expect(instructions).toMatch(/revise the existing prompt instead of restarting/i);
    expect(instructions).toMatch(/preserve the confirmed category unless the user changes it/i);
    expect(instructions).toMatch(/exact output sections/i);
  });

  test('system instructions carry over context and gap-fill only on Category Switch', () => {
    const instructions = loadPromptWriterInstructions();

    expect(instructions).toMatch(/change category mid-conversation/i);
    expect(instructions).toMatch(/Keep any previous answers that still apply/i);
    expect(instructions).toMatch(/Ask only for missing information that is specific to the new category/i);
    expect(instructions).toMatch(/Do not restart the entire interview/i);
  });
});