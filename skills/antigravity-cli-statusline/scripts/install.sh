#!/bin/bash
set -e

# Target paths
CLI_DIR="$HOME/.gemini/antigravity-cli"
STATUSLINE_DEST="$CLI_DIR/statusline.sh"
SETTINGS_FILE="$CLI_DIR/settings.json"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUSLINE_SRC="$SCRIPT_DIR/statusline.sh"

echo "Installing custom statusline script..."
mkdir -p "$CLI_DIR"
cp "$STATUSLINE_SRC" "$STATUSLINE_DEST"
chmod +x "$STATUSLINE_DEST"
echo "Script installed to $STATUSLINE_DEST."

echo "Updating settings.json..."
if [ -f "$SETTINGS_FILE" ]; then
  # Use jq to update settings.json
  if command -v jq >/dev/null 2>&1; then
    jq '.statusLine.type = "command" | .statusLine.command = "'"$STATUSLINE_DEST"'" | .statusLine.enabled = true | .statusLine.refreshInterval = 60' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"
    mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
    echo "settings.json updated successfully."
  else
    echo "Warning: jq is not installed. Please manually update settings.json to include:"
    echo '  "statusLine": {'
    echo '    "type": "command",'
    echo "    \"command\": \"$STATUSLINE_DEST\","
    echo '    "enabled": true,'
    echo '    "refreshInterval": 60'
    echo '  }'
  fi
else
  # Create a new settings.json if it does not exist
  cat <<EOF > "$SETTINGS_FILE"
{
  "statusLine": {
    "type": "command",
    "command": "$STATUSLINE_DEST",
    "enabled": true,
    "refreshInterval": 60
  }
}
EOF
  echo "Created new settings.json at $SETTINGS_FILE."
fi

echo "Installation complete! Please reload the status bar in your agy terminal using:"
echo "  /statusline off"
echo "  /statusline on"
