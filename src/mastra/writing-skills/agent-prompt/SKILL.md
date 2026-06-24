---
name: agent-prompt
description: Category skill for refining prompts that will be consumed and executed by an AI coding agent working in a codebase or tool-enabled workspace.
---

# Agent Prompt Skill

## Purpose

Use this skill to write prompts for AI coding agents.

An Agent Prompt is not merely a coding prompt. It is an execution brief for an AI coding agent that may inspect files, run commands, edit code, use tools, and report results.

This category must constrain autonomy. The prompt should tell the agent what it may inspect, what it may change, what it must not touch, when to ask for approval, how to verify, and when to stop.

## Use This Category When

Use `agent-prompt` when the user wants a prompt for an AI coding agent to consume and execute, especially when the prompt mentions:

- “give me a prompt for Codex/opencode/Claude Code/Cursor/coding agent”
- an agent running on the user's machine
- inspecting a repo or workspace
- editing files
- running shell commands
- debugging a local system
- using tools to investigate before changing code
- producing a final implementation report

## Do Not Use This Category When

Use `coding-prompt` when the prompt is about software work but not specifically written for an AI coding agent to execute.

Use `general-task-prompt` when the task is not primarily coding or workspace execution.

## Adjacent Category Notes

Coding and Agent Prompt are close, but the distinction matters.

- `coding-prompt`: “Help me fix this React bug.”
- `agent-prompt`: “Write a prompt I can give an AI coding agent so it can fix this React bug in my repo.”

If both seem plausible, ask the user whether they are using an AI coding agent to execute the task.

## Clarification Priorities

Ask one question at a time. Prioritize missing information in this order:

1. Agent executor and environment: Codex, opencode, Cursor, Claude Code, local shell, remote workspace, etc.
2. Exact objective
3. Workspace or repo context
4. Relevant paths, files, configs, logs, docs, screenshots, or commands
5. What the agent is allowed to inspect
6. What the agent is allowed to edit
7. Tool and command boundaries
8. Approval triggers
9. Verification commands or expected checks
10. Final report format
11. Stop condition

## Exact Refined Prompt Sections

The final refined prompt for this category must use these sections, in this order:

```md
# Agent Role

# Objective

# Workspace Context

# Tool Scope And Permissions

# Files, Commands, And Evidence To Inspect

# Execution Flow

# Implementation Requirements

# Constraints And Safety Rules

# Approval Triggers

# Acceptance Criteria

# Verification Steps

# Final Report Format

# Stop Condition

# Out Of Scope
```

## Section Rules

- `Agent Role` must define the agent as an AI coding/debugging agent, not a vague expert.
- `Objective` must be one concrete outcome.
- `Workspace Context` must describe the project, stack, OS, package manager, runtime, or relevant local environment when known.
- `Tool Scope And Permissions` must say what tools/actions are allowed and when. Include shell/file-editing boundaries if relevant.
- `Files, Commands, And Evidence To Inspect` must list known paths, logs, docs, commands, screenshots, or symptoms.
- `Execution Flow` should require investigation before edits unless the task is trivial.
- `Implementation Requirements` should define the change strategy.
- `Constraints And Safety Rules` must prevent unrelated rewrites, secret exposure, destructive commands, and broad scope creep.
- `Approval Triggers` must identify actions requiring user confirmation, such as deleting files, changing dependencies, running destructive commands, force-pushing, or modifying secrets.
- `Acceptance Criteria` must be observable.
- `Verification Steps` must include concrete checks where possible.
- `Final Report Format` must tell the agent what to summarize: root cause, files changed, commands run, verification result, and remaining risks.
- `Stop Condition` must tell the agent when the task is done.
- `Out Of Scope` must list things the agent should not do.

## Agent Tooling Guidance

A safe agent prompt should define:

- goal
- available tools
- when each tool should be used
- when not to use each tool
- required tool arguments
- tool safety boundaries
- state tracking
- stop condition
- human approval triggers
- final output format

Do not write prompts that let an agent do everything freely.

Bad:

```txt
You can browse, run commands, send emails, update the database, and do whatever is needed.
```

Better:

```txt
You may only use the listed tools.
Before using any tool that modifies external state, ask for explicit user approval.
Never access secrets unless the user provided them for this task.
Stop once you have enough evidence to answer the user's question.
```
