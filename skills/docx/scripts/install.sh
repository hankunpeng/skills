#!/bin/bash
set -e

# Helper to get the currently installed markitdown version
get_markitdown_version() {
  if command -v markitdown >/dev/null 2>&1; then
    markitdown --version 2>/dev/null | awk '{print $2}'
  elif [ -f "$HOME/.local/bin/markitdown" ]; then
    "$HOME/.local/bin/markitdown" --version 2>/dev/null | awk '{print $2}'
  else
    echo ""
  fi
}

# Helper to check if ver1 < ver2
is_version_less_than() {
  local ver1=$1
  local ver2=$2
  if [ -z "$ver1" ]; then
    return 0
  fi
  python3 -c "
def parse(v):
    try:
        return tuple(map(int, [x for x in v.split('.') if x.isdigit()]))
    except:
        return (0,)
import sys; sys.exit(0 if parse('$ver1') < parse('$ver2') else 1)
"
}

echo "Checking markitdown status..."

CURRENT_VERSION=$(get_markitdown_version)
FORCE_FLAG=""
RUN_INSTALL=true

if [ -n "$CURRENT_VERSION" ]; then
  echo "Found installed markitdown version: $CURRENT_VERSION"
  if is_version_less_than "$CURRENT_VERSION" "0.1.6"; then
    echo "Installed version is less than 0.1.6. Will force update."
    FORCE_FLAG="--force"
  else
    echo "markitdown is already up to date (version $CURRENT_VERSION >= 0.1.6). Skipping installation."
    RUN_INSTALL=false
  fi
else
  echo "markitdown is not installed. Performing clean installation..."
fi

if [ "$RUN_INSTALL" = true ]; then
  # Ensure pipx is available
  if ! command -v pipx >/dev/null 2>&1; then
    echo "Error: pipx is not installed. Please install pipx first (e.g., 'brew install pipx' or 'pip install pipx')."
    exit 1
  fi

  # Find an available Python interpreter that is >= 3.13
  PYTHON_CMD=""
  PYTHON_VERSION=""
  for cmd in python3.15 python3.14 python3.13 python3; do
    if command -v "$cmd" >/dev/null 2>&1; then
      VER=$("$cmd" -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo "0.0")
      MAJOR=$(echo "$VER" | cut -d. -f1)
      MINOR=$(echo "$VER" | cut -d. -f2)
      if [ "$MAJOR" -eq 3 ] && [ "$MINOR" -ge 13 ] || [ "$MAJOR" -gt 3 ]; then
        PYTHON_CMD="$cmd"
        PYTHON_VERSION="$VER"
        break
      fi
    fi
  done

  # If no interpreter >= 3.13 is found, try to install it
  if [ -z "$PYTHON_CMD" ]; then
    echo "No Python interpreter >= 3.13 was found in the system path."
    if command -v brew >/dev/null 2>&1; then
      echo "Homebrew detected. Attempting to install python@3.13..."
      brew install python@3.13
      PYTHON_CMD="python3.13"
    elif command -v apt-get >/dev/null 2>&1; then
      echo "Debian/Ubuntu detected. Attempting to install python3.13..."
      sudo apt-get update && sudo apt-get install -y python3.13
      PYTHON_CMD="python3.13"
    elif command -v dnf >/dev/null 2>&1; then
      echo "Fedora/RHEL detected. Attempting to install python3.13..."
      sudo dnf install -y python3.13
      PYTHON_CMD="python3.13"
    else
      echo "Error: No package manager (brew/apt/dnf) detected to install python3.13 automatically."
      echo "Please install Python 3.13 or newer manually and try again."
      exit 1
    fi

    # Verify if installation succeeded and link path
    if ! command -v "$PYTHON_CMD" >/dev/null 2>&1; then
      BREW_PYTHON="/opt/homebrew/opt/python@3.13/bin/python3.13"
      if [ -f "$BREW_PYTHON" ]; then
        PYTHON_CMD="$BREW_PYTHON"
      else
        echo "Error: Python 3.13 is still missing after installation attempt."
        exit 1
      fi
    fi
  else
    echo "Using Python interpreter: $PYTHON_CMD ($PYTHON_VERSION)"
  fi

  if [ "$FORCE_FLAG" = "--force" ]; then
    echo "Installing markitdown[all] using pipx (with --force) using Python interpreter: $PYTHON_CMD..."
    pipx install --force --python "$PYTHON_CMD" "markitdown[all]"
  else
    echo "Installing markitdown[all] using pipx using Python interpreter: $PYTHON_CMD..."
    pipx install --python "$PYTHON_CMD" "markitdown[all]"
  fi
fi

# Verify installation and path
USER_BIN="$HOME/.local/bin"
if command -v markitdown >/dev/null 2>&1; then
  echo "markitdown verified successfully at $(which markitdown)."
elif [ -f "$USER_BIN/markitdown" ]; then
  echo "markitdown was installed to $USER_BIN/markitdown, but it is not in your PATH."
  case ":$PATH:" in
    *:"$USER_BIN":*) ;;
    *)
      echo "Warning: $USER_BIN is not in your PATH."
      echo "Please add it to your PATH by adding this to your shell config:"
      echo "  export PATH=\"\$PATH:$USER_BIN\""
      ;;
  esac
else
  echo "Error: markitdown could not be located."
  exit 1
fi

echo "Installation complete!"
