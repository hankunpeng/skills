---
name: ofm
description: Use Obsidian Flavored Markdown (OFM) when the user invokes $ofm or /ofm, or requests OFM output. Follow the requested action when writing, revising, converting, or saving content, including earlier conversation material.
---

# Obsidian Flavored Markdown

Use `$ofm` in Codex and `/ofm` in agents that expose skills as slash commands. The invocation selects the output format. The natural language that follows determines the action, source content, and destination. If there is no new instruction, use any clear pending request in the conversation or ask what to do.

For example, `$ofm 总结上面的讨论` returns the summary in chat, while `$ofm 把上面的讨论原样保存为 meeting-notes.md` saves the referenced content and preserves its wording. When saving, follow the requested path or the workspace defaults. When editing an existing note, preserve its path and existing properties unless the request calls for changes to them.

Use standard Markdown for ordinary formatting and native Obsidian features where they serve the content:

- Use `[[Note]]`, `[[Note|Label]]`, or `[[Note#Heading]]` for vault links when they fit the note's conventions. Use `![[Note#Heading]]` or `![[image.png]]` to embed known vault content. Verify targets when the vault is available, and use standard Markdown links for external URLs.
- Use `> [!note] Title` for a callout, with each body line prefixed by `>`. Use `==text==` for highlighting and `%%text%%` for a comment intended to be hidden in Reading view.
- Put requested note properties in YAML front matter at the start of the file between `---` delimiters. Use lists for `tags` and `aliases`, and quote wikilink values, for example `"[[Project]]"`.
- In Markdown tables, escape pipes inside cells, including in wikilink aliases such as `[[Note\|Label]]`.

Use plugin-specific syntax when the user requests it or the target vault is known to support it. For syntax details, see [Obsidian Flavored Markdown](https://obsidian.md/help/obsidian-flavored-markdown), [Properties](https://obsidian.md/help/properties), and [Advanced formatting syntax](https://obsidian.md/help/advanced-syntax).
