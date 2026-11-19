---
name: gfm
description: Use GitHub Flavored Markdown (GFM) when the user invokes $gfm or /gfm, or requests GFM output. Applies to writing, revising, converting, and saving content, including earlier conversation material.
---

# GitHub Flavored Markdown

Use `$gfm` in Codex CLI and `/gfm` in agents that expose skills as slash commands. Both forms set the format for the Markdown output. Follow the action the user requests and use the content they refer to, including earlier material in the conversation.

For example, `$gfm 保存之前的内容` and `/gfm 保存之前的内容` both save the relevant earlier content as a GFM `.md` file. Preserve its wording when the user asks to save it as-is. When they ask to organize, summarize, or revise the content, follow the requested level of editing.

Follow the user's requested language, structure, and destination. When saving, use the repository's instructions for the default location, filename, and front matter.

Use headings, lists, links, images, and fenced code blocks as appropriate for the document. Apply GFM extensions where they help the reader.

- Use pipe tables for tabular information. Match the header and delimiter column counts. Escape literal pipes in cells as `\|`, including inside inline code.
- Use `- [ ]` and `- [x]` for tasks, and `~~text~~` for deliberate strikethrough.
- Use ordinary Markdown links and image syntax. Check relative paths against the document's saved location when those files are available.
- Use the public GFM specification as the default. Treat GitHub alerts, footnotes, math, and Mermaid as publishing-target features. Include them when requested or when the target renderer is known to support them and they serve the document.

For ambiguous syntax, consult the official rules. [GFM specification](https://github.github.com/gfm/)
