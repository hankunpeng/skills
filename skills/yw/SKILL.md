---
name: yw
description: Restate the user's goal and the problem to solve in your own words, then wait for confirmation before acting. Supports an optional leading ISO 639-1 language flag such as -zh or -en. Use only when the user explicitly invokes $yw or /yw.
disable-model-invocation: true
---

# In Your Own Words

Use `$yw` in Codex and `/yw` in agents that expose skills as slash commands. Play back your understanding of the task before starting work.

1. **Parse optional language flag**: Check whether the first token immediately after `$yw` or `/yw` is `-<code>`, where `<code>` is a lowercase two-letter ISO 639-1 language code (for example, `-zh`, `-en`, `-ja`, `-ko`). Default `-zh` to Simplified Chinese (`zh-CN`) and `-en` to American English (`en-US`). If present, strip only that leading flag before inspecting the rest of the message.
2. **Identify the target task**:
   - When task text remains after stripping any leading language flag (for example, `$yw 重构登录态刷新逻辑` or `$yw -zh <English issue>`), restate the goal and problem from that text together with relevant conversation context.
   - When no task text remains (`$yw`, `/yw`, `$yw -zh`, or `/yw -en`), treat it as a bare invocation and restate the active or pending task from earlier in the conversation. If there is no clear task yet, ask what the user wants to work on.

If the request references files, symbols, or workspace state, inspect them read-only first so your restatement reflects the actual codebase rather than guesswork.

Choose the output language by precedence: explicit `-<ISO 639-1>` flag > explicit language request in the message > the language of the user's prompt or active conversation. Localize section labels to match the output language, while keeping code identifiers, file paths, and CLI commands in their exact original form.

Do not parrot the prompt or swap synonyms mechanically; synthesize in plain, direct words:

- **Problem**: What underlying problem or friction the user is trying to solve.
- **Goal**: What concrete outcome is expected and what "done" looks like.
- **Boundaries & Open Questions**: Important constraints, non-goals, assumptions, or ambiguities that could change the implementation (omit if none).

Stop after the restatement and wait for confirmation. Do not create or edit files, run mutating commands, or begin implementation in this turn.
