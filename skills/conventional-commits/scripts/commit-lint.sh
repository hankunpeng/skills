#!/usr/bin/env bash
# commit-lint.sh - Lint a commit message against Conventional Commits spec.
set -euo pipefail

# Get message to lint
if [ -n "${1:-}" ]; then
  if [ -f "$1" ]; then
    MSG=$(cat "$1")
  else
    MSG="$1"
  fi
else
  # Read from stdin
  MSG=$(cat)
fi

# Extract first line and trim leading/trailing whitespace
FIRST_LINE=$(echo "$MSG" | head -n 1 | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

if [ -z "$FIRST_LINE" ]; then
  echo "Error: Empty commit message."
  exit 1
fi

# Regex pattern for conventional commit message header
# Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9._/-]+\))?!?: .+$"

if [[ "$FIRST_LINE" =~ $PATTERN ]]; then
  echo "✔ Commit message style is valid!"
  exit 0
else
  echo "✗ Invalid commit message format."
  echo "Expected: <type>[optional scope]: <description>"
  echo "Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert"
  echo "Example: feat(auth): add google sign-in"
  exit 1
fi
