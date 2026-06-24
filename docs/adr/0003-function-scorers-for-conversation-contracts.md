# Conversation contracts are Mastra function scorers

Behavioral assertions for the Prompt Writer Agent live in `test-helpers.ts` as phrase lists and regex heuristics. `@mastra/evals` is installed but unused. The PRD marked custom eval scorers out of v1 scope, yet also listed scorers as a preferred testing approach.

We migrate all Conversation contracts to function-based custom scorers now: one scorer per contract (~10), deterministic `analyze` + `generateScore` pipelines with no judge model. Scorers live under `src/mastra/agents/prompt-writer/scorers/`, register on the production `mastra` instance, and are invoked in tests via direct import and `scorer.run()` — matching Mastra's CI pattern. Scorers are not attached to the agent for live sampling in v1.

Section-order scorers use a `createSectionOrderScorer({ category })` factory fed by the category-schema reader. Scores are binary (`0` or `1`); `generateReason` carries partial diagnostics. `test-helpers.ts` retains only infrastructure (`createScriptedMockModel`, `hasModelCredentials`); shared parsing utils move to `scorer-utils.ts`.

**Considered options:** (1) Defer scorers — rejected; dependency already present and contracts belong at the eval seam. (2) Partial migration (structural only) — rejected in favor of full migration. (3) LLM rubric scorers — rejected; conflicts with deterministic scripted CI from ADR-0002.

**Consequences:** PRD out-of-scope line on custom scorers is superseded. Implementation depends on category-schema reader (#1) and scripted scenario runner (#2). Studio gains trace-scoring visibility via Mastra registration.