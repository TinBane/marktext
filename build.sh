#!/bin/bash
set -euo pipefail

echo "=== MarkText macOS Build ==="
echo "App: ${app_name}"
echo "Version: ${date_version_number}"
echo "Architecture: ${arch}"

# Install dependencies. The workspace postinstall downloads Electron, applies
# patch-package patches, rebuilds native modules and minifies locales.
echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

# Build main/preload/renderer with electron-vite and package with
# electron-builder. Signs and notarizes when credentials are available
# (see docs/dev/MACOS_CODE_SIGNING.md); otherwise produces an unsigned build.
echo "=== Building and packaging ==="
pnpm run "build:mac:${arch}"

# Copy the versioned installer to a stable name for the bundle step.
cp dist/marktext-mac-"${arch}"-*.dmg "dist/MarkText-${arch}-mac.dmg"

echo "=== Build complete ==="
ls -la dist/
