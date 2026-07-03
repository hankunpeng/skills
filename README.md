# My skills ٩(^ᴗ^)۶

English | [简体中文](README_zh.md)

A collection of custom AI agent skills for improving daily work efficiency.

## Available Skills

This repository contains the following skills:

### 1. YouTube Video Summarizer (`yt-summarize`)
* **Description**: Downloads YouTube subtitles and summarizes the video content using Gemini models while filtering out sponsor promotions.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill yt-summarize
  ```

### 2. Twitter Posting (`twitter`)
* **Description**: Posts content (text and up to 4 images) to X (Twitter) using Chrome Computer Use Mode.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill twitter
  ```

### 3. Conventional Commits (`conventional-commits`)
* **Description**: Enforce, validate, lint, and manage Conventional Commits across git repositories. Generates semantic changelogs and installs git hooks.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill conventional-commits
  ```

### 4. Antigravity CLI Statusline (`antigravity-cli-statusline`)
* **Description**: Customizes the Antigravity CLI status bar to show folder icons, home-abbreviated current working directory, model name, and 5H/7D token quota usage with live refresh countdown.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill antigravity-cli-statusline
  ```

### 5. Gemini Web Client (`gemini-cli`)
* **Description**: Generates images and text via reverse-engineered Gemini Web API. Suitable for AI Pro and higher tier subscription users. Supports text generation, image generation from prompts, reference images for vision input, and multi-turn conversations.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill gemini-cli
  ```

### 6. Chinese Copywriting Linter (`chinese-copywriting-linter`)
* **Description**: Lint and automatically format Chinese copywriting and typesetting in Markdown documents according to the Chinese Copywriting Guidelines.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill chinese-copywriting-linter
  ```

### 7. LlamaParse Document Parsing (`llama-parse`)
* **Description**: Parses complex PDFs, Word documents (docx), PowerPoint presentations (pptx), Excel sheets (xlsx), and images into clean Markdown or structured JSON using the LlamaParse API. Preserves layouts and extracts tables accurately.
* **Installation**:
  ```bash
  npx skills add hankunpeng/skills --skill llama-parse
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
