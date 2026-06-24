# Single async `createMastra()` factory for production and tests

Production `src/mastra/index.ts` and conversation tests use separate Mastra bootstrap paths. Registration tests import the full production instance (composite LibSQL + DuckDB observability, deployer, top-level `await`). Conversation tests build an inline minimal `Mastra` with `:memory:` LibSQL only.

We extract `async createMastra(options?)` with an options object exposing `storage`, `observability`, `scorers`, and `agents`. Deployer and logger are production-only internals applied by default, not exposed as test knobs. `index.ts` becomes `export const mastra = await createMastra()`.

Tests never import `index.ts`. A `createTestMastra(overrides?)` wrapper merges partial options onto test defaults (`:memory:` storage, no observability, no deployer, no scorer registration). Tests import scorers directly per ADR-0003. The live Coding smoke tracer calls `await createMastra()` with production defaults — same bootstrap path as production, not a separate entry point.

**Considered options:** (1) Named profiles only — rejected; options object scales better. (2) Tests keep importing production `mastra` — rejected; couples CI to DuckDB init. (3) Sync factory with lazy DuckDB — rejected; one async factory is clearer.

**Consequences:** `prompt-writer.test.ts` migrates to `createTestMastra()`. One dedicated test may assert production `createMastra()` registers scorers. Factory module lives at `src/mastra/create-mastra.ts`.