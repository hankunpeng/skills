---
name: playwright-use-chrome
description: Configure and enforce Playwright to use the system's installed Google Chrome browser instead of downloading bulky bundled Chromium/WebKit/Firefox binaries (~1.5GB - 2GB). Use whenever writing or configuring Playwright tests, web scraping scripts, browser automation, E2E testing, or troubleshooting Playwright browser installation issues.
---

# Playwright Use System Chrome

This skill configures and enforces Playwright to directly utilize the locally installed **Google Chrome** browser across TypeScript, JavaScript, and Python projects, eliminating redundant browser downloads (~1.5 GB to 2 GB) and keeping disk footprint minimal.

---

## Agent Instructions & Strict Rules

When this skill is active, AI Agents must strictly adhere to the following rules:

1. **NEVER run `playwright install` or download browser binaries**:
   - Do NOT execute `npx playwright install`, `playwright install`, or `npx playwright install-deps` unless the user explicitly demands testing with Firefox or WebKit.
   - When adding dependencies or running package installation commands, prepend `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`:
     ```bash
     PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm install
     # or
     PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 pnpm install
     ```
2. **ALWAYS specify `channel: 'chrome'`**:
   - In `playwright.config.{ts,js}`, configure projects with `channel: 'chrome'`.
   - In direct script launches (`chromium.launch()`), always pass `{ channel: 'chrome' }` (or Python `channel="chrome"`).
3. **Handle Missing Browser Errors Correctly**:
   - If Playwright throws `Executable doesn't exist at ...` or similar error, do NOT reflexively run `playwright install`.
   - Instead, verify that Google Chrome is installed on the user's system and check that the script specifies `channel: 'chrome'` or points to the platform's Chrome executable path.

---

## Configuration & Code Templates

### 1. Playwright Test Configuration (`playwright.config.ts` / `playwright.config.js`)

Configure the test runner project to use `Desktop Chrome` with `channel: 'chrome'`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Google Chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Uses system-installed Google Chrome
      },
    },
  ],
});
```

Run tests using the project:
```bash
npx playwright test --project="Google Chrome"
# or run directly with the channel flag
npx playwright test --channel=chrome
```

---

### 2. Node.js / TypeScript Script

```typescript
import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({
    channel: 'chrome', // Reuses local Google Chrome
    headless: true,    // Set to false for headed debugging
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://example.com');
  console.log('Title:', await page.title());

  await browser.close();
}

run();
```

---

### 3. Python Script

#### Sync API:
```python
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page()
    page.goto("https://example.com")
    print("Title:", page.title())
    browser.close()
```

#### Async API:
```python
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chrome", headless=True)
        page = await browser.new_page()
        await page.goto("https://example.com")
        print("Title:", await page.title())
        await browser.close()

asyncio.run(main())
```

---

## System Chrome Paths (Fallback Reference)

If `channel: 'chrome'` cannot automatically detect Chrome (e.g. non-standard installation directories or customized containers), explicitly specify `executablePath`:

* **macOS**:
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
* **Linux**:
  `/usr/bin/google-chrome` or `/usr/bin/google-chrome-stable`
* **Windows**:
  `C:\Program Files\Google\Chrome\Application\chrome.exe` or `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`

Example using `executablePath`:
```typescript
const browser = await chromium.launch({
  executablePath: process.env.CHROME_BIN || (
    process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : process.platform === 'win32'
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      : '/usr/bin/google-chrome'
  ),
  headless: true,
});
```

---

## Environment Setup Script

To permanently prevent package managers from downloading Playwright browsers during installs on this machine, run:

```bash
bash scripts/setup-env.sh
```

To verify that Playwright can detect and launch your local Google Chrome:

```bash
bash scripts/verify-chrome.sh
```
