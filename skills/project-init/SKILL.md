---
name: project-init
description: Initialize a project directory for AI agent collaboration by idempotently creating .agents/skills/, scaffolding AGENTS.md with a starter heading template, and ensuring .gitignore contains OS and AI ignore rules. Use when the user invokes $project-init or /project-init, or asks to initialize a project's .agents/skills directory, AGENTS.md, and standard .gitignore rules.
---

# Project Initialization

Run [init-project.sh](scripts/init-project.sh) against the user's current working directory (or pass `<target-dir>` explicitly when a different directory is requested):

```bash
bash "<skill-dir>/scripts/init-project.sh"
```

## Idempotent Behavior

1. **`.agents/skills/`**: Creates `.agents/skills/` if missing; leaves an existing directory untouched.
2. **`AGENTS.md`**: Creates `AGENTS.md` with a starter heading skeleton (`# AGENTS.md`, `## Project Overview`, `## Development Commands`, `## Coding Conventions`) only when missing; existing `AGENTS.md` files are never overwritten.
3. **`.gitignore`**: Creates `.gitignore` if missing and ensures these rule groups are present using exact per-line deduplication:
   - `# OS files`: `.DS_Store`
   - `# AI files`: `.agents/`, `.claude/`, `.gemini/`, `.*buddy/`
   - Only missing rules are appended. If a matching `# OS files` or `# AI files` header already exists, missing rules from that group are inserted under that section; otherwise, the header is added only when that group has missing rules.

Report the script's output summary back to the user.
