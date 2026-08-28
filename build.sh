#!/bin/bash
# ─────────────────────────────────────────────────────────
# Inspektr — Build Script
# Generates a clean .zip ready for Chrome Web Store upload
# Usage: bash build.sh
# ─────────────────────────────────────────────────────────

set -e

VERSION=$(node -p "require('./manifest.json').version")
OUTFILE="inspektr-v${VERSION}.zip"

echo "📦 Building Inspektr v${VERSION}..."

# Validate manifest JSON
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))" \
  && echo "  ✅ manifest.json is valid JSON" \
  || { echo "  ❌ manifest.json has JSON errors"; exit 1; }

# Clean previous build
rm -f "$OUTFILE"

# Create zip, excluding dev-only files
zip -r "$OUTFILE" . \
  --exclude "*.git*" \
  --exclude "*.DS_Store*" \
  --exclude "store-assets/*" \
  --exclude "agent.md" \
  --exclude "build.sh" \
  --exclude "*.svg" \
  --exclude "*.sh" \
  --exclude "*.md" \
  --exclude "node_modules/*" \
  --exclude "*.zip"

SIZE=$(du -sh "$OUTFILE" | cut -f1)
echo "  ✅ Created: $OUTFILE ($SIZE)"
echo ""
echo "Next steps:"
echo "  1. Go to https://chrome.google.com/webstore/devconsole"
echo "  2. Click 'New Item' and upload $OUTFILE"
echo "  3. Fill in the store listing (see store-assets/store-listing.md)"
echo "  4. Add privacy policy URL: https://laricodgt.github.io/inspektr/privacy.html"
echo "  5. Submit for review"
