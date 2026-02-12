#!/bin/bash
set -euo pipefail

# Only run in Claude Code remote (web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install npm dependencies
# Uses `npm install` (not `npm ci`) to take advantage of container caching
# Uses `--ignore-scripts` to avoid postinstall failures from packages that
# download external binaries (e.g. supabase CLI), which aren't needed for
# linting or building
cd "$CLAUDE_PROJECT_DIR"
npm install --ignore-scripts
