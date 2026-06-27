#!/bin/bash
# generate-changelog.sh - Simple changelog generator based on conventional commits.

RANGE="${1:-HEAD}"

if ! git rev-parse "$RANGE" >/dev/null 2>&1; then
  echo "Error: Invalid git reference range '$RANGE'."
  exit 1
fi

echo "# Changelog"
echo ""

# Extract features
FEATS=$(git log "$RANGE" --oneline | grep -E "^[a-f0-9]+ feat(\([a-z0-9_-]+\))?!?:")
if [ -n "$FEATS" ]; then
  echo "## Features"
  echo ""
  echo "$FEATS" | sed -E 's/^([a-f0-9]+) feat(\(([^)]+)\))?!?: (.*)/- **\3**: \4 (\1)/' | sed 's/\*\*\*\*/General/'
  echo ""
fi

# Extract fixes
FIXES=$(git log "$RANGE" --oneline | grep -E "^[a-f0-9]+ fix(\([a-z0-9_-]+\))?!?:")
if [ -n "$FIXES" ]; then
  echo "## Bug Fixes"
  echo ""
  echo "$FIXES" | sed -E 's/^([a-f0-9]+) fix(\(([^)]+)\))?!?: (.*)/- **\3**: \4 (\1)/' | sed 's/\*\*\*\*/General/'
  echo ""
fi

# Extract breaking changes
BREAKING=$(git log "$RANGE" --oneline | grep -E "^[a-f0-9]+ [a-z]+(\([a-z0-9_-]+\))?!:")
if [ -n "$BREAKING" ]; then
  echo "## Breaking Changes ⚠"
  echo ""
  echo "$BREAKING" | sed -E 's/^([a-f0-9]+) [a-z]+(\(([^)]+)\))?!: (.*)/- **\3**: \4 (\1)/' | sed 's/\*\*\*\*/General/'
  echo ""
fi
