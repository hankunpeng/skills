---
name: antigravity-cli-statusline
description: Customizes the Antigravity CLI status bar to show folder icons, home-abbreviated current working directory, model name, and 5H/7D token quota usage with live refresh countdown.
---

# Antigravity CLI Custom Statusline Skill

This skill allows configuring, installing, or updating the custom status bar configuration for the Antigravity CLI (`agy`).

## Features

- **Double-line / Single-line Auto Layout**: Automatically fits path and quotas into a single line if terminal width permits, otherwise falls back to a clean double-line layout.
- **Home Directory Abbreviation**: Replaces the home directory path (`/Users/YOUR_USER`) with `~` for cleaner workspace paths.
- **Directory Emoji**: Prepend `📂` to the leftmost side of the path.
- **Token Quota Display**: Displays 5H (5-hour) and 7D (weekly) remaining fraction percentages.
- **Live Refresh Countdown**: Displays `⏳ Xh Ym` (if >= 1h) or `⌛ 0h Ym` (if < 1h) for the 5-hour quota reset time.
- **Auto-Refresh**: Configures the status line to update every 60 seconds.

## Files Included

- `scripts/statusline.sh`: The shell script executed by `agy` to render the status line.
- `scripts/install.sh`: Helper script to automatically copy `statusline.sh` to the app data directory, grant execution permissions, and update `settings.json`.

## Usage

Run the installation helper script from this skill folder to install or update:
```bash
<skill_dir>/scripts/install.sh
```
