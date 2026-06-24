---
name: unknown-prompt
description: Category skill for prompts that cannot be confidently classified as coding-prompt, general-task-prompt, or agent-prompt. Use this to ask a category-disambiguating question before loading a final category skill.
---

# Unknown Prompt Skill

## Purpose

Use this skill when the Prompt Writer Agent cannot confidently classify the user's source prompt.

This is not a final-output category unless the user explicitly refuses to choose. Its main job is to disambiguate the category with one clear question.

## Use This Category When

Use `unknown-prompt` when:

- the source prompt is too vague to classify
- two or more categories are equally plausible
- the prompt lacks enough context to know who or what will consume the refined prompt
- the user is asking about prompt-writing strategy rather than asking for a refined prompt

## Clarification Priorities

Prioritize missing information in this order:

1. Intended consumer of the refined prompt (general chatbot, human/developer, or AI coding agent)

Examples:

```txt
Who is going to consume the final prompt: a general chatbot, a human/developer, or an AI coding agent working in your repo?
```

```txt
Should I treat this as a coding prompt, a general task prompt, or a prompt for an AI coding agent to execute?
```

## Exact Response Sections

When using this category, the response must use these sections, in this order:

```md
# Current Understanding

# Possible Categories

# Best Guess

# One Question
```

## Section Rules

- `Current Understanding` must summarize the source prompt in one sentence.
- `Possible Categories` must list the relevant categories and what each would mean.
- `Best Guess` must state the current classification if there is one.
- `One Question` must ask exactly one category-disambiguating question.
