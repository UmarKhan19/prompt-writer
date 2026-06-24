# Scripted turn-pair scenarios are the Conversation CI contract

Multi-turn Conversation behavior is tested by driving the Prompt Writer Agent through declarative scenario scripts: alternating user messages and scripted model responses, with assertions on phase-discipline steps and the final step. Seven PRD scenarios run deterministically in CI without model credentials.

Live-model tests duplicated happy paths and covered edge cases with conditional retries when the LLM asked unexpected follow-up questions. That coupling made CI flaky and hid the Conversation contract behind string-heuristic workarounds at assertion sites.

We keep exactly one live smoke tracer (Coding happy path) to catch regressions in system instructions and Category Writing Skills that scripted mocks cannot see. All other live tracer blocks are removed once scripted equivalents exist. Scenarios are strictly linear — no conditional branches in the runner.

**Considered options:** (1) Keep all live tracers alongside scripted tests — rejected as duplicate maintenance. (2) Remove all live tests — rejected; one real-model canary retains signal on instruction drift. (3) Scripted CI contract + one smoke tracer — chosen.

**Consequences:** `conversation-scenarios.ts` holds scenario definitions; `run-conversation-scenario.ts` owns the runner and default memory isolation. Edge-case coverage no longer depends on `skipIf(hasModelCredentials())`.