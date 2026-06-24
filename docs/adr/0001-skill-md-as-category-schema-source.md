# Category Writing Skills own section schemas; TypeScript parses them

The Prompt Category section order is defined in each Category Writing Skill's SKILL.md. Tests and workspace registration previously duplicated that data in TypeScript constants, causing drift risk.

We keep SKILL.md as the authoritative source (per PRD) and introduce a category-schema reader module that parses section headers from skill files at runtime. The reader holds an explicit metadata table (Prompt Category id, skill path, section kind) and extracts exact `#` heading lines from the appropriate `## Exact … Sections` block. Parsed results are lazily cached; missing blocks fail fast with a descriptive error.

**Considered options:** (1) TypeScript manifest with a parity test against SKILL.md — rejected because it maintains two sources. (2) Codegen from manifest into SKILL.md — rejected because markdown becomes a generated artifact skill authors cannot edit directly. (3) Parse SKILL.md — chosen because the agent already loads skills from the workspace; tests read the same files the agent sees.

**Consequences:** Section-order tests depend on filesystem reads (cached per process). Workspace skill paths come from the same registry module, with Core Writing Skill registered separately. Unknown uses section kind `disambiguation-response` and heading `## Exact Response Sections`; all other categories use `refined-prompt` and `## Exact Refined Prompt Sections`.