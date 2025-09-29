#!/bin/bash
# Node.js Version Verification Script

echo "Checking Node.js version requirements..."
echo

# Check current Node.js version
if command -v node &> /dev/null; then
    CURRENT_VERSION=$(node --version)
    echo "Current Node.js version: $CURRENT_VERSION"
    
    # Extract major version number
    MAJOR_VERSION=$(echo $CURRENT_VERSION | sed 's/v\([0-9]*\).*/\1/')
    
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        echo "✓ Node.js version is compatible (requires >=18)"
    else
        echo "✗ Node.js version is too old (requires >=18, found $MAJOR_VERSION)"
        echo "Please upgrade to Node.js 18 or newer"
        exit 1
    fi
else
    echo "✗ Node.js is not installed"
    exit 1
fi

echo

# Check npm version
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "Current npm version: $NPM_VERSION"
else
    echo "✗ npm is not installed"
    exit 1
fi

echo
echo "✓ All Node.js requirements satisfied"