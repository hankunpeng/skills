#!/usr/bin/env bash
# generate-changelog.sh - Changelog generator based on conventional commits.
#
# Usage:
#   generate-changelog.sh [range] [version]
#
# Examples:
#   generate-changelog.sh HEAD~5..HEAD
#   generate-changelog.sh v1.0.0..v1.1.0 v1.1.0
#   generate-changelog.sh HEAD              # all commits up to HEAD
set -euo pipefail

RANGE="${1:-HEAD}"
VERSION="${2:-}"

# Validate the git range
if ! git log --oneline "$RANGE" > /dev/null 2>&1; then
  echo "Error: Invalid git reference range '$RANGE'."
  exit 1
fi

# Fetch all commit lines once
ALL_COMMITS=$(git log "$RANGE" --oneline)

# Determine the date range for the changelog header
LATEST_DATE=$(git log "$RANGE" --date=short --format=%cd -1)

# Print header with optional version and date
echo "# Changelog"
echo ""
if [ -n "$VERSION" ]; then
  echo "## $VERSION ($LATEST_DATE)"
else
  echo "## $LATEST_DATE"
fi
echo ""

# Helper: extract and format commits for a given type and heading.
# Usage: format_commit <line> <type>
format_commit() {
  local line="$1"
  local type="$2"
  local hash scope desc rest
  hash=$(echo "$line" | awk '{print $1}')
  rest=$(echo "$line" | sed -E "s/^[a-f0-9]+ ${type}//")
  scope=$(echo "$rest" | sed -nE 's/^\(([^)]+)\).*/\1/p')
  desc=$(echo "$rest" | sed -E 's/^(\([^)]+\))?!?: //')
  if [ -n "$scope" ]; then
    echo "- **${scope}**: ${desc} (${hash})"
  else
    echo "- ${desc} (${hash})"
  fi
}

# Helper: print a section for a given commit type.
# Usage: print_section <type> <heading>
print_section() {
  local type="$1"
  local heading="$2"
  local commits
  commits=$(echo "$ALL_COMMITS" | grep -E "^[a-f0-9]+ ${type}(\([a-zA-Z0-9._/-]+\))?!?: " || true)
  if [ -n "$commits" ]; then
    echo "### $heading"
    echo ""
    echo "$commits" | while IFS= read -r line; do
      format_commit "$line" "$type"
    done
    echo ""
  fi
}

# Features & Fixes
print_section "feat"     "Features"
print_section "fix"      "Bug Fixes"

# Other types
print_section "docs"     "Documentation"
print_section "style"    "Styles"
print_section "refactor" "Code Refactoring"
print_section "perf"     "Performance Improvements"
print_section "test"     "Tests"
print_section "build"    "Build System"
print_section "ci"       "Continuous Integration"
print_section "chore"    "Chores"
print_section "revert"   "Reverts"

# Breaking changes (any type with !)
BREAKING=$(echo "$ALL_COMMITS" | grep -E "^[a-f0-9]+ [a-z]+(\([a-zA-Z0-9._/-]+\))?!: " || true)
if [ -n "$BREAKING" ]; then
  echo "### ⚠ Breaking Changes"
  echo ""
  echo "$BREAKING" | while IFS= read -r line; do
    hash=$(echo "$line" | awk '{print $1}')
    desc=$(echo "$line" | sed -E 's/^[a-f0-9]+ [a-z]+(\([^)]+\))?!: //')
    echo "- ${desc} (${hash})"
  done
  echo ""
fi
