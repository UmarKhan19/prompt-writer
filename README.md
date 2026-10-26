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

## Local setup

**Prerequisites:** [Bun](https://bun.sh), Node.js ≥ 22.13.0, and a reachable PostgreSQL database. Runtime storage uses Mastra's `PostgresStore`; `DATABASE_URL` is required even for local development. The in-memory LibSQL store is only configured by the test factory, not by `bun run dev`.

```shell
cp .env.example .env
# Set DATABASE_URL to a PostgreSQL connection string.
# The example uses Neon; a local PostgreSQL instance also works.
bun install
bun run dev
```

The project has no checked-in SQL schema or migration files. Runtime configuration passes the connection string to Mastra's PostgreSQL storage adapter. This repository does not define a separate database initialization command.

Set `OPENCODE_API_KEY` for the OpenCode fallback model, which is always in the retry chain. To choose a primary model, set `PROMPT_WRITER_MODEL` (or Mastra's `MASTRA_MODEL`) and the matching provider key, for example `OPENAI_API_KEY` for `openai/gpt-4.1-mini`. If neither model variable is set, the agent selects a default from the first configured provider key. See [`.env.example`](./.env.example) and [`resolve-model.ts`](./src/mastra/agents/prompt-writer/resolve-model.ts).

`bun run dev` opens Mastra Studio at [http://localhost:4111](http://localhost:4111). Studio is Mastra's developer console. This repository does not include a custom product frontend. The configured public URL, [prompt-writer-lemon.vercel.app](https://prompt-writer-lemon.vercel.app), was observed opening Mastra Studio, not a verified product workflow. No login, prompt-generation flow, or authorization behavior is claimed as verified.

## Testing

```shell
bun run test
```

Most tests use scripted model responses and do not require provider API keys. Seven authored conversation scenarios cover category confirmation, clarification, delivery, forced proceed, revisions, and category switching; contract scorers check turn behavior and output section order. These are test definitions, not a claim that the suite passed in this documentation update.

Scenario definitions live in [`conversation-scenarios.ts`](./src/mastra/agents/prompt-writer/conversation-scenarios.ts); the runner injects scripted model replies and isolated in-memory test storage in [`run-conversation-scenario.ts`](./src/mastra/agents/prompt-writer/run-conversation-scenario.ts) and [`create-test-mastra.ts`](./src/mastra/create-test-mastra.ts). Tests and scorers are under [`src/mastra/agents/prompt-writer/`](./src/mastra/agents/prompt-writer/). See [ADR 0002](./docs/adr/0002-scripted-scenarios-as-ci-contract.md) for the rationale.

## Project map

| Path | What it is |
| --- | --- |
| [`src/mastra/agents/prompt-writer/`](./src/mastra/agents/prompt-writer/) | Prompt Writer Agent — instructions, scorers, tests, conversation runner |
| [`src/mastra/agents/prompt-writer/system-instructions.md`](./src/mastra/agents/prompt-writer/system-instructions.md) | Authored conversation flow and agent behavior |
| [`src/mastra/agents/prompt-writer/scorers/`](./src/mastra/agents/prompt-writer/scorers/) | Function scorers that enforce turn discipline and output contracts |
| [`src/mastra/agents/prompt-writer/conversation-scenarios.ts`](./src/mastra/agents/prompt-writer/conversation-scenarios.ts) | Scripted multi-turn scenario definitions |
| [`src/mastra/agents/prompt-writer/run-conversation-scenario.ts`](./src/mastra/agents/prompt-writer/run-conversation-scenario.ts) | Scenario runner and step assertions |
| [`src/mastra/agents/prompt-writer/category-schema.ts`](./src/mastra/agents/prompt-writer/category-schema.ts) | Parses Refined Prompt section order from Category Writing Skills |
| [`src/mastra/writing-skills/`](./src/mastra/writing-skills/) | Core and Category Writing Skills (`SKILL.md` per category) |
| [`src/mastra/create-mastra.ts`](./src/mastra/create-mastra.ts) | Runtime config, required PostgreSQL storage, observability |
| [`src/mastra/index.ts`](./src/mastra/index.ts) | Mastra entry point and Studio-enabled Vercel deployer |
| [`CONTEXT.md`](./CONTEXT.md) | Domain glossary — canonical terms for prompts, categories, and flow |
| [`docs/adr/`](./docs/adr/) | Architecture decision records |

## Making changes

- **Conversation flow** (classify, confirm, clarify, deliver) → [`system-instructions.md`](./src/mastra/agents/prompt-writer/system-instructions.md)
- **Category output sections and clarification priorities** → [`src/mastra/writing-skills/<category>/SKILL.md`](./src/mastra/writing-skills/)
- **CI contract** (expected turns and output shape) → [`conversation-scenarios.ts`](./src/mastra/agents/prompt-writer/conversation-scenarios.ts) and [`scorers/`](./src/mastra/agents/prompt-writer/scorers/)

## Further reading

- [CONTEXT.md](./CONTEXT.md) — ubiquitous language for this project
- [docs/adr/](./docs/adr/) — why skills own section schemas, scripted scenarios are the CI contract, and more

## Mastra tooling

| Command | What it does |
| --- | --- |
| `bun run dev` | Start dev server; Mastra Studio at [http://localhost:4111](http://localhost:4111) |
| `bun run build` | Sync public Markdown assets, then build with Mastra |
| `bun run start` | Run the built Mastra server |

The package scripts also define `bun run test` for the Prompt Writer test directory. Deployment uses Mastra's [`VercelDeployer`](./src/mastra/index.ts) with `studio: true`; Vercel deployment status does not establish that an end-user product workflow works.
