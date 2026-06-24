# Prompt Writer

You have a vague idea — fix a bug, research a topic, scope work for a coding agent — but you need a precise, copy-ready prompt before you hand it to an LLM or AI coding agent. Guessing at scope, constraints, and acceptance criteria produces prompts that miss the mark.

Prompt Writer is a Mastra agent that interviews you first, then delivers a structured prompt you can paste and run.

## How it works

In this project, your input is a **Source Prompt** and the deliverable is a **Refined Prompt**. See [CONTEXT.md](./CONTEXT.md) for the full glossary.

1. **Classify** the Source Prompt into a Prompt Category.
2. **Category Confirmation** — announce the chosen category, name Adjacent Categories, and wait for your OK.
3. **Clarify-first** — one clarifying question per turn until clarification is complete, or you request a Refined Prompt early (Forced Proceed).
4. **Deliver a Refined Prompt** — the prompt alone, with category-specific sections. No commentary alongside it.
5. **Revision** — request changes within the same Conversation without restarting from the Source Prompt.

### Prompt Categories

| Category | Use when | Executor |
| --- | --- | --- |
| **Coding** | Software work — bugs, features, refactors, tests, infrastructure | Human or general LLM |
| **General Task** | Non-code LLM work — research, writing, analysis, planning | General LLM or human |
| **Agent Prompt** | The prompt will be consumed by an AI coding agent with tool and file access | AI coding agent |
| **Unknown** | Classification is unclear; triggers a single category-disambiguating question | — |

## Quickstart

**Prerequisites:** [Bun](https://bun.sh), Node ≥ 22.13.0

```shell
cp .env.example .env
bun install
bun run dev
```

Open [http://localhost:4111](http://localhost:4111) for Mastra Studio and chat with the Prompt Writer Agent.

### Model configuration

Set `PROMPT_WRITER_MODEL` to the model you want (e.g. `openai/gpt-4.1-mini`). The provider prefix must match a provider API key in the same file — `PROMPT_WRITER_MODEL` selects the model ID; it does not replace credentials.

`OPENCODE_API_KEY` is also required. A free OpenCode model is always in the retry chain as a fallback.

Without `PROMPT_WRITER_MODEL`, the agent auto-detects a default from whichever provider key is set. See [`.env.example`](./.env.example) for all supported providers.

## Testing

```shell
bun run test
```

Most tests use scripted conversation scenarios — deterministic, no API key required. They are the CI contract for multi-turn behavior.

One live-model smoke test exercises the real agent against actual system instructions and writing skills. It needs `PROMPT_WRITER_MODEL` (or a provider key) and `OPENCODE_API_KEY`.

Scenario definitions live in [`src/mastra/agents/prompt-writer/conversation-scenarios.ts`](./src/mastra/agents/prompt-writer/conversation-scenarios.ts). See [ADR 0002](./docs/adr/0002-scripted-scenarios-as-ci-contract.md) for the rationale.

## Project map

| Path | What it is |
| --- | --- |
| [`src/mastra/agents/prompt-writer/`](./src/mastra/agents/prompt-writer/) | Prompt Writer Agent — instructions, scorers, tests, conversation runner |
| [`src/mastra/agents/prompt-writer/system-instructions.md`](./src/mastra/agents/prompt-writer/system-instructions.md) | Conversation flow and agent behavior |
| [`src/mastra/agents/prompt-writer/scorers/`](./src/mastra/agents/prompt-writer/scorers/) | Function scorers that enforce turn discipline and output contracts |
| [`src/mastra/agents/prompt-writer/conversation-scenarios.ts`](./src/mastra/agents/prompt-writer/conversation-scenarios.ts) | Scripted multi-turn scenario definitions |
| [`src/mastra/agents/prompt-writer/run-conversation-scenario.ts`](./src/mastra/agents/prompt-writer/run-conversation-scenario.ts) | Scenario runner and step assertions |
| [`src/mastra/agents/prompt-writer/category-schema.ts`](./src/mastra/agents/prompt-writer/category-schema.ts) | Parses Refined Prompt section order from Category Writing Skills |
| [`src/mastra/writing-skills/`](./src/mastra/writing-skills/) | Core and Category Writing Skills (`SKILL.md` per category) |
| [`src/mastra/create-mastra.ts`](./src/mastra/create-mastra.ts) | Mastra factory — storage, observability, Vercel deployer |
| [`src/mastra/index.ts`](./src/mastra/index.ts) | Mastra entry point and agent registration |
| [`CONTEXT.md`](./CONTEXT.md) | Domain glossary — canonical terms for prompts, categories, and flow |
| [`docs/adr/`](./docs/adr/) | Architecture decision records |
| [`docs/agents/domain.md`](./docs/agents/domain.md) | How to read domain docs before exploring the codebase |
| [`docs/agents/issue-tracker.md`](./docs/agents/issue-tracker.md) | Local markdown issue and PRD conventions |
| [`docs/agents/triage-labels.md`](./docs/agents/triage-labels.md) | Triage role strings for issue files |

## Making changes

- **Conversation flow** (classify, confirm, clarify, deliver) → [`system-instructions.md`](./src/mastra/agents/prompt-writer/system-instructions.md)
- **Category output sections and clarification priorities** → [`src/mastra/writing-skills/<category>/SKILL.md`](./src/mastra/writing-skills/)
- **CI contract** (expected turns and output shape) → [`conversation-scenarios.ts`](./src/mastra/agents/prompt-writer/conversation-scenarios.ts) and [`scorers/`](./src/mastra/agents/prompt-writer/scorers/)

## Further reading

- [CONTEXT.md](./CONTEXT.md) — ubiquitous language for this project
- [docs/adr/](./docs/adr/) — why skills own section schemas, scripted scenarios are the CI contract, and more
- [docs/agents/domain.md](./docs/agents/domain.md) — domain doc layout and reading order

## Mastra tooling

| Command | What it does |
| --- | --- |
| `bun run dev` | Start dev server; Mastra Studio at [http://localhost:4111](http://localhost:4111) |
| `bun run build` | Production build |
| `bun run start` | Run the built server |

Deploy: [`VercelDeployer`](./src/mastra/create-mastra.ts) is configured with `studio: true`. Run `bun run build` before deploying to Vercel.