---
name: clip
description: Fetch any URL and convert it to clean, ad-free Markdown (GFM or OFM) or JSON using fetch CLI (Chrome CDP with network-level ad blocking, DOM/Shadow-DOM ad purification, site-specific adapters for X/Twitter, YouTube transcripts, Hacker News, and generic pages via Defuddle). Ad removal is enabled by default; supports -g (GFM) and -o (OFM) flags with automatic .obsidian/ vault detection. Use when the user invokes $clip or /clip, or wants to save a webpage as Markdown or an Obsidian note.
version: 1.0.0
metadata:
  openclaw:
    homepage: https://github.com/hankunpeng/skills#clip
    requires:
      anyBins:
        - bun
---

# Web Clipper (`clip`)

Use `$clip` in Codex and `/clip` in agents that expose skills as slash commands. Fetches any URL via `fetch` CLI (Chrome CDP + site-specific adapters) with multi-layer ad removal enabled by default, and formats the output as **GitHub Flavored Markdown (`gfm`)** or **Obsidian Flavored Markdown (`ofm`)**.

## Invocation & Flavor Selection

- Optional leading flag right after `$clip` or `/clip`:
  - `-g` or `--gfm` (e.g., `$clip -g https://example.com`) → forces `gfm` output (`--flavor gfm`).
  - `-o` or `--ofm` (e.g., `/clip -o https://example.com`) → forces `ofm` output (`--flavor ofm`).
- **Flavor Precedence** (when no explicit flag is passed):
  1. Explicit flag (`-g` / `--gfm`, `-o` / `--ofm`, or `--flavor <gfm|ofm>`)
  2. `EXTEND.md` `default_flavor` (`gfm` or `ofm`; skipped when `auto` or unset)
  3. Automatic Obsidian vault detection: if the output path or current working directory has a `.obsidian/` folder in itself or any ancestor directory → `ofm`
  4. Default → `gfm`

## Multi-Layer Ad Blocking & Flavor Formatting

1. **CDP Network-Level Ad Blocking**: Blocks requests to major ad networks and outstream video ad widgets (`doubleclick`, `googlesyndication`, `ezoic`, `humix`, `open.video`, `adthrive`, `raptive`, `mediavine`, `freestar`, `connatix`, `primis`, `taboola`, `outbrain`, `carbonads`, etc.) before they execute or inject DOM elements.
2. **DOM & Shadow-DOM Ad Purification**: Strips ad placeholders, floating video playlists (`Now Playing` / `Up Next`), native recommendation widgets, tracking pixels, and non-content navigation blocks, while normalizing pseudo-headings (e.g., `<p class="cpp-section">` → `##`).
3. **Flavor-Specific Callouts & Media**:
   - **GFM (`gfm`)**: Converts callouts/admonitions (LearnCpp `.cpp-note`, GitHub `.markdown-alert`, Docusaurus/VitePress/MkDocs admonitions) into GitHub Alerts (`> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]`, placing non-redundant titles on line 2 as `> **Title**` and mapping `FAQ` to `NOTE`), and keeps standard Markdown relative media links (`![alt](imgs/...)`, `[label](videos/...)`).
   - **OFM (`ofm`)**: Converts callouts into single-line Obsidian Callouts (`> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION|FAQ] Title`), and rewrites local body media links to Obsidian embeds (`![[imgs/...|alt]]`, `![[videos/...]]`, escaping table pipes with `\|`) while preserving frontmatter `coverImage` and outer linked images (`[![alt](img)](url)`).
4. **Markdown Post-Processing**: Filters any residual ad blocks, sponsored labels, video ad playlists, or ad-domain links before media collection and file output.

## User Input Tools

When this skill prompts the user, follow this tool-selection rule (priority order):

1. **Prefer built-in user-input tools** exposed by the current agent runtime — e.g., `AskUserQuestion`, `request_user_input`, `clarify`, `ask_user`, or any equivalent.
2. **Fallback**: if no such tool exists, emit a numbered plain-text message and ask the user to reply with the chosen number/answer for each question.
3. **Batching**: if the tool supports multiple questions per call, combine all applicable questions into a single call; if only single-question, ask them one at a time in priority order.

Concrete `AskUserQuestion` references below are examples — substitute the local equivalent in other runtimes.

## CLI Setup

**Important**: The CLI source is vendored in `{baseDir}/scripts/lib`. `scripts/package.json` installs only third-party runtime dependencies.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `{baseDir}`
2. Resolve `${BUN}` runtime: if `bun` installed → `bun`; else suggest installing Bun
3. If `{baseDir}/scripts/node_modules` does not exist, run `${BUN} install --cwd {baseDir}/scripts`
4. `${READER}` = `{baseDir}/scripts/fetch`
5. Replace all `${READER}` in this document with the resolved value

## Preferences (EXTEND.md)

Check EXTEND.md in priority order — the first one found wins:

