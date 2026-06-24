---
name: coding-prompt
description: Category skill for refining prompts about software coding work that a human or general assistant will use. Use this when the prompt asks for debugging, implementation, refactoring, tests, architecture, or code review, but is not specifically written for an autonomous AI coding agent to execute inside a workspace.
---

# Coding Prompt Skill

## Purpose

Use this skill to write precise prompts for software engineering work.

This category is for coding work as the task domain. The executor may be a human, a chat assistant, or a general coding helper, but the prompt does not need detailed autonomous-agent tool scope.

## Use This Category When

Use `coding-prompt` when the source prompt is about:

- fixing bugs
- adding features
- refactoring code
- reviewing code
- improving UI or UX in an app
- writing tests
- debugging a local development issue
- explaining or improving architecture
- writing implementation plans for a developer

## Do Not Use This Category When

Use `agent-prompt` instead when the user is writing a prompt for an AI coding agent to consume and execute in a local repo or remote workspace.

Use `general-task-prompt` instead when the prompt is not primarily about code or software systems.

## Adjacent Category Notes

Coding and Agent Prompt are close.

- `coding-prompt` means the prompt is about software work.
- `agent-prompt` means the prompt is written for an AI coding agent that will inspect files, run commands, edit code, and report back.

If both seem plausible, category confirmation must explicitly mention both.

## Clarification Priorities

Ask one question at a time. Prioritize missing information in this order:

1. Exact desired outcome
2. Current behavior or current state
3. Expected behavior
4. Tech stack, framework, runtime, OS, or environment
5. Relevant files, commands, logs, screenshots, or error messages
6. Constraints: what must not change
7. Acceptance criteria
8. Verification method

## Exact Refined Prompt Sections

The final refined prompt for this category must use these sections, in this order:

```md
# Objective

# Current Context

# Expected Outcome

# Technical Environment

# Scope

# Relevant Files, Commands, Or Evidence

# Constraints

# Implementation Requirements

# Acceptance Criteria

# Verification Steps

# Out Of Scope
```

## Section Rules

- `Objective` must be one clear sentence.
- `Current Context` should include what exists now and what is broken or missing.
- `Expected Outcome` should describe the desired behavior from the user's point of view.
- `Technical Environment` should include stack, OS, framework, package manager, runtime, or platform when known.
- `Scope` should define what the executor may change.
- `Relevant Files, Commands, Or Evidence` should include paths, logs, screenshots, docs, or commands when provided.
- `Constraints` should include “do not change” rules.
- `Implementation Requirements` should tell the executor how to approach the work without over-prescribing unknown internals.
- `Acceptance Criteria` should be testable.
- `Verification Steps` should include concrete commands or manual checks where possible.
- `Out Of Scope` should prevent scope creep.
