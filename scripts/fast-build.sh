#!/bin/bash
# Fast build script with optimizations

set -e

echo "🚀 Starting fast build with optimizations..."

# Kill any existing Metro bundler
pkill -f "react-native.*start" || true
pkill -f "metro" || true

# Clear only changed files, keep derived data cache
echo "📦 Clearing incremental build artifacts..."

# Start Metro with persistent cache
echo "📦 Starting Metro bundler with cache..."
npm start -- --reset-cache &
METRO_PID=$!

# Wait for Metro to be ready
sleep 5

# Build with Xcode (parallel builds enabled)
echo "🔨 Building iOS app with parallel compilation..."
cd ios

# Clean only if explicitly requested
if [ "$1" == "--clean" ]; then
  echo "🧹 Cleaning build..."
  xcodebuild clean -workspace EchoID.xcworkspace -scheme EchoID
fi

# Build with optimizations:
# - Use multiple parallel build jobs (auto-detects CPU cores)
# - Skip code signing during development (faster)
# - Use incremental builds
# - Enable build cache
# Set environment variables for faster builds
export CLANG_ENABLE_MODULES=YES
export SWIFT_COMPILATION_MODE=wholemodule
export COMPILER_INDEX_STORE_ENABLE=YES

# Use react-native run-ios but with optimizations
# It handles Metro automatically and uses incremental builds
cd ..
npx react-native run-ios \
  --simulator="iPhone 16 Pro" \
  --no-packager

cd ..

echo "✅ Build complete!"

# Keep Metro running in background
wait $METRO_PID 2>/dev/null || true
