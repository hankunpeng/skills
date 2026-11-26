#!/usr/bin/env bash
set -euo pipefail

usage() {
    echo "Usage: init-project.sh [target_dir]"
}

if [[ $# -eq 1 && ( "$1" == "-h" || "$1" == "--help" ) ]]; then
    usage
    exit 0
fi

if [[ $# -gt 1 ]]; then
    usage >&2
    exit 1
fi

if [[ $# -eq 0 ]]; then
    TARGET_DIR="."
else
    TARGET_DIR="$1"
fi

if [[ ! -d "$TARGET_DIR" ]]; then
    echo "Error: target directory does not exist: $TARGET_DIR" >&2
    exit 1
fi

RESOLVED_DIR="$(cd "$TARGET_DIR" && pwd)"

# Guard against path-type collisions before mutating the target directory.
if [[ ( -e "$RESOLVED_DIR/.agents" || -L "$RESOLVED_DIR/.agents" ) && ! -d "$RESOLVED_DIR/.agents" ]]; then
    echo "Error: $RESOLVED_DIR/.agents exists and is not a directory" >&2
    exit 1
fi

if [[ ( -e "$RESOLVED_DIR/.agents/skills" || -L "$RESOLVED_DIR/.agents/skills" ) && ! -d "$RESOLVED_DIR/.agents/skills" ]]; then
    echo "Error: $RESOLVED_DIR/.agents/skills exists and is not a directory" >&2
    exit 1
fi

if [[ -d "$RESOLVED_DIR/AGENTS.md" ]]; then
    echo "Error: $RESOLVED_DIR/AGENTS.md exists and is a directory" >&2
    exit 1
fi

if [[ -d "$RESOLVED_DIR/.gitignore" ]]; then
    echo "Error: $RESOLVED_DIR/.gitignore exists and is a directory" >&2
    exit 1
fi

TMP_FILE=""
cleanup() {
    if [[ -n "$TMP_FILE" && -f "$TMP_FILE" ]]; then
        rm -f "$TMP_FILE"
    fi
}
trap cleanup EXIT

# 1. Ensure .agents/skills directory exists.
if [[ -d "$RESOLVED_DIR/.agents/skills" ]]; then
    AGENTS_SKILLS_STATUS="already exists"
else
    mkdir -p "$RESOLVED_DIR/.agents/skills"
    AGENTS_SKILLS_STATUS="created"
fi

# 2. Ensure AGENTS.md exists with starter heading template.
if [[ -e "$RESOLVED_DIR/AGENTS.md" || -L "$RESOLVED_DIR/AGENTS.md" ]]; then
    AGENTS_MD_STATUS="already exists"
else
    cat <<'EOF' > "$RESOLVED_DIR/AGENTS.md"
# AGENTS.md

## Project Overview

## Development Commands

## Coding Conventions
EOF
    AGENTS_MD_STATUS="created with template"
fi

# 3. Ensure .gitignore exists and contains deduplicated rule groups.
GITIGNORE_PATH="$RESOLVED_DIR/.gitignore"
GITIGNORE_CREATED=0
if [[ ! -e "$GITIGNORE_PATH" && ! -L "$GITIGNORE_PATH" ]]; then
    : > "$GITIGNORE_PATH"
    GITIGNORE_CREATED=1
fi

ADDED_SUMMARIES=()

ensure_gitignore_group() {
    local gitignore_file="$1"
    local group_header="$2"
    shift 2

    if [[ -z "$TMP_FILE" ]]; then
        TMP_FILE="$(mktemp)"
    fi

    local -a env_args=(
        "GI_HEADER=$group_header"
        "GI_OUT=$TMP_FILE"
        "GI_RULE_COUNT=$#"
    )
    local idx=1
    local rule
    for rule in "$@"; do
        env_args+=("GI_RULE_${idx}=$rule")
        idx=$((idx + 1))
    done

    local added_rules
    added_rules="$(env "${env_args[@]}" awk '
        BEGIN {
            header = ENVIRON["GI_HEADER"]
            out = ENVIRON["GI_OUT"]
            rule_count = ENVIRON["GI_RULE_COUNT"] + 0
            n = 0
            header_idx = 0
        }
        {
            line = $0
            sub(/\r$/, "", line)
            lines[++n] = line
            seen[line] = 1
            if (header_idx == 0 && line == header) {
                header_idx = n
            }
        }
        END {
            m = 0
            for (k = 1; k <= rule_count; k++) {
                r = ENVIRON["GI_RULE_" k]
                if (!(r in seen)) {
                    seen[r] = 1
                    missing[++m] = r
                }
            }
            if (m == 0) {
                exit 0
            }
            if (header_idx > 0) {
                ins = header_idx
                for (j = header_idx + 1; j <= n; j++) {
                    if (lines[j] == "" || lines[j] ~ /^[[:space:]]*#/) {
                        break
                    }
                    ins = j
                }
                for (j = 1; j <= n; j++) {
                    print lines[j] > out
                    if (j == ins) {
                        for (k = 1; k <= m; k++) {
                            print missing[k] > out
                        }
                    }
                }
            } else {
                last_nonblank = n
                while (last_nonblank > 0 && lines[last_nonblank] == "") {
                    last_nonblank--
                }
                for (j = 1; j <= last_nonblank; j++) {
                    print lines[j] > out
                }
                if (last_nonblank > 0) {
                    print "" > out
                }
                print header > out
                for (k = 1; k <= m; k++) {
                    print missing[k] > out
                }
            }
            close(out)
            summary = missing[1]
            for (k = 2; k <= m; k++) {
                summary = summary ", " missing[k]
            }
            print summary
        }
    ' "$gitignore_file")"

    if [[ -n "$added_rules" ]]; then
        cat "$TMP_FILE" > "$gitignore_file"
        ADDED_SUMMARIES+=("${group_header} (${added_rules})")
    fi
}

ensure_gitignore_group "$GITIGNORE_PATH" "# OS files" ".DS_Store"
ensure_gitignore_group "$GITIGNORE_PATH" "# AI files" ".agents/" ".claude/" ".gemini/" ".*buddy/"

if [[ ${#ADDED_SUMMARIES[@]} -gt 0 ]]; then
    joined_summaries="${ADDED_SUMMARIES[0]}"
    for ((i = 1; i < ${#ADDED_SUMMARIES[@]}; i++)); do
        joined_summaries="${joined_summaries}; ${ADDED_SUMMARIES[$i]}"
    done
    if [[ $GITIGNORE_CREATED -eq 1 ]]; then
        GITIGNORE_STATUS="created; added ${joined_summaries}"
    else
        GITIGNORE_STATUS="added ${joined_summaries}"
    fi
elif [[ $GITIGNORE_CREATED -eq 1 ]]; then
    GITIGNORE_STATUS="created"
else
    GITIGNORE_STATUS="already up to date"
fi

echo "Initialized project in ${RESOLVED_DIR}:"
echo "- .agents/skills/: ${AGENTS_SKILLS_STATUS}"
echo "- AGENTS.md: ${AGENTS_MD_STATUS}"
echo "- .gitignore: ${GITIGNORE_STATUS}"
