#!/bin/bash

# Script to verify SecureEnclaveModule is properly set up

echo "Checking SecureEnclaveModule setup..."

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IOS_DIR="$PROJECT_ROOT/ios/EchoID"

echo ""
echo "1. Checking if files exist..."
if [ -f "$IOS_DIR/SecureEnclaveModule.swift" ]; then
  echo "✓ SecureEnclaveModule.swift exists"
else
  echo "✗ SecureEnclaveModule.swift NOT FOUND"
fi

if [ -f "$IOS_DIR/SecureEnclaveModule.m" ]; then
  echo "✓ SecureEnclaveModule.m exists"
else
  echo "✗ SecureEnclaveModule.m NOT FOUND"
fi

if [ -f "$IOS_DIR/EchoID-Bridging-Header.h" ]; then
  echo "✓ EchoID-Bridging-Header.h exists"
else
  echo "✗ EchoID-Bridging-Header.h NOT FOUND"
fi

echo ""
echo "2. Checking Xcode project..."
cd "$PROJECT_ROOT/ios"

# Check if files are in the project
if grep -q "SecureEnclaveModule.swift" EchoID.xcodeproj/project.pbxproj 2>/dev/null; then
  echo "✓ SecureEnclaveModule.swift is in Xcode project"
else
  echo "✗ SecureEnclaveModule.swift NOT in Xcode project - you need to add it manually"
fi

if grep -q "SecureEnclaveModule.m" EchoID.xcodeproj/project.pbxproj 2>/dev/null; then
  echo "✓ SecureEnclaveModule.m is in Xcode project"
else
  echo "✗ SecureEnclaveModule.m NOT in Xcode project - you need to add it manually"
fi

echo ""
echo "3. Instructions to fix:"
echo "   If files are missing from Xcode project:"
echo "   1. Open ios/EchoID.xcworkspace in Xcode"
echo "   2. Right-click on 'EchoID' folder in Project Navigator"
echo "   3. Select 'Add Files to EchoID...'"
echo "   4. Select SecureEnclaveModule.swift and SecureEnclaveModule.m"
echo "   5. Make sure 'Copy items if needed' is unchecked"
echo "   6. Make sure 'EchoID' target is checked"
echo "   7. Click 'Add'"
echo ""
echo "   Then rebuild: npm run ios"