| Priority | Path | Scope |
|----------|------|-------|
| 1 | `.config/skills/clip/EXTEND.md` | Project |
| 2 | `${XDG_CONFIG_HOME:-$HOME/.config}/skills/clip/EXTEND.md` | User home |
| 3 | `.config/skills/url-to-obsidian/EXTEND.md` | Project legacy fallback |
| 4 | `${XDG_CONFIG_HOME:-$HOME/.config}/skills/url-to-obsidian/EXTEND.md` | User home legacy fallback |
| 5 | `.config/skills/url-to-markdown/EXTEND.md` | Project legacy fallback |
| 6 | `${XDG_CONFIG_HOME:-$HOME/.config}/skills/url-to-markdown/EXTEND.md` | User home legacy fallback |

| Result | Action |
|--------|--------|
| Found | Read, parse, apply settings |
| Not found | **MUST** run first-time setup (see below) — do NOT silently create defaults |

**EXTEND.md supports**: download media by default, default Markdown flavor, default output directory, optional folder prefix.

### First-Time Setup ⛔ BLOCKING

When EXTEND.md is not found, you **MUST** use `AskUserQuestion` to gather preferences before creating EXTEND.md. **NEVER** create EXTEND.md with silent defaults. Generation is BLOCKED until setup completes. Batch all four questions into a single call:

- **Q1 — Media** (header "Media"): "How to handle images and videos in pages?"
  - "Ask each time (Recommended)" — Prompt after each save
  - "Always download" — Download to local `imgs/` and `videos/`
  - "Never download" — Keep remote URLs
- **Q2 — Flavor** (header "Flavor"): "Default Markdown flavor when no `-g` or `-o` flag is passed?"
  - "Auto-detect (Recommended)" — `ofm` inside `.obsidian/` vaults, `gfm` elsewhere
  - "GFM (`gfm`)" — Always default to GitHub Flavored Markdown
  - "OFM (`ofm`)" — Always default to Obsidian Flavored Markdown
- **Q3 — Output** (header "Output"): "Default output directory?"
  - "clip (Recommended)" — Save to `./clip/{domain}/{slug}/{slug}.md`
  - "Current directory" — Save to `./{domain}/{slug}/{slug}.md`
  - User may pick "Other" and type a custom path
- **Q4 — Save** (header "Save"): "Where to save preferences?"
  - "User (Recommended)" — `$HOME/.config/skills/clip/EXTEND.md` (all projects)
  - "Project" — `.config/skills/clip/EXTEND.md` (this project only)

After answers, write EXTEND.md, confirm "Preferences saved to [path]", then continue.

Full template: [references/config/first-time-setup.md](references/config/first-time-setup.md).

### Supported Keys

| Key | Default | Values | Description |
|-----|---------|--------|-------------|
| `download_media` | `ask` | `ask` / `1` / `0` | `ask` = prompt each time, `1` = always, `0` = never |
| `default_flavor` | `auto` | `auto` / `gfm` / `ofm` | `auto` = `ofm` when `.obsidian/` is detected else `gfm` |
| `default_output_dir` | empty | path or empty | Default output directory (empty = `./clip/`) |
| `folder_prefix` | empty | string or empty | Custom folder name prefix (e.g., `learncpp-chapter-0-getting-started-`). When set, omits the intermediate `{domain}/` directory and names the article folder `{folder_prefix}{section}-{slug}` (if page title starts with `X.Y — ...`) or `{folder_prefix}{slug}` |

**EXTEND.md → CLI mapping**:

| EXTEND.md key | CLI argument | Notes |
|---------------|-------------|-------|
| `download_media: 1` | `--download-media` | Requires `--output` (or `--output-dir` / `EXTEND.md` output settings) |
| `default_flavor: gfm \| ofm` | `--flavor gfm \| ofm` | CLI `-g` / `-o` / `--flavor` always overrides `EXTEND.md`; `auto` falls back to `.obsidian/` vault detection else `gfm` |
| `default_output_dir: ./posts/` | Agent constructs `--output ./posts/{domain}/{slug}/{slug}.md` | Agent generates path, not a direct flag |
| `folder_prefix: learncpp-chapter-0-getting-started-` | Agent constructs/renames folder to `{base_dir}/{folder_prefix}{section}-{slug}/{slug}.md` | Omits `{domain}/` layer; auto-extracts section number `Y` from `X.Y — Title` if present |

**Value priority**: CLI arguments → EXTEND.md → vault auto-detection → skill defaults.

## Usage

```bash
# Default: headless capture with ad removal, auto-detects .obsidian/ (ofm) else gfm, markdown to stdout
${READER} <url>

# Force GitHub Flavored Markdown or Obsidian Flavored Markdown
${READER} <url> -g --output article.md
${READER} <url> -o --output note.md --download-media

# Explicit --flavor option
${READER} <url> --flavor ofm --output note.md

# Wait for interaction (login/CAPTCHA) — auto-detect and continue
${READER} <url> --wait-for interaction --output article.md

# Wait for interaction — manual control (Enter to continue)
${READER} <url> --wait-for force --output article.md

# JSON output
${READER} <url> --format json --output article.json

# Force specific adapter
${READER} <url> --adapter youtube --output transcript.md
```

## Options

