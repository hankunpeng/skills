#!/bin/bash
set -e

# Target paths
CLI_DIR="$HOME/.gemini/antigravity-cli"
DEST_DIR="$CLI_DIR/bin"
DEST_FILE="$DEST_DIR/yt-summarize"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC_FILE="$SCRIPT_DIR/yt-summarize.py"

echo "=== Installing YouTube Summarizer Skill ==="
echo ""

# Create destination bin directory if it doesn't exist
mkdir -p "$DEST_DIR"

# Copy script and make it executable
cp "$SRC_FILE" "$DEST_FILE"
chmod +x "$DEST_FILE"
cp "$SCRIPT_DIR/api_client.py" "$DEST_DIR/api_client.py"
echo "✔ Script installed to $DEST_FILE"

# Check dependencies
echo "Checking dependencies..."
if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "⚠️ Warning: 'yt-dlp' is not installed. You will need it to fetch video subtitles."
  echo "   You can install it via Homebrew: brew install yt-dlp"
else
  echo "✔ 'yt-dlp' is installed"
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "❌ Error: 'python3' is not found. Please install Python 3."
else
  echo "✔ 'python3' is installed"
  if ! python3 -c "import httpx" >/dev/null 2>&1; then
    echo "⚠️ Warning: Python library 'httpx' is not installed."
    echo "   You can install it via pip: pip3 install httpx"
  else
    echo "✔ Python library 'httpx' is installed"
  fi
  
  if ! PYTHONPATH="$DEST_DIR" python3 -c "import api_client" >/dev/null 2>&1; then
    echo "⚠️ Warning: Python library 'api_client' is not installed or importable."
    echo "   Ensure it is in your PYTHONPATH or installed in the target Python environment."
  else
    echo "✔ Python library 'api_client' is bundled and importable"
  fi
fi

# Add alias to ~/.zshrc if not already present
ZSHRC="$HOME/.zshrc"
ALIAS_LINE="alias yts=\"$DEST_FILE\""

if [ -f "$ZSHRC" ]; then
  if grep -q "alias yts=" "$ZSHRC"; then
    # Update existing alias
    python3 -c "
lines = open('$ZSHRC').readlines()
updated = [line if 'alias yts=' not in line else '$ALIAS_LINE\n' for line in lines]
open('$ZSHRC', 'w').writelines(updated)
"
    echo "✔ Updated 'yts' alias in $ZSHRC"
  else
    # Add new alias
    echo "" >> "$ZSHRC"
    echo "# YouTube Summarize Skill alias" >> "$ZSHRC"
    echo "$ALIAS_LINE" >> "$ZSHRC"
    echo "✔ Added 'yts' alias to $ZSHRC"
  fi
fi

echo ""
echo "=== Installation Complete ==="
echo "Please reload your shell config using: source ~/.zshrc"
echo "You can then run: yts <youtube-url>"
