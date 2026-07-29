#!/bin/bash
# Install MX Kiro Bridge as a macOS LaunchAgent (auto-start on login)

PLIST_NAME="com.mxkiro.bridge.plist"
PLIST_SRC="$(dirname "$0")/$PLIST_NAME"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "📦 Installing MX Kiro Bridge LaunchAgent..."

# Stop if already loaded
launchctl bootout gui/$(id -u) "$PLIST_DST" 2>/dev/null

# Copy plist
cp "$PLIST_SRC" "$PLIST_DST"
echo "   ✅ Plist copied to $PLIST_DST"

# Load
launchctl bootstrap gui/$(id -u) "$PLIST_DST"
echo "   ✅ LaunchAgent loaded"

# Verify
sleep 2
if curl -s http://localhost:9848/health | grep -q '"status":"ok"'; then
    echo "   ✅ Bridge is running!"
    echo ""
    echo "   Health: $(curl -s http://localhost:9848/health)"
else
    echo "   ⚠️  Bridge may not be running yet. Check: tail -f /tmp/mxkiro-bridge.log"
fi

echo ""
echo "Done! Bridge will auto-start on login."
echo "To stop: launchctl bootout gui/\$(id -u) $PLIST_DST"
echo "Logs: tail -f /tmp/mxkiro-bridge.log"
