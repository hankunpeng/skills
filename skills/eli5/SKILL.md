---
name: eli5
description: Explain a topic like I'm a 5 year old in plain, natural English using a clean, interactive single-file HTML artifact with a playable micro-demo and a 1-question check. Use when the user types /eli5 <topic> or asks for a dead-simple English explainer of how something works.
---

# eli5

Explain the user's requested topic like they know nothing about it, delivering a self-contained, clean, interactive HTML artifact written **entirely in plain English**, with **few words, no static images, one playable micro-demo, and a 1-question check**.

Do **not** run a pre-interview — generate the HTML explainer directly.

## 1. Language & Prose Rules

- **English Only**: Write all headings, explanations, micro-demo controls, labels, and quiz items in natural, punchy English — even if the user passes a non-English topic name. (For a Chinese explainer, use `eli5c` instead.)
- **Zero Jargon & Concrete Words**: Use everyday words a beginner or 5-year-old can grasp immediately. If a technical term must be introduced, explain it with concrete objects first before naming it.
- **De-slop Voice**: Keep sentences short and direct. Ban rhetorical filler ("At its core", "Put simply", "It's not just X — it's Y"), stacked sub-headers, and unnecessary preamble.

## 2. Architecture for Learning

Structure the page in four crisp beats:

1. **Experience → Turn → Name**: Open with a concrete everyday experience the reader already knows, deliver the surprising turn, and *then* name the concept in the `<h1>` / hero.
2. **One Unifying Mental Model**: Introduce **one** intuitive analogy early and reuse it as the throughline across the whole page. Never mix multiple competing metaphors.
3. **3–5 Numbered Step Cards**: Break "how it works" into 3–5 bite-sized cards (`01`, `02`, `03`...) ordered by concept dependency. Limit each card to 2–3 short sentences.
4. **One-Sentence Takeaway**: End the explanation with a single memorable sentence that restates the mental model.

## 3. Show, Don't Tell: Interactivity

Instead of static pictures, teach through manipulation:

- **Centerpiece Playable Micro-Demo**: Build **1 mechanism-true interactive widget** using vanilla JS + HTML/CSS/SVG where the reader manipulates an input and watches the result update live:
  - A continuous slider (`input` event, not `change`) driving a real formula or visual state
  - A step-by-step interactive state simulator ("Next Step")
  - A before ↔ after / cause ↔ effect live toggle or predict-then-reveal interaction
  - Keep controls simple, prefilled with sensible defaults, and clearly labeled.
- **1-Question Micro-Quiz**: Place **1 multiple-choice question** at the bottom to verify understanding:
  - Instant feedback stated explicitly in words (`✓ Correct` or `✗ Not quite`) — never rely on red/green color alone.
  - Show a one-line *why* explanation after selection and allow retry.

## 4. Visual Design & Anti-Slop Bar

- **No Static Images**: Do not generate, embed, or link external raster images (`<img>`). Use typography, CSS layouts, and clean inline SVG/Canvas only when needed for the micro-demo.
- **No Emoji as UI/Icons**: Never use emoji (🚀✨💡🔍📊) as section icons, bullets, or button decorations. Use bold numerals (`01`, `02`), CSS geometric shapes, or minimal monochrome SVG icons.
- **Semantic Color & Centralized Tokens**: Define CSS variables at `:root`. Use a clean paper background, high-contrast ink (`≥ 4.5:1` WCAG contrast on every surface), and **1–2 semantic accent colors** that encode meaning (e.g., color A = input/cause, color B = output/effect). No rainbow gradients or heavy drop-shadow clutter.
- **Button Hierarchy**: Primary interactive actions ("Run", "Next Step", "Check") use solid filled buttons; secondary actions ("Reset") use ghost/outline buttons.

## 5. Pre-Flight Quality Check

Before delivering the HTML artifact, verify:
- [ ] All prose, labels, and quiz items are in crisp, natural English with zero unexplained jargon.
- [ ] Zero `<img>` tags and zero decorative UI emojis.
- [ ] The playable micro-demo initializes its first frame on load (`DOMContentLoaded`) and updates live without JS console errors or unescaped quotes.
- [ ] Any inline `<svg>` includes at least `16px` padding in its `viewBox` so text labels never clip at the edges.
- [ ] No content is hidden at `opacity: 0` waiting on `IntersectionObserver`; everything renders visibly by default on both desktop and mobile.
