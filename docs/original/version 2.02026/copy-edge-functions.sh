#!/bin/bash

# Copy Edge Functions from SJ Innovation Framework to New Project

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   SJ Innovation Framework - Copy Edge Functions           ║"
echo "║   Version 1.0 (Option B + Meetings)                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}✗ Error: Destination path required${NC}"
    echo ""
    echo "Usage:"
    echo "  ./copy-edge-functions.sh <destination-project-path>"
    echo ""
    echo "Example:"
    echo "  ./copy-edge-functions.sh ../my-new-app"
    echo ""
    exit 1
fi

DEST="$1"
SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Check if source has supabase/functions
if [ ! -d "$SOURCE/supabase/functions" ]; then
    echo -e "${RED}✗ Error: Source directory doesn't have supabase/functions/${NC}"
    echo "  Source: $SOURCE"
    exit 1
fi

# Create destination if it doesn't exist
mkdir -p "$DEST/supabase/functions"

echo -e "${BLUE}ℹ Source:      $SOURCE/supabase/functions/${NC}"
echo -e "${BLUE}ℹ Destination: $DEST/supabase/functions/${NC}"
echo ""

# V1 Functions to copy (31 functions + _shared)
V1_FUNCTIONS=(
    "_shared"
    # Foundation (4)
    "validate-api-key"
    "audit-log-writer"
    "send-email"
    "send-notification"
    # Auth & Users (2)
    "admin-users"
    "admin-delete-user"
    # Clients (1)
    "api-v1-clients"
    # Meetings & Zoom (6)
    "sync-zoom-files"
    "zoom-transcript-processing"
    "generate-meeting-summary"
    "auto-embed-meetings"
    "categorize-meeting"
    "api-v1-meetings"
    # Knowledge Base (7)
    "google-drive-sync"
    "google-drive-upload"
    "user-knowledge-upload"
    "user-knowledge-drive-sync"
    "user-knowledge-process"
    "auto-embed-knowledge-files"
    "unified-knowledge-search"
    # AI Agents (8)
    "ai-chat-assistant"
    "semantic-search"
    "run-ai-agent"
    "generate-embeddings"
    "gemini-corpus-sync"
    "gemini-rag-query"
    "generate-business-doc"
    "generate-sow"
    # Notifications (1 - send-notification already in Foundation)
    "send-slack-message"
    # Feedback (1)
    "send-feedback-notification"
)

echo -e "${YELLOW}Copying ${#V1_FUNCTIONS[@]} edge functions...${NC}"
echo ""

COPIED=0
SKIPPED=0
FAILED=0

for FUNC in "${V1_FUNCTIONS[@]}"; do
    if [ -d "$SOURCE/supabase/functions/$FUNC" ]; then
        if cp -r "$SOURCE/supabase/functions/$FUNC" "$DEST/supabase/functions/"; then
            echo -e "${GREEN}  ✓ Copied $FUNC${NC}"
            ((COPIED++))
        else
            echo -e "${RED}  ✗ Failed to copy $FUNC${NC}"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}  ⚠ Skipped $FUNC (not found)${NC}"
        ((SKIPPED++))
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Copy Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Copied:  $COPIED functions"
echo "  Skipped: $SKIPPED functions"
echo "  Failed:  $FAILED functions"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}⚠ Some functions failed to copy${NC}"
    echo ""
    exit 1
fi

if [ $COPIED -eq 0 ]; then
    echo -e "${RED}✗ No functions were copied${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Edge functions copied successfully!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Navigate to your new project:"
echo "   cd $DEST"
echo ""
echo "2. Review copied functions:"
echo "   ls supabase/functions/"
echo ""
echo "3. Link to your Supabase project:"
echo "   supabase link --project-ref YOUR_PROJECT_REF"
echo ""
echo "4. Set environment secrets:"
echo "   supabase secrets set OPENAI_API_KEY=sk-..."
echo "   supabase secrets set ZOOM_CLIENT_ID=..."
echo "   (See sj-innovation-framework_edge-functions-deployment.md)"
echo ""
echo "5. Deploy functions:"
echo "   Use deploy-edge-functions.sh script or:"
echo "   supabase functions deploy <function-name>"
echo ""
echo "6. Verify deployment:"
echo "   supabase functions list"
echo ""
echo "For detailed instructions, see:"
echo "  sj-innovation-framework_edge-functions-deployment.md"
echo ""
