---
name: twitter
description: Posts content, deletes tweets, or exports/saves tweets to YAML on X (Twitter) using Chrome Computer Use Mode. Use when user requests "post to Twitter", "tweet", "share on X", "post to X", "delete tweet", "export tweets", or "save tweets".
version: 1.0.0
---

# Twitter Skill

Posts text and images to X (Twitter) via Chrome Computer Use Mode.

## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `{baseDir}`
2. Script paths:
   - Setup / Initializer: `{baseDir}/scripts/setup.ts`
   - Clipboard helper: `{baseDir}/scripts/copy-to-clipboard.ts`
   - Tweet exporter/scraper: `{baseDir}/scripts/export-tweets.ts`
   - Official X API helper: `{baseDir}/scripts/x-api.ts`
3. Resolve `${BUN_X}` runtime: if `bun` installed → `bun`; if `npx` available → `npx -y bun`; else suggest installing bun
4. Replace all `{baseDir}` and `${BUN_X}` in this document with actual values
5. **Initial Setup**: Run the setup script to automatically initialize configuration folders and template files:
   ```bash
   ${BUN_X} {baseDir}/scripts/setup.ts
   ```

## Execution Mode

This skill follows a **Hybrid Execution Model**:

1. **API First (Recommended for text posts)**: Attempt to post the tweet using the official X API script (`x-api.ts`). This is fast, stable, and uses no browser resources.
2. **Browser Fallback**: If the API call fails (e.g., monthly 1500-tweet Free tier quota exceeded, rate limit) or API credentials are not configured in `~/.config/hkp-skills/twitter.yaml`, fall back automatically to **Chrome Computer Use Mode** / **CLI Bridge** to simulate browser actions.

