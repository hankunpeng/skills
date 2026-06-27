#!/bin/bash
# commit-lint.sh - Lint a commit message against Conventional Commits spec.

# Get message to lint
if [ -n "$1" ]; then
  if [ -f "$1" ]; then
    MSG=$(cat "$1")
  else
    MSG="$1"
  fi
else
  # Read from stdin
  MSG=$(cat)
fi

# Trim whitespace
MSG=$(echo "$MSG" | xargs)

if [ -z "$MSG" ]; then
  echo "Error: Empty commit message."
  exit 1
fi

# Regex pattern for conventional commit message header
# Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
PATTERN="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9_-]+\))?!?: .+$"

# Get first line of message
FIRST_LINE=$(echo "$MSG" | head -n 1)

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
