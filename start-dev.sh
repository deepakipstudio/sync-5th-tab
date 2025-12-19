#!/bin/bash
# Detects OS and opens appropriate terminal with npm run dev

case "$(uname -s)" in
  Darwin)  # macOS
    osascript -e "tell app \"Terminal\" to do script \"cd $(pwd) && npm run dev\""
    ;;
  MINGW*|MSYS*|CYGWIN*)  # Windows (Git Bash, MSYS2, Cygwin)
    start powershell -NoExit -Command "npm run dev"
    ;;
  Linux)
    # Try common terminal emulators in order of preference
    if command -v gnome-terminal &> /dev/null; then
      gnome-terminal -- bash -c "npm run dev; exec bash"
    elif command -v konsole &> /dev/null; then
      konsole -e bash -c "npm run dev; exec bash"
    elif command -v xterm &> /dev/null; then
      xterm -e "npm run dev; exec bash"
    else
      echo "No supported terminal emulator found"
      exit 1
    fi
    ;;
  *)
    echo "Unsupported OS: $(uname -s)"
    exit 1
    ;;
esac

