# Conversation phase rules live in system-instructions only

The Prompt Writer Agent's Conversation flow (skill load order, clarify-first turn discipline, Category Switch, Forced Proceed, Revision, prompt-only delivery) appeared in both `system-instructions.md` and `prompt-writing-core/SKILL.md`. Category skills repeated turn discipline ("ask one question at a time") and `unknown-prompt` duplicated Forced Proceed fallback behavior.

Per PRD intent, system instructions own Conversation flow; the Core Writing Skill owns writing quality (mental model, universal workflow, reliability checklist, references). We enforce a strict seam: strip all phase rules from the core skill and flow sections from category skills. Category skills retain Disambiguation Response / Refined Prompt section schemas, section rules, and clarification priority order only.

The core skill gets a one-line pointer at the top: conversation phase rules live in system instructions. Drift is guarded by manual review, not an automated phrase denylist test.

**Considered options:** (1) Keep clarify-first in core as "writing rules" — rejected; still duplicates flow. (2) Automated denylist test — rejected by maintainer; manual review suffices. (3) Category skills keep forced-proceed fallback — rejected; flow belongs in system-instructions.

**Consequences:** Editing a Conversation rule requires changing system-instructions only. Category skill authors focus on schema and clarification priorities. Tests that assert system-instruction strings may need updating after the cleanup.