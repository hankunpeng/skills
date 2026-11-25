#!/usr/bin/env bash
# commit-lint.sh - Lint a commit message against Conventional Commits spec.
set -euo pipefail

# Get message to lint
if [ "$#" -gt 0 ]; then
  if [ -f "$1" ]; then
    MSG=$(cat < "$1")
  else
    MSG="$1"
  fi
else
  # Read from stdin
  MSG=$(cat)
fi

# Extract first line and trim leading/trailing whitespace
FIRST_LINE=$(printf '%s\n' "${MSG%%$'\n'*}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

if [ -z "$FIRST_LINE" ]; then
  echo "Error: Empty commit message."
  exit 1
fi

# Keep the default type list in one place for validation and diagnostics.
TYPES='init|feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert'
PATTERN="^($TYPES)(\([a-zA-Z0-9._/-]+\))?!?: .+$"

if [[ "$FIRST_LINE" =~ $PATTERN ]]; then
  echo "✔ Commit message style is valid!"
  exit 0
else
  echo "✗ Invalid commit message format."
  echo "Expected: <type>[optional scope][optional !]: <description>"
  echo "Types: ${TYPES//|/, }"
  echo "Example: feat(auth): add google sign-in"
  exit 1
fi
