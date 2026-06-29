# hkp-skills

A collection of custom AI agent skills for Google Antigravity and the open agent skills ecosystem.

## Available Skills

This repository contains the following skills:

### 1. Chinese Copywriting Linter (`chinese-copywriting-linter`)
* **Description**: Lint and automatically format Chinese copywriting and typesetting in Markdown documents according to the Chinese Copywriting Guidelines.
* **Installation**:
  ```bash
  npx skills add hankunpeng/hkp-skills --skill chinese-copywriting-linter
  ```

### 2. Conventional Commits (`conventional-commits`)
* **Description**: Enforce, validate, lint, and manage Conventional Commits across git repositories. Generates semantic changelogs and installs git hooks.
* **Installation**:
  ```bash
  npx skills add hankunpeng/hkp-skills --skill conventional-commits
  ```

### 3. Antigravity CLI Statusline (`antigravity-cli-statusline`)
* **Description**: Customizes the Antigravity CLI status bar to show folder icons, home-abbreviated current working directory, model name, and 5H/7D token quota usage with live refresh countdown.
* **Installation**:
  ```bash
  npx skills add hankunpeng/hkp-skills --skill antigravity-cli-statusline
  ```

### 4. Claude Code Statusline (`claude-code-statusline`)
* **Description**: Installs a toggleable custom Claude Code status line showing the current working directory, context window usage percentage, and model name.
* **Installation**:
  ```bash
  npx skills add hankunpeng/hkp-skills --skill claude-code-statusline
  ```

---


## Installation

To list all available skills in this repository:

```bash
npx skills add hankunpeng/hkp-skills -l
```

You can install all skills in this repository:


```bash
npx skills add hankunpeng/hkp-skills
```

Or install all skills globally:

```bash
npx skills add hankunpeng/hkp-skills -g --all
```


Or install a specific skill by specifying its name:

```bash
npx skills add hankunpeng/hkp-skills --skill <skill-name>
```

Or install multiple specific skills:

```bash
npx skills add hankunpeng/hkp-skills --skill <skill-name-1> --skill <skill-name-2>
```


## License

This repository is licensed under the [MIT License](LICENSE).
