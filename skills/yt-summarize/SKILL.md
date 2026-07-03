---
name: yt-summarize
description: Downloads YouTube subtitles and summarizes the video content using Gemini models while filtering out sponsor promotions. Use when the user asks to summarize, analyze, or get details from a YouTube URL.
---

# YouTube Video Summarization Skill

This skill allows downloading subtitles of YouTube videos and summarizing their contents using Gemini models. It filters out sponsor promotions and can start an interactive chat session about the video.

## Features

- **Subtitles-based Summary**: Summarizes YouTube videos by downloading their subtitles or auto-generated subtitles using `yt-dlp`. No large video downloads are required.
- **Sponsor Filtering**: Configured to ignore sponsor/promotional content in the summary.
- **Interactive Chat**: Allows starting a follow-up chat session to ask questions about the video.
- **Multi-language Support**: Can extract subtitles in specified languages.

## Prerequisites

Ensure the following tools are installed on your system:
- `yt-dlp` (e.g. `brew install yt-dlp`)
- `python3`
- `httpx` (`pip3 install httpx`)
- `myopenai` (a custom package/module present on your system)

## Files Included

- `scripts/yt-summarize.py`: The Python script that runs `yt-dlp` and calls the Gemini/LLM API.
- `scripts/install.sh`: Helper script to copy `yt-summarize.py` to the app data directory, grant execution permissions, and set up a command alias.

## Usage

### Install or Update:
```bash
<skill_dir>/scripts/install.sh
```

### Run from command line:
```bash
yt-summarize <youtube-url> [--lang <lang-code>] [--model <model-name>]
```

For example, to summarize a video:
```bash
yt-summarize https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

To summarize with Chinese subtitles (if available):
```bash
yt-summarize https://www.youtube.com/watch?v=dQw4w9WgXcQ --lang zh-Hans
```

## Troubleshooting

### 1. Zsh: no matches found
If you encounter `zsh: no matches found: <url>` error, it is because of the `?` character in the YouTube URL. Wrap the URL in double quotes:
```bash
yt-summarize "https://www.youtube.com/watch?v=Rtkac4WHC1o"
```

### 2. Bot verification issues
If you see `Sign in to confirm you’re not a bot`, pass browser cookies using the `--ytdlp-arg` flag. On macOS, Chrome cookies are recommended:
```bash
yt-summarize "https://www.youtube.com/watch?v=Rtkac4WHC1o" --ytdlp-arg "--cookies-from-browser chrome"
```
*(Note: Using `--cookies-from-browser safari` may fail due to macOS container sandbox permission issues.)*

### 3. API Key Issues
If the API key is not detected (e.g. for Gemini), you can specify another provider (like `deepseek` or `openai`) and pass the corresponding key:
```bash
yt-summarize "https://www.youtube.com/watch?v=Rtkac4WHC1o" --api deepseek
```

