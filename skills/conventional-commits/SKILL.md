---
name: conventional-commits
description: Enforce, validate, lint, and manage Conventional Commits across git repositories. Generates semantic changelogs and installs git hooks.
---

# Conventional Commits Skill

This skill enforces, validates, and manages Conventional Commits inside repositories.

## Core Message Format

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types:
- `feat`: A new feature for the user.
- `fix`: A bug fix for the user.
- `docs`: Documentation changes.
- `style`: Formatting changes that do not affect code meaning.
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `perf`: Code changes that improve performance.
- `test`: Adding or correcting tests.
- `build`: Changes affecting build systems or external dependencies.
- `ci`: Changes to CI configuration scripts.
- `chore`: General maintainence.
- `revert`: Reverts a previous commit.

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
