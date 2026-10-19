#!/usr/bin/env bash
set -euo pipefail

# Text formatting
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Playwright System Chrome Environment Setup ===${NC}"

# 1. Detect Google Chrome on the system
echo -e "\nChecking for Google Chrome..."
CHROME_FOUND=false
OS_TYPE="$(uname -s)"

if [ "$OS_TYPE" = "Darwin" ]; then
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo -e "${GREEN}✓ Google Chrome found at /Applications/Google Chrome.app${NC}"
        CHROME_FOUND=true
    fi
elif [ "$OS_TYPE" = "Linux" ]; then
    if command -v google-chrome &>/dev/null || command -v google-chrome-stable &>/dev/null; then
        echo -e "${GREEN}✓ Google Chrome binary found in PATH${NC}"
        CHROME_FOUND=true
    fi
fi

if [ "$CHROME_FOUND" = false ]; then
    echo -e "${YELLOW}⚠ Warning: Google Chrome was not found at standard locations.${NC}"
    echo -e "Please ensure Google Chrome is installed before running Playwright tests with channel: 'chrome'."
fi

# 2. Add PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD to shell profile
ENV_VAR="export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1"

# Determine current user shell config
TARGET_PROFILE=""
if [ -n "${ZSH_VERSION:-}" ] || [ -f "$HOME/.zshrc" ]; then
    TARGET_PROFILE="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    TARGET_PROFILE="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    TARGET_PROFILE="$HOME/.bash_profile"
else
    TARGET_PROFILE="$HOME/.profile"
fi

echo -e "\nChecking shell configuration in ${TARGET_PROFILE}..."

if grep -q "PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD" "$TARGET_PROFILE" 2>/dev/null; then
    echo -e "${GREEN}✓ PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is already configured in ${TARGET_PROFILE}${NC}"
else
    echo "" >> "$TARGET_PROFILE"
    echo "# Skip downloading bundled Playwright browser binaries (use system Chrome)" >> "$TARGET_PROFILE"
    echo "$ENV_VAR" >> "$TARGET_PROFILE"
    echo -e "${GREEN}✓ Successfully added ${ENV_VAR} to ${TARGET_PROFILE}${NC}"
fi

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "Run ${BLUE}source ${TARGET_PROFILE}${NC} or open a new terminal tab to apply changes."
