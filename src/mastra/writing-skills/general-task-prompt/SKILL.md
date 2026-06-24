---
name: general-task-prompt
description: Category skill for refining non-code prompts for writing, research, planning, analysis, summarization, ideation, decision support, or general LLM tasks.
---

# General Task Prompt Skill

## Purpose

Use this skill to write precise prompts for general LLM tasks that are not primarily software implementation and not specifically intended for an autonomous AI coding agent.

This category keeps the prompt focused on audience, context, desired output, constraints, tone, and quality bar.

## Use This Category When

Use `general-task-prompt` when the source prompt is about:

- writing or rewriting
- research
- analysis
- summarization
- ideation
- planning
- learning or teaching
- decision support
- critique
- extraction or classification outside a coding-agent workflow
- general productivity or communication tasks

## Do Not Use This Category When

Use `coding-prompt` when the task is mainly about software engineering.

Use `agent-prompt` when the final prompt will be consumed by an AI coding agent that will use tools, edit files, run commands, or inspect a workspace.

## Clarification Priorities

Prioritize missing information in this order:

1. Main goal
2. Audience or recipient
3. Context the model needs
4. Desired output format
5. Tone, style, or voice
6. Length or depth
7. Sources or grounding requirements
8. Constraints and things to avoid
9. Success criteria

## Exact Refined Prompt Sections

The final refined prompt for this category must use these sections, in this order:

```md
# Goal

# Context

# Audience

# Inputs

# Task Requirements

# Constraints

# Output Format

# Quality Bar

# What To Avoid
```

## Section Rules

- `Goal` must state the single primary outcome.
- `Context` should include background needed to do the task well.
- `Audience` should identify who the output is for, if relevant.
- `Inputs` should describe any material the model will receive and how to treat it.
- `Task Requirements` should define exactly what the model must do.
- `Constraints` should include tone, length, source, safety, or factual boundaries.
- `Output Format` must be specific enough to copy into another model.
- `Quality Bar` should define what a good answer looks like.
- `What To Avoid` should name common failure modes for this task.
