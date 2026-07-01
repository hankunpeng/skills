---
name: conventional-commits
description: Enforce, validate, lint, and manage Conventional Commits across git repositories. Generates semantic changelogs and installs git hooks. Use this skill whenever the user mentions commit messages, commit conventions, conventional commits, semantic versioning, changelogs, commit linting, git hooks for commits, or wants to standardize their commit format — even if they don't explicitly say "conventional commits".
---

# Conventional Commits Skill

This skill enforces, validates, and manages Conventional Commits inside repositories.

## When to Use This Skill

- **Writing commit messages**: Format the user's changes as a proper Conventional Commit message.
- **Linting commits**: Run `scripts/commit-lint.sh` to validate a commit message.
- **Generating changelogs**: Run `scripts/generate-changelog.sh` to produce a grouped changelog from git history.
- **Installing hooks**: Run `scripts/install-git-hook.sh` to set up automatic commit message linting in a repository.

## Core Message Format

```text
<type>[optional scope][optional !]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature for the user.
- `fix`: A bug fix for the user.
- `docs`: Documentation changes.
- `style`: Formatting changes that do not affect code meaning.
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `perf`: Code changes that improve performance.
- `test`: Adding or correcting tests.
- `build`: Changes affecting build systems or external dependencies.
- `ci`: Changes to CI configuration scripts.
- `chore`: General maintenance.
- `revert`: Reverts a previous commit.

### Scope

The optional scope provides additional context, enclosed in parentheses after the type. Scopes should be lowercase and may contain letters, numbers, hyphens, and underscores (e.g., `feat(auth)`, `fix(api-client)`).

### Breaking Changes

A breaking change is indicated by appending `!` after the type/scope and before the colon:

```text
feat(api)!: remove deprecated endpoints
```

Alternatively, include a `BREAKING CHANGE:` footer in the message body.

### Footers

Footers follow the format `<token>: <value>` or `<token> #<value>`, one per line:

```text
feat(auth): add OAuth2 support

Implements the full OAuth2 authorization code flow.

BREAKING CHANGE: removed legacy session-based auth
Refs #1234
Reviewed-by: Alice
```

## Examples

**Example 1 — Simple feature:**
```
feat(auth): add email verification
```

**Example 2 — Bug fix with scope:**
```
fix(parser): handle empty input without crash
```

**Example 3 — Breaking change with body and footer:**
```
refactor(api)!: rename user endpoints

All /v1/user/* endpoints have been moved to /v2/users/*.

BREAKING CHANGE: /v1/user/* endpoints no longer exist
Refs #567
```

**Example 4 — Invalid (missing type):**
```
added new login page
```

## Scripts Included

- `scripts/commit-lint.sh`: Checks if a commit message conforms to the Conventional Commits regex.
- `scripts/install-git-hook.sh`: Installs a `commit-msg` git hook into a target repository to automatically run the lint script on commit.
- `scripts/generate-changelog.sh`: Parses git history and generates grouped Changelogs.

## Usage

### Linting a commit message
To lint a message, pass the message text or a file containing the message:
```bash
<skill_dir>/scripts/commit-lint.sh "feat(auth): add email verification"
```

### Installing the git hook in a repository
```bash
<skill_dir>/scripts/install-git-hook.sh /path/to/repository
```

### Generating a Changelog
```bash
<skill_dir>/scripts/generate-changelog.sh HEAD~5..HEAD
```
