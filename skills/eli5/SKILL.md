---
name: eli5
description: Explain a complex topic like I'm a 5 year old using a clean, interactive single-file HTML artifact with a playable micro-demo and a 1-question check. Supports an optional leading ISO 639-1 language flag such as -zh or -en. Use when the user invokes $eli5 or /eli5, or asks for a dead-simple interactive explainer of how something works.
---

# Explain Like I'm 5

Use `$eli5` in Codex and `/eli5` in agents that expose skills as slash commands. Explain the target topic like the reader knows nothing about it, delivering a self-contained, clean, interactive single-file HTML artifact with **few words, no static images, one playable micro-demo, and a 1-question check**.

Do **not** run a pre-interview — generate the HTML explainer directly.

1. **Parse optional language flag**: Check whether the first token immediately after `$eli5` or `/eli5` is `-<code>`, where `<code>` is a lowercase two-letter ISO 639-1 language code (for example, `-zh`, `-en`, `-ja`, `-ko`). Default `-zh` to Simplified Chinese (`zh-CN`) and `-en` to American English (`en-US`). If present, strip only that leading flag before inspecting the rest of the message.
2. **Identify the target topic**:
   - When topic text remains after stripping any leading language flag (for example, `$eli5 Raft consensus`, `$eli5 注意力机制`, or `$eli5 -zh KV Cache`), explain that topic together with any referenced conversation or workspace context.
   - When no topic text remains (`$eli5`, `/eli5`, `$eli5 -zh`, or `/eli5 -en`), treat it as a bare invocation and explain the core concept, mechanism, or design discussed most recently in the conversation. If there is no clear topic yet, ask what topic the user wants explained.

## 1. Language & Prose Rules

- **Output Language Precedence**: Choose the output language by precedence: explicit `-<ISO 639-1>` flag > explicit language request in the message > the language of the user's prompt or active conversation. (If a fresh prompt consists solely of an ASCII technical term or acronym such as `RAG` or `KV Cache` with no surrounding non-English text and no prior conversation context, default to English unless a flag like `-zh` is passed.)
- **Complete Localization**: Write **all** visible text and `<html lang="...">` in natural, idiomatic prose of the target language — including `<h1>` and section headings, card copy, micro-demo buttons/sliders/status readouts, inline SVG labels, and quiz options/feedback. Never leave English UI labels (`Next Step`, `Reset`, `✓ Correct`) inside a non-English artifact. When writing in a non-English language (such as Simplified Chinese), you may retain core English technical terms in parentheses on first mention, e.g., `检索增强生成（RAG）`. Keep code identifiers, file paths, CLI commands, and mathematical symbols in their exact original form.
- **Zero Jargon & Concrete Words**: Use everyday objects and experiences a beginner or 5-year-old can grasp immediately. Always explain the concrete phenomenon and what it does *before* introducing a technical name.
- **De-slop & No Translationese**: Keep sentences short, direct, and idiomatic. Ban rhetorical filler and translationese — such as `"At its core"`, `"Put simply"`, `"It's not just X — it's Y"` in English, or `"从本质上讲"`, `"简而言之"`, `"它不仅仅是 X，更是 Y"` in Chinese — as well as stacked sub-headers and unnecessary preamble.

## 2. Architecture for Learning

Structure the page in four crisp beats:

1. **Experience → Turn → Name**: Open with a concrete everyday experience the reader already knows, deliver the surprising turn, and *then* name the concept in the `<h1>` / hero.
2. **One Unifying Mental Model**: Introduce **one** intuitive analogy early and reuse it as the throughline across the whole page and micro-demo. Never mix multiple competing metaphors.
3. **3–5 Numbered Step Cards**: Break "how it works" into 3–5 bite-sized cards (`01`, `02`, `03`...) ordered by concept dependency. Limit each card to 2–3 short sentences.
4. **One-Sentence Takeaway**: End the explanation with a single memorable sentence that restates the mental model.

## 3. Show, Don't Tell: Interactivity

Instead of static pictures, teach through manipulation:

- **Centerpiece Playable Micro-Demo**: Build **1 mechanism-true interactive widget** using vanilla JS + HTML/CSS/SVG where the reader manipulates an input and watches the result update live:
  - A continuous slider (`input` event, not `change`) driving a real formula or visual state
  - A step-by-step interactive state simulator (e.g., localized `"Next Step"` / `"下一步"`)
  - A before ↔ after / cause ↔ effect live toggle or predict-then-reveal interaction
  - Keep controls simple, prefilled with sensible defaults, and clearly labeled in the target language.
- **1-Question Micro-Quiz**: Place **1 multiple-choice question** at the bottom to verify understanding:
  - Instant feedback stated explicitly in localized words (e.g., `✓ Correct` or `✗ Not quite` in English; `✓ 答对了` or `✗ 差一点` in Chinese) — never rely on red/green color alone.
  - Show a one-line *why* explanation after selection and allow retry.

## 4. Visual Design & Anti-Slop Bar

- **No Static Images**: Do not generate, embed, or link external raster images (`<img>`). Use typography, CSS layouts, and clean inline SVG/Canvas only when needed for the micro-demo.
- **No Emoji as UI/Icons**: Never use emoji (🚀✨💡🔍📊) as section icons, bullets, or button decorations. Use bold numerals (`01`, `02`), CSS geometric shapes, or minimal monochrome SVG icons.
- **Semantic Color & Centralized Tokens**: Define CSS variables at `:root`. Use a clean paper background, high-contrast ink (`≥ 4.5:1` WCAG contrast on every surface), and **1–2 semantic accent colors** that encode meaning (e.g., color A = input/cause, color B = output/effect). No rainbow gradients or heavy drop-shadow clutter.
- **Button Hierarchy**: Primary interactive actions (localized equivalents of "Run", "Next Step", "Check") use solid filled buttons; secondary actions (localized "Reset") use ghost/outline buttons.

## 5. Pre-Flight Quality Check

Before delivering the HTML artifact, verify:
- [ ] All prose, headings, micro-demo controls, SVG labels, quiz items, and `<html lang="...">` are in natural, idiomatic target-language prose with zero unexplained jargon or translationese.
- [ ] Zero `<img>` tags and zero decorative UI emojis.
- [ ] The playable micro-demo initializes its first frame on load (`DOMContentLoaded`) and updates live without JS console errors or unescaped quotes.
- [ ] Any inline `<svg>` includes at least `16px` padding in its `viewBox` so localized text labels never clip at the edges.
- [ ] No content is hidden at `opacity: 0` waiting on `IntersectionObserver`; everything renders visibly by default on both desktop and mobile.
