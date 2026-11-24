---
name: yw
description: Restate the user's goal and the problem to solve in your own words, then wait for confirmation before acting. Use only when the user explicitly invokes $yw or /yw.
disable-model-invocation: true
---

# In Your Own Words

Use `$yw` in Codex and `/yw` in agents that expose skills as slash commands. Play back your understanding of the task before starting work:

- When text follows `$yw` or `/yw` (for example, `$yw 重构登录态刷新逻辑`), restate the goal and problem from that message together with relevant conversation context.
- When invoked bare (`$yw` or `/yw`), restate the active or pending task from earlier in the conversation. If there is no clear task yet, ask what the user wants to work on.

If the request references files, symbols, or workspace state, inspect them read-only first so your restatement reflects the actual codebase rather than guesswork.

Write in the language of the user's conversation (Chinese for Chinese, English for English). Do not parrot the prompt or swap synonyms mechanically; synthesize in plain, direct words:

- **Problem**: What underlying problem or friction the user is trying to solve.
- **Goal**: What concrete outcome is expected and what "done" looks like.
- **Boundaries & Open Questions**: Important constraints, non-goals, assumptions, or ambiguities that could change the implementation (omit if none).

Stop after the restatement and wait for confirmation. Do not create or edit files, run mutating commands, or begin implementation in this turn.
