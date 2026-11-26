# My skills ٩(^ᴗ^)۶

English | [简体中文](README_zh.md)

A collection of custom AI agent skills for improving daily work efficiency.

## Available Skills

This repository contains the following skills:

### 1. Conventional Commits (`cc`)
* **Description**: Enforce, validate, lint, and manage Conventional Commits across git repositories. Generates semantic changelogs and installs git hooks.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill cc
  ```

### 2. Conventional Commit and Push (`ccp`)
* **Description**: Context-aware Commit And Push workflow. Automatically stages specified or recently modified target files along with their referenced companion assets (e.g., blog post images in `assets/img/posts/<slug>/`), validates the commit message against Conventional Commits, commits, and pushes to remote while isolating unrelated changes.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill ccp
  ```

### 3. Semantic Version Recommender (`svr`)
* **Description**: Intelligently analyze code changes, API contract diffs, and commit history to recommend the next Semantic Version (SemVer MAJOR, MINOR, or PATCH) with concrete rationales and breaking change detection.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill svr
  ```

### 4. GitHub Flavored Markdown (`gfm`)

Write a document in GitHub Flavored Markdown with `$gfm Write a document about…`.

```bash
npx skills add hankunpeng/skills --skill gfm
```

### 5. Obsidian Flavored Markdown (`ofm`)

Use `$ofm` to select Obsidian Flavored Markdown, then say what to do. For example, `$ofm Summarize the discussion above` replies in chat, and `$ofm Save the discussion above as meeting-notes.md` writes a file.

```bash
npx skills add hankunpeng/skills --skill ofm
```

### 6. Explain Like I'm 5 (`eli5`)
* **Description**: Explain complex topics in plain, intuitive prose using clean single-file HTML artifacts with playable micro-demos and a 1-question check. Pass a topic (`$eli5 Raft consensus`), run bare `$eli5` to explain the discussion so far, or add a leading ISO 639-1 language flag right after `$eli5` / `/eli5` (for example, `$eli5 -zh KV Cache` or `/eli5 -en`; `zh` defaults to Simplified Chinese and `en` to American English) to specify the output language.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill eli5
  ```

### 7. In Your Own Words (`yw`)

Use `$yw` or `/yw` to have the agent restate the problem, goal, and key boundaries in its own words and wait for confirmation before making changes. Pass a new request (`$yw Refactor token refresh…`) or run bare `$yw` to align on the discussion so far; add an ISO 639-1 language flag right after `$yw` / `/yw` (for example, `$yw -zh <issue>` or `/yw -en`; `zh` defaults to Simplified Chinese and `en` to American English) to specify the output language.

```bash
npx skills add hankunpeng/skills --skill yw
```

### 8. YouTube Video Summarizer (`yt-summarize`)
* **Description**: Downloads YouTube subtitles and summarizes the video content using Gemini models while filtering out sponsor promotions.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill yt-summarize
  ```

### 9. Twitter Posting (`twitter`)
* **Description**: Posts content (text and up to 4 images) to X (Twitter) using Chrome Computer Use Mode.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill twitter
  ```

### 10. Antigravity CLI Statusline (`antigravity-cli-statusline`)
* **Description**: Customizes the Antigravity CLI status bar into a unified single-line layout showing shortcuts, folder icons, cwd, active model, context tokens, and 5H/7D token quota usage with live countdown.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill antigravity-cli-statusline
  ```

### 11. Chinese Copywriting Linter (`chinese-copywriting-linter`)
* **Description**: Lint and automatically format Chinese copywriting and typesetting in Markdown documents according to the Chinese Copywriting Guidelines.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill chinese-copywriting-linter
  ```

### 12. LlamaParse Document Parsing (`llama-parse`)
* **Description**: Parses complex PDFs, Word documents (docx), PowerPoint presentations (pptx), Excel sheets (xlsx), and images into clean Markdown or structured JSON using the LlamaParse API. Preserves layouts and extracts tables accurately.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill llama-parse
  ```

### 13. Web Clipper (`clip`)
* **Description**: Fetch any URL and convert it to clean, ad-free Markdown or structured JSON using Chrome CDP with multi-layer ad blocking enabled by default (network-level ad domain blocking, DOM/Shadow-DOM widget purification, and semantic heading normalization) and site-specific adapters (X/Twitter, YouTube transcripts, Hacker News threads, and generic web pages via Defuddle). Supports `-g` (GFM alerts + standard links) and `-o` (OFM single-line callouts + `![[...]]` local embeds), automatically enabling OFM inside `.obsidian/` vaults and defaulting to GFM elsewhere.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill clip
  ```

### 14. Playwright Use System Chrome (`playwright-use-chrome`)
* **Description**: Configure and enforce Playwright to directly use the system's installed Google Chrome browser instead of downloading bulky bundled Chromium/WebKit/Firefox binaries (~1.5GB to 2GB). Provides configuration templates for TypeScript, JavaScript, Python, and CLI test runners.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill playwright-use-chrome
  ```

### 15. Codex Session Cleanup (`csc`)

Run `$csc` to preview the active sessions in the current working directory’s `/resume` list. Use `$csc Delete the other active sessions in this directory and keep this session` to permanently delete the other sessions. Requires Python 3.8 or later and a local Codex CLI with `thread/delete` support.

```bash
npx skills add hankunpeng/skills --skill csc
```

### 16. Project Initialization (`project-init`)
* **Description**: Idempotently initialize a project directory for AI agent collaboration: creates `.agents/skills/`, scaffolds `AGENTS.md` with a starter heading template if missing, and ensures `.gitignore` exists with deduplicated `# OS files` (`.DS_Store`) and `# AI files` (`.agents/`, `.claude/`, `.gemini/`, `.*buddy/`) rules.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill project-init
  ```


---


## Installation

To list all available skills in this repository:

```bash
npx skills add hankunpeng/skills -l
```

You can install all skills in this repository:


```bash
npx skills add hankunpeng/skills
```

Or install all skills globally:

```bash
npx skills add hankunpeng/skills -g --all
```


Or install a specific skill by specifying its name:

```bash
npx skills add hankunpeng/skills --skill <skill-name>
```

Or install multiple specific skills:

```bash
npx skills add hankunpeng/skills --skill <skill-name-1> --skill <skill-name-2>
```


## License

This repository is licensed under the [MIT License](LICENSE).


## Star History

<a href="https://www.star-history.com/?repos=hankunpeng%2Fskills&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=hankunpeng/skills&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=hankunpeng/skills&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=hankunpeng/skills&type=date&legend=top-left" />
 </picture>
</a>
