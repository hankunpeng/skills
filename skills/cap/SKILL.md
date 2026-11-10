---
name: cap
description: Smart Commit And Push (cap). Stages specified or recently modified target files along with their referenced companion assets (such as blog post images in assets/img/posts/<slug>/), validates the commit message against the Conventional Commits specification, commits, and pushes to the remote repository while keeping unrelated untracked/modified files untouched. Trigger whenever the user types "cap", "/cap", "$cap", or "cap @file".
---

# Smart Commit And Push (`cap`)

This skill performs an intelligent, context-aware **Commit And Push** workflow whenever the user invokes `cap`, `/cap`, `$cap`, or `cap @<file...>`.

---

## Agent Instructions & Strict Workflow

### Step 1: Identify Target File(s) & Auto-Discover Companion Assets

1. Inspect the working tree and recent commit history:
   ```bash
   git status -u
   git log -n 5 --oneline
   ```
2. Determine the **primary target file(s)**:
   - **Explicit target**: If the user specified `@<file...>` or file paths (e.g., `cap @_posts/2026-11-09-post.md`), use those exact files as the primary target.
   - **Implicit target**: If the user only typed `cap` (or `/cap`, `$cap`), use the file(s) created or modified during the current conversation task.
3. **Auto-discover referenced companion assets (Crucial)**:
   - Read/scan the primary target file(s) for references to local companion files or directories:
     - YAML Front Matter fields such as `image.path` or `cover` (e.g., `/assets/img/posts/<slug>/cover.jpg`).
     - Markdown image/asset links `![...](/assets/img/posts/<slug>/...)` or relative file references.
     - Companion asset directories matching the target file's slug (e.g., `assets/img/posts/<post-slug>/`).
   - Cross-check discovered paths against `git status -u`. Automatically include any untracked (`??`) or modified (`M`) companion assets that belong to the target file(s).
4. **Strictly isolate unrelated changes**:
   - Do **NOT** stage (`git add -A` or `git add .` is forbidden when unrelated changes exist) any other untracked drafts or modified files in the working tree that do not belong to the target file(s).

---

### Step 2: Draft & Lint Conventional Commit Message

1. Write a concise commit message following the **Conventional Commits** specification:
   ```text
   <type>[optional scope]: <description>
   ```
   - Match the scope and style of `git log -n 5 --oneline` in the repository (for example, `docs(post): add ...` or `docs(post): shorten ...` for blog posts).
   - State the net change relative to the prior committed state, not the intermediate process.
2. Validate the commit message using the bundled linter script before committing:
   ```bash
   bash "<skill_dir>/scripts/commit-lint.sh" "<commit-message>"
   ```

---

### Step 3: Stage, Commit, and Push

1. Stage only the primary target file(s) and their discovered companion assets, commit, and push to the remote branch:
   ```bash
   git add <primary-target-files> <companion-assets>
   git commit -m "<commit-message>"
   git push
   ```
2. Report concisely to the user:
   - The commit hash and Conventional Commit message.
   - The exact list of files/directories included in the commit.
