# Prompt Writer

Transforms vague source prompts into precise refined prompts through classification, clarification, and category-specific writing guidance.

## Language

**Source Prompt**:
The raw, often vague input a user provides before refinement.
_Avoid_: Input, user message, draft

**Refined Prompt**:
The final, unambiguous prompt produced after classification and clarification. Structured with category-specific sections (e.g. Goal, Constraints, Acceptance Criteria). Delivered as the prompt alone — no production notes or commentary alongside it.
_Avoid_: Output, polished prompt, final prompt

**Executor**:
Who or what will consume and act on the Refined Prompt — a human, a general LLM, or an AI coding agent.
_Avoid_: Consumer, target model

**Prompt Category**:
The classified intent of a source prompt (e.g. coding task, general LLM use), which determines which Category Writing Skill to apply.
_Avoid_: Prompt type, domain, bucket

**Category Confirmation**:
The mandatory step before any clarification or writing, where the agent announces its chosen Prompt Category, names Adjacent Categories, and asks the user to confirm or correct.
_Avoid_: Classification check, category verification

**Category Disambiguation**:
A single turn when classification is Unknown, asking one category-disambiguating question to resolve the Prompt Category before Category Confirmation and clarification begin.
_Avoid_: Unknown flow, disambiguation step

**Category Switch**:
When the user changes the Prompt Category mid-conversation. Prior clarification answers carry over where still relevant; only category-specific gaps are re-asked.
_Avoid_: Reclassification, category change

**Adjacent Category**:
A Prompt Category that could plausibly apply to the same source prompt, especially when close to the chosen category (e.g. Coding and Agent Prompt).
_Avoid_: Alternative category, runner-up

**Clarify-first**:
The interaction model where the agent asks clarifying questions before producing a refined prompt, rather than inferring assumptions silently.
_Avoid_: Interview mode, Q&A phase

**Clarification complete**:
The point at which the agent stops asking questions and produces a refined prompt — when it has enough confidence, or when the user explicitly requests it.
_Avoid_: Done clarifying, ready to write

**Clarification turn**:
A single clarifying question asked during the clarify-first phase, followed by the user's answer before the next question.
_Avoid_: Question round, clarification step

**Forced Proceed**:
When the user requests a Refined Prompt before Category Confirmation or clarification is complete. Unresolved uncertainty must be encoded inside the prompt as verification or guardrail instructions, not as external commentary.
_Avoid_: Skip questions, proceed anyway

**Revision**:
A user-requested change to an already-delivered refined prompt within the same conversation, without restarting from the source prompt.
_Avoid_: Edit, tweak, iteration

**Conversation**:
A single multi-turn thread from source prompt through clarification, refined prompt delivery, and any revisions. Context is retained within the conversation but not across conversations.
_Avoid_: Session, chat, thread

**Core Writing Skill**:
The shared prompt-writing rules applied to every Refined Prompt, regardless of category. Always loaded before a Category Writing Skill.
_Avoid_: Base skill, prompt-writing-core

**Category Writing Skill**:
The per-category guidance that defines clarification priorities and the exact output sections for a Refined Prompt.
_Avoid_: Category skill, prompt template

**Prompt Writer Agent**:
The single agent that classifies source prompts, confirms category, clarifies, and produces refined prompts.
_Avoid_: Prompt refiner, prompt engineer

## Prompt Categories

**Coding**:
Software work the user will do or direct — bugs, features, refactors, tests, infrastructure. The Executor is typically a human or general LLM, not an AI coding agent.
_Avoid_: Engineering, dev task

**General Task**:
Non-code LLM work — research, writing, analysis, summarization, planning. The Executor is a general LLM or human.
_Avoid_: Creative, content, misc

**Agent Prompt**:
A prompt written for an AI coding agent to consume and execute — scoped for tool use, file access, constraints an agent can act on. The Executor is an AI coding agent.
_Avoid_: System prompt, Mastra prompt, agent-building

**Unknown**:
A temporary disambiguation state when no Prompt Category can be chosen confidently. Triggers Category Disambiguation, then resolves to a real category. Not a final output category.
_Avoid_: Other, fallback, misc