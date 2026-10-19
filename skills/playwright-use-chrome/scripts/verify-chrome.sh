#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Playwright Google Chrome Verification ===${NC}"

# Check system Chrome version and path
OS_TYPE="$(uname -s)"
CHROME_VERSION=""
CHROME_PATH=""

if [ "$OS_TYPE" = "Darwin" ]; then
    CHROME_APP="/Applications/Google Chrome.app"
    PLIST="${CHROME_APP}/Contents/Info.plist"
    if [ -d "$CHROME_APP" ] && [ -f "$PLIST" ]; then
        CHROME_VERSION="$(defaults read "$PLIST" CFBundleShortVersionString 2>/dev/null || true)"
        CHROME_PATH="${CHROME_APP}/Contents/MacOS/Google Chrome"
        echo -e "${GREEN}✓ Local Google Chrome found!${NC}"
        echo -e "  Version: ${CHROME_VERSION}"
        echo -e "  Binary:  ${CHROME_PATH}"
    else
        echo -e "${RED}✗ Google Chrome not found at /Applications/Google Chrome.app${NC}"
        exit 1
    fi
elif [ "$OS_TYPE" = "Linux" ]; then
    CHROME_BIN="$(command -v google-chrome || command -v google-chrome-stable || true)"
    if [ -n "$CHROME_BIN" ]; then
        CHROME_VERSION="$("$CHROME_BIN" --version 2>/dev/null || true)"
        CHROME_PATH="$CHROME_BIN"
        echo -e "${GREEN}✓ Local Google Chrome found!${NC}"
        echo -e "  Version: ${CHROME_VERSION}"
        echo -e "  Binary:  ${CHROME_PATH}"
    else
        echo -e "${RED}✗ Google Chrome binary not found in PATH${NC}"
        exit 1
    fi
fi

# Optional: test actual Playwright launch if package is present in the current project or globally
echo -e "\nChecking Playwright runtime environment..."

TEST_NODE_SCRIPT="
const { chromium } = require('playwright');
(async () => {
  try {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    console.log('  ✓ Playwright successfully launched system Google Chrome!');
    console.log('    Reported browser version:', browser.version());
    await browser.close();
  } catch (err) {
    console.error('  ✗ Playwright launch failed:', err.message);
  }
})();
"

if node -e "require('playwright')" &>/dev/null; then
    echo -e "${GREEN}✓ Found Node.js 'playwright' package. Testing launch...${NC}"
    node -e "$TEST_NODE_SCRIPT"
elif python3 -c "import playwright" &>/dev/null; then
    echo -e "${GREEN}✓ Found Python 'playwright' package. Testing launch...${NC}"
    python3 -c "
from playwright.sync_api import sync_playwright
try:
    with sync_playwright() as p:
        b = p.chromium.launch(channel='chrome', headless=True)
        print('  ✓ Python Playwright successfully launched system Google Chrome!')
        print('    Reported browser version:', b.version)
        b.close()
except Exception as e:
    print('  ✗ Python Playwright launch failed:', e)
"
else
    echo -e "${YELLOW}Notice: Playwright library is not installed in the current directory or globally.${NC}"
    echo -e "When you install and run Playwright in your projects, use ${BLUE}channel: 'chrome'${NC} to connect to this Chrome installation."
fi

echo -e "\n${GREEN}Verification complete! System Chrome is ready for Playwright.${NC}"
