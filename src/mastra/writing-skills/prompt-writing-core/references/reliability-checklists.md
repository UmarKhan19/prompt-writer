# Reliability Checklists

## Prompt Failure Modes To Check

Before finalizing a prompt, check for these failure modes:

1. Ambiguous task
2. Missing context
3. Overloaded prompt
4. Conflicting instructions
5. Format drift
6. Hallucinated facts
7. Prompt injection
8. Recency failure
9. Hidden assumptions
10. Overconfidence
11. Bad retrieval context
12. Missing evals

If a prompt has one of these issues, fix the prompt or ask a clarification question before writing.

## Anti-Patterns

Avoid vague instructions:

```txt
Be accurate.
Make it professional.
Use common sense.
Give clean output.
Do not hallucinate.
Analyze everything.
```

Replace them with concrete constraints:

```txt
Use only the provided source text.
Limit the summary to 80 words.
Return valid JSON only.
Use `null` for missing values.
Choose exactly one category from the enum.
If no evidence supports a claim, return `insufficient_evidence`.
```

Avoid motivational role fluff:

```txt
You are the world's greatest genius legendary expert.
```

Prefer specific roles:

```txt
You are a strict JSON extraction engine.
```

## Chain-Of-Thought Guidance

Do not ask the model to reveal long private chain-of-thought in production prompts.

Prefer:

```txt
Reason internally. Return only the final answer, key evidence, assumptions, and confidence.
```

Use structured reasoning artifacts instead of hidden reasoning traces:

```json
{
  "decision": "string",
  "supporting_signals": ["string"],
  "assumptions": ["string"],
  "risks": ["string"],
  "requires_human_review": true
}
```

## Few-Shot Example Guidance

Use examples to teach:

- output format
- tone
- label boundaries
- missing-value behavior
- edge cases
- what not to include

Good examples are consistent, realistic, short enough, representative, and edge-case-heavy.

## Output Schema Design Rules

When creating schemas:

- Use enums whenever possible.
- Use `null` for missing values.
- Avoid mixed types.
- Separate facts from interpretation.
- Include evidence fields when factual correctness matters.
- Avoid vague fields like `answer` unless the task is truly open-ended.
- Use arrays for multiple items.
- Define max lengths when useful.
- Do not allow invented fields unless extension is intentional.

## Final Principle

Reliable AI features usually require:

```txt
Prompt + Context + Schema + Validation + Retrieval + Evals + Fallbacks
```

The prompt matters, but the system matters more.