### Prerequisites
- **For API Mode**: Configure your X API credentials and state in your global `~/.config/hkp-skills/twitter.yaml` file:
  ```yaml
  x_api:
    api_key: "YOUR_API_KEY"
    api_key_secret: "YOUR_API_KEY_SECRET"
    access_token: "YOUR_ACCESS_TOKEN"
    access_token_secret: "YOUR_ACCESS_TOKEN_SECRET"

  state:
    use_api: true
    last_reset_month: "2026-06"
  ```

  #### X Developer Portal Setup Guide:
  1. Go to the [X Developer Portal](https://developer.twitter.com/en/portal/dashboard).
  2. Select your App under **Projects & Apps**.
  3. Under **User authentication settings**, click **Set up** (or **Edit**):
     - **App permissions**: Select **Read and write**.
     - **Type of App**: Select **Web App, Automated App or Bot**.
     - **Callback URI / Redirect URL**: Enter `https://127.0.0.1` (required placeholder).
     - **Website URL**: Enter your project URL, e.g. `https://github.com/hankunpeng/hkp-skills` (required placeholder).
     - Save the settings.
  4. Go to the **Keys and Tokens** tab:
     - Under **Consumer Keys**, copy or regenerate the **API Key** and **API Key Secret**.
     - Under **Access Token and Secret**, click **Regenerate** to obtain the **Access Token** and **Access Token Secret** (Note: tokens must be regenerated after changing permissions to activate write access).
  5. Copy these 4 credentials and paste them into `~/.config/hkp-skills/twitter.yaml`.

- **For Browser Fallback**: Google Chrome installed, logged into X (Twitter) in Chrome, and macOS accessibility permissions granted if required.

## Regular Posts Workflow (Text & Images)

When executing a post:

1. Start the agent turn by calling `get_app_state` (or equivalent tool) for `Google Chrome`.
2. Open or navigate Google Chrome to `https://x.com/compose/post`.
3. Locate the tweet composer input box.
4. Type the post text into the composer using Computer Use keyboard inputs.
5. If there are any images to attach (max 4):
   For each image:
   a. Run the clipboard helper script to copy the image to the clipboard:
      ```bash
      ${BUN_X} {baseDir}/scripts/copy-to-clipboard.ts image /absolute/path/to/image.png
      ```
   b. Paste the image into the composer using the paste shortcut (`super+v` on macOS, `control+v` on Windows/Linux).
   c. Wait 2-3 seconds until X finishes uploading the media.
6. **Publish Safety**: Never click `Publish`, `Post`, or any equivalent button to publish the tweet without getting explicit final confirmation from the user in the current conversation.
7. Once the user confirms, click the `Post` button to publish.
8. After publishing, **close the composer modal** so the UI doesn't stay stuck on the compose dialog. Use the close button or Escape:
   - **DOM Selector**: `[data-testid="app-bar-close"]` or `[aria-label="Close"]`
   - **Fallback**: dispatch an `Escape` keydown event
9. **Auto-Reload Feed (Optional)**: If the user has other tabs open to their profile (e.g., `x.com/[username]`) or home feed (`x.com/home`), reload them so the new tweet is visible immediately.

```javascript
var closeBtn = document.querySelector('[data-testid="app-bar-close"], [aria-label="Close"]');
if (closeBtn) { closeBtn.click(); }
else { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); }
```

## CLI Bridge (No Computer Use Tools)

When the environment lacks Computer Use keyboard/mouse tools, use platform-specific methods to open Chrome and inject JavaScript into the page.

### macOS (AppleScript)

**Open compose page:**
```bash
open -a "Google Chrome" "https://x.com/compose/post"
```

**Execute JavaScript in Chrome** — write JS to a temp file first (avoids shell escaping issues), then run via AppleScript:

```bash
cat > /tmp/tweet.js << 'EOF'
(function() { /* your code */ })();
EOF

osascript -e '
tell application "Google Chrome"
    activate
    set js to read "/tmp/tweet.js"
    set result to execute front window'"'"'s active tab javascript js
    return result
end tell'
```

**Pattern**: Always write the JS payload to a temp file first. Do NOT attempt inline `osascript -e` with embedded JS — quote/escaping conflicts will cause parse errors.

**Close composer after publishing** (otherwise the modal stays open):
```javascript
var closeBtn = document.querySelector('[data-testid="app-bar-close"], [aria-label="Close"]');
if (closeBtn) { closeBtn.click(); }
else { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true })); }
```

**Reload profile/home tabs to reflect the new post immediately (Optional)**:
```bash
osascript -e '
tell application "Google Chrome"
    tell window 1
        set tabList to every tab whose URL contains "x.com/hankunpeng" or URL contains "x.com/home"
        repeat with t in tabList
            reload t
        end repeat
    end tell
end tell'
```

### Linux

```bash
google-chrome "https://x.com/compose/post"
# Use chrome-remote-interface or similar CDP client to execute JS
```

### Windows

```powershell
Start-Process "chrome" "https://x.com/compose/post"
# Use CDP via --remote-debugging-port or PowerShell automation
```

## JavaScript / DOM Automation Guidelines (Fallback)

If direct Computer Use keyboard/mouse events are not available, or you are running in browser scripting/CDP modes, follow these guidelines to interact with X's React/Draft.js editor:

1. **Multiple Editor Detection**:
   X pages often contain multiple compose textareas (e.g., inline composer on home feed and active modal dialog). Always query all editors:
   ```javascript
   var els = document.querySelectorAll('[data-testid="tweetTextarea_0"]');
   var el = els.length > 1 ? els[els.length - 1] : els[0];
   ```
   Always target the active modal composer (usually the last element in the list).

2. **Binding Selection & Focus**:
   Before inserting text, you MUST click the element to trigger Draft.js selection binding, then focus:
   ```javascript
   el.click();
   el.focus();
   ```

3. **Preserving Editor Structure**:
   - **Do NOT** use `el.innerHTML = ''` or `document.execCommand('delete')` on an empty composer. Wiping the DOM nodes destroys Draft.js's internal wrapper structure (e.g., `public-DraftStyleDefault-block` span), which crashes the React component and leaves the Post button permanently disabled.
   - Simply use `document.execCommand('insertText', false, text)` directly into the empty focused editor.

4. **Triggering React State Updates**:
   After text insertion, dispatch a bubbled `input` event to notify React:
   ```javascript
   el.dispatchEvent(new Event('input', { bubbles: true }));
   ```

5. **Locating the Correct Post Button**:
   The button testids (`tweetButtonInline` and `tweetButton`) might be swapped depending on the context. Always scan for the visible, enabled button:
   ```javascript
   var btns = document.querySelectorAll('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
   var activeBtn = Array.from(btns).find(function(btn) {
       var isVisible = btn.offsetWidth > 0 && btn.offsetHeight > 0;
       var isDisabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
       return isVisible && !isDisabled;
   });
    if (activeBtn) activeBtn.click();
    ```

## Delete Tweet Workflow

When executing a deletion:

1. Open or navigate Google Chrome to the user's profile page (`https://x.com/[username]`) or the direct tweet URL (`https://x.com/[username]/status/[tweetId]`).
2. Search for the target tweet `<article>` container containing the text to delete.
3. Click the options menu button on the tweet:
   - **DOM Selector**: `[data-testid="caret"]`
4. Wait 1-2 seconds, then click the "Delete" menu item:
   - **DOM Selector**: A `[role="menuitem"]` element whose text contains "Delete" or "删除".
5. Wait 1-2 seconds, then click the confirmation delete button in the dialog sheet:
   - **DOM Selector**: `[data-testid="confirmationSheetConfirm"]` (or fallback to any dialog button with text "Delete" or "删除").

### CLI Bridge Example (macOS)

Use the same temp-file + AppleScript pattern as posting. Replace `TWEET_TEXT_HERE` with the target tweet content.

**Step 1 — Find tweet and click caret:**

```bash
cat > /tmp/del-1.js << 'EOF'
(function() {
  var articles = document.querySelectorAll('article');
  var target = null;
  var needle = 'TWEET_TEXT_HERE';
  for (var i = 0; i < articles.length; i++) {
    var textEl = articles[i].querySelector('[data-testid="tweetText"]');
    if (textEl && textEl.textContent.trim().indexOf(needle) !== -1) {
      target = articles[i];
      break;
    }
  }
  if (!target) return 'ERROR: tweet not found';
  var caret = target.querySelector('[data-testid="caret"]');
  if (!caret) return 'ERROR: caret not found';
  caret.click();
  return 'OK: caret clicked';
})();
EOF

osascript -e '
tell application "Google Chrome"
    set js to read "/tmp/del-1.js"
    set result to execute front window'"'"'s active tab javascript js
    return result
end tell'
```

**Step 2 — Click Delete menuitem** (wait 1-2s after step 1):

```bash
cat > /tmp/del-2.js << 'EOF'
(function() {
  var items = document.querySelectorAll('[role="menuitem"]');
  for (var i = 0; i < items.length; i++) {
    var txt = items[i].textContent.trim();
    if (txt === 'Delete' || txt === '删除') {
      // Click the menuitem itself, or if it contains a nested clickable element
      var clickTarget = items[i].querySelector('[role="menuitem"]') || items[i];
      clickTarget.click();
      return 'OK: delete clicked (index ' + i + ')';
    }
  }
  // Fallback: click the first menuitem (always "Delete" in the dropdown)
  var first = document.querySelectorAll('[role="menuitem"]')[0];
  if (first) { first.click(); return 'OK: first menuitem clicked'; }
  return 'ERROR: no menuitems';
})();
EOF

osascript -e '
tell application "Google Chrome"
    set js to read "/tmp/del-2.js"
    set result to execute front window'"'"'s active tab javascript js
    return result
end tell'
```

**Step 3 — Confirm deletion** (wait 1-2s after step 2):

```bash
cat > /tmp/del-3.js << 'EOF'
(function() {
  var confirmBtn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
  if (!confirmBtn) {
    var buttons = document.querySelectorAll('[role="button"], button');
    for (var i = 0; i < buttons.length; i++) {
      var txt = buttons[i].textContent.trim();
      if (txt === 'Delete' || txt === '删除') {
        confirmBtn = buttons[i];
        break;
      }
    }
  }
  if (!confirmBtn) return 'ERROR: confirm button not found';
  confirmBtn.click();
  return 'OK: confirm clicked';
})();
EOF

osascript -e '
tell application "Google Chrome"
    set js to read "/tmp/del-3.js"
    set result to execute front window'"'"'s active tab javascript js
    return result
end tell'
```

## Export Tweets Workflow

To export/save all or filtered tweets from your profile page:

1. Run the exporter script:
   ```bash
   ${BUN_X} {baseDir}/scripts/export-tweets.ts [startDate] [endDate]
   ```
   *   **Optional Date Filters**: You can pass `startDate` (e.g. `2026-06-01`) and `endDate` (e.g. `2026-06-30`) to filter the output by date range. If omitted, all scraped tweets are exported.
   *   **Output File**: The tweets will be saved in `/Users/alex/twitter/twitter.yaml` where the tweet URL is the key, and the tweet text content is the value.

