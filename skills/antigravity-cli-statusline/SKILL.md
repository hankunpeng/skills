---
name: antigravity-cli-statusline
description: Customizes the Antigravity CLI status bar into a unified single line showing folder icons, cwd, active model, context tokens, and 5H/7D token quota usage with live refresh countdown.
---

# Antigravity CLI Custom Statusline Skill

This skill allows configuring, installing, or updating the custom status bar configuration for the Antigravity CLI (`agy`).

## Features

- **Unified Single-Line Status Bar**: Seamlessly integrates the default model line with custom telemetry additions into a single, clean line.
  - **Left Side**: Displays `? for shortcuts` (or agent activity state, e.g. `thinking...`).
  - **Right Side**: Displays `📂 <cwd> | ● <model> | 📜 <context> | ⏳ <5H timer> | 5H: <%> | ⏳ <7D timer> | 7D: <%>`.
- **Adaptive Responsive Width**: Dynamically adapts to terminal widths from 80 to 160+ columns without wrapping into multiple lines.
- **Directory Emoji**: Prepend `📂` with home-abbreviated path (`~/...`).
- **Token Quota Display**: Displays 5H (5-hour) and 7D (weekly) remaining fraction percentages with dynamic color coding (Microsoft palette).
- **Live Refresh Countdown**: Displays live countdowns (`⏳ Xh Ym` / `⏳ Xd Yh` or `⌛ 0h Ym`) for reset times.
- **Auto-Refresh**: Configures the status line to update every 60 seconds.

## Files Included

- `scripts/statusline.sh`: The shell script executed by `agy` to render the status line.
- `scripts/install.sh`: Helper script to automatically copy `statusline.sh` to the app data directory, grant execution permissions, and update `settings.json`.

## Usage

Run the installation helper script from this skill folder to install or update:
```bash
<skill_dir>/scripts/install.sh
```
