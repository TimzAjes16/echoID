#!/bin/bash
# Clean build script to fix locked database errors

set -e

echo "🧹 Cleaning all build artifacts..."

# Kill all build processes
echo "Stopping all build processes..."
pkill -9 -f "xcodebuild" 2>/dev/null || true
pkill -9 Xcode 2>/dev/null || true
killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true

# Remove locked database and derived data
echo "Removing derived data and locked databases..."
rm -rf ~/Library/Developer/Xcode/DerivedData/EchoID-* 2>/dev/null || true
rm -rf ~/Library/Caches/com.apple.dt.Xcode/* 2>/dev/null || true

# Clean project build folder
cd "$(dirname "$0")/.."
cd ios
rm -rf build Pods/build 2>/dev/null || true
xcodebuild clean -workspace EchoID.xcworkspace -scheme EchoID 2>/dev/null || true

echo "✅ Clean complete! You can now build from Xcode or run: npm run ios"