| Option | Description |
|--------|-------------|
| `<url>` | URL to fetch |
| `-g`, `--gfm` | Output GitHub Flavored Markdown (`gfm`) |
| `-o`, `--ofm` | Output Obsidian Flavored Markdown (`ofm`) |
| `--flavor <type>` | Markdown flavor: `gfm` or `ofm` (overrides `EXTEND.md` and `.obsidian/` detection) |
| `--output <path>` | Output file path (default: stdout) |
| `--output-dir <dir>` | Base output directory when auto-generating output path |
| `--folder-prefix <str>` | Custom folder name prefix (omits domain folder and auto-inserts lesson number if title starts with `X.Y`) |
| `--format <type>` | Output format: `markdown` (default) or `json` |
| `--json` | Shorthand for `--format json` |
| `--adapter <name>` | Force adapter: `x`, `youtube`, `hn`, or `generic` (default: auto-detect) |
| `--headless` | Force headless Chrome (no visible window) |
| `--wait-for <mode>` | Interaction wait mode: `none` (default), `interaction`, or `force` |
| `--wait-for-interaction` | Alias for `--wait-for interaction` |
| `--wait-for-login` | Alias for `--wait-for interaction` |
| `--timeout <ms>` | Page load timeout (default: 30000) |
| `--interaction-timeout <ms>` | Login/CAPTCHA wait timeout (default: 600000 = 10 min) |
| `--interaction-poll-interval <ms>` | Poll interval for interaction checks (default: 1500) |
| `--download-media` | Download images/videos to local `imgs/` and `videos/`, rewrite markdown links (uses `![[...]]` in `ofm` mode). Requires `--output` or output dir config |
| `--media-dir <dir>` | Base directory for downloaded media (default: same as `--output` directory) |
| `--cdp-url <url>` | Reuse existing Chrome DevTools Protocol endpoint |
| `--browser-path <path>` | Custom Chrome/Chromium binary path |
| `--chrome-profile-dir <path>` | Chrome user data directory (default: `CHROME_PROFILE_DIR` env or `./skills/chrome-profile`) |
| `--debug-dir <dir>` | Write debug artifacts (document.json, markdown.md, page.html, network.json) |

## Agent Quality Gate

**CRITICAL**: treat default headless capture as provisional. Some sites render differently in headless mode and can silently return low-quality content without failing the CLI.

After every headless run, inspect the saved markdown. See [references/quality-gate.md](references/quality-gate.md) for the full checklist, recovery workflow, and capture-mode table. Read it whenever a run looks suspicious or the user asks about login/CAPTCHA handling.

## Output Path Generation

The agent must construct the output file path — `fetch` does not auto-generate paths unless `--output-dir` or `--folder-prefix` is passed.

**Algorithm**:
1. Determine base directory from EXTEND.md `default_output_dir` or default `./clip/`
2. Extract domain from URL (e.g., `example.com`)
3. Generate slug from URL path or page title (kebab-case, 2-6 words)
4. Check `folder_prefix` in EXTEND.md:
   - **If `folder_prefix` is empty/unset**:
     Construct `{base_dir}/{domain}/{slug}/{slug}.md` — each URL gets its own directory so media files stay isolated.
   - **If `folder_prefix` is set** (e.g., `learncpp-chapter-0-getting-started-`):
     - Omit the `{domain}/` intermediate directory.
     - After fetching (or when the page title is known), check if the page `title` in frontmatter starts with a chapter/lesson number like `X.Y — ...` (e.g., `0.4 — Introduction to C++ development`).
     - If `X.Y` is present and `folder_prefix` does not already include the lesson number, set `{folder_name}` = `{folder_prefix}{Y}-{slug}` (e.g., `learncpp-chapter-0-getting-started-4-introduction-to-c-development`); otherwise set `{folder_name}` = `{folder_prefix}{slug}`.
     - Final path: `{base_dir}/{folder_name}/{slug}.md` (if `fetch` initially wrote to `{base_dir}/{folder_prefix}{slug}/{slug}.md` before the page title was known, automatically `mv` the directory to `{base_dir}/{folder_name}` **before** prompting or running `--download-media`).
5. Conflict resolution: append timestamp `{folder_name}-YYYYMMDD-HHMMSS/{slug}-YYYYMMDD-HHMMSS.md`

Pass the constructed path to `--output` (along with `-g` or `-o` if requested by the user). Media files (`--download-media`) are saved into subdirectories next to the markdown file, keeping each URL's assets self-contained.

## Adapters & Media

See [references/adapters.md](references/adapters.md) for the adapter catalog (X, YouTube, Hacker News, generic), per-adapter notes, the media download flow (`ask` / always / never), and the JSON output schema. Read it before answering adapter-specific questions or handling media prompts.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CHROME_PROFILE_DIR` | Chrome user data directory (can also use `--chrome-profile-dir`) |

**Troubleshooting**: Chrome not found → use `--browser-path`. Timeout → increase `--timeout`. Login/CAPTCHA → `--wait-for interaction`. Debug → `--debug-dir` to inspect captured HTML and network logs.

## Extension Support

Custom configurations via EXTEND.md. See **Preferences** section above for paths and supported keys.
