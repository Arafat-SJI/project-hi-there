#!/bin/bash

# Edge Functions Deployment Script for SJ Innovation Framework V1

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   SJ Innovation Framework - Edge Functions Deployment     ║"
echo "║   Version 1.0 (Option B + Meetings)                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if in correct directory
if [ ! -d "supabase/functions" ]; then
    echo -e "${RED}✗ Error: Must run from project root with supabase/functions/ directory${NC}"
    echo "  Current directory: $(pwd)"
    echo "  Expected: supabase/functions/ to exist"
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Error: Supabase CLI not installed${NC}"
    echo ""
    echo "Install with:"
    echo "  npm install -g supabase"
    echo ""
    exit 1
fi

# Check if linked to project
echo -e "${BLUE}ℹ Checking Supabase project link...${NC}"
if ! supabase status &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: Project may not be linked to Supabase${NC}"
    echo ""
    echo "Link with:"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "Select deployment option:"
echo "  1) Deploy all V1 functions (31 functions)"
echo "  2) Deploy by module (select which modules)"
echo "  3) Deploy specific function"
echo "  4) List functions without deploying"
echo ""
read -p "Choice (1-4): " CHOICE

deploy_function() {
    local func_name=$1
    echo -e "${BLUE}  → Deploying $func_name...${NC}"
    if supabase functions deploy "$func_name" --no-verify-jwt; then
        echo -e "${GREEN}    ✓ $func_name deployed${NC}"
    else
        echo -e "${RED}    ✗ $func_name failed${NC}"
        return 1
    fi
}

case $CHOICE in
    1)
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}Deploying all V1 edge functions (31 functions)...${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""

        TOTAL=0
        SUCCESS=0
        FAILED=0

        # Foundation (4)
        echo -e "${YELLOW}[1/8] Foundation (4 functions)${NC}"
        deploy_function "validate-api-key" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "audit-log-writer" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "send-email" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "send-notification" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        echo ""

        # Auth & Users (2)
        echo -e "${YELLOW}[2/8] Auth & Users (2 functions)${NC}"
        deploy_function "admin-users" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "admin-delete-user" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        echo ""

        # Clients (1)
        echo -e "${YELLOW}[3/8] Clients (1 function)${NC}"
        deploy_function "api-v1-clients" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        echo ""

        # Meetings (6)
        echo -e "${YELLOW}[4/8] Meetings & Zoom (6 functions)${NC}"
        deploy_function "sync-zoom-files" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "zoom-transcript-processing" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "generate-meeting-summary" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "auto-embed-meetings" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "categorize-meeting" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "api-v1-meetings" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        echo ""

        # Knowledge Base (7)
        echo -e "${YELLOW}[5/8] Knowledge Base (7 functions)${NC}"
        deploy_function "google-drive-sync" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "google-drive-upload" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "user-knowledge-upload" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "user-knowledge-drive-sync" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "user-knowledge-process" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "auto-embed-knowledge-files" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "unified-knowledge-search" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        echo ""

        # AI Agents (8)
        echo -e "${YELLOW}[6/8] AI Agents (8 functions)${NC}"
        deploy_function "ai-chat-assistant" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "semantic-search" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "run-ai-agent" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "generate-embeddings" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "gemini-corpus-sync" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "gemini-rag-query" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "generate-business-doc" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        deploy_function "generate-sow" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        echo ""

        # Notifications (2)
        echo -e "${YELLOW}[7/8] Notifications (2 functions)${NC}"
        # send-notification already deployed in Foundation
        deploy_function "send-slack-message" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        echo ""

        # Feedback (1)
        echo -e "${YELLOW}[8/8] Feedback (1 function)${NC}"
        deploy_function "send-feedback-notification" && ((SUCCESS++)) || ((FAILED++)); ((TOTAL++))
        echo ""

        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✓ Deployment Summary${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo "  Total:   $TOTAL functions"
        echo "  Success: $SUCCESS functions"
        echo "  Failed:  $FAILED functions"
        echo ""
        ;;

    2)
        echo "Select modules to deploy (space-separated, e.g., '1 3 5'):"
        echo "  1) Foundation (4 functions)"
        echo "  2) Auth & Users (2 functions)"
        echo "  3) Clients (1 function)"
        echo "  4) Meetings & Zoom (6 functions)"
        echo "  5) Knowledge Base (7 functions)"
        echo "  6) AI Agents (8 functions)"
        echo "  7) Notifications (2 functions)"
        echo "  8) Feedback (1 function)"
        echo ""
        read -p "Modules: " MODULES

        for MODULE in $MODULES; do
            case $MODULE in
                1)
                    echo -e "${GREEN}Deploying Foundation...${NC}"
                    deploy_function "validate-api-key"
                    deploy_function "audit-log-writer"
                    deploy_function "send-email"
                    deploy_function "send-notification"
                    ;;
                2)
                    echo -e "${GREEN}Deploying Auth & Users...${NC}"
                    deploy_function "admin-users"
                    deploy_function "admin-delete-user"
                    ;;
                3)
                    echo -e "${GREEN}Deploying Clients...${NC}"
                    deploy_function "api-v1-clients"
                    ;;
                4)
                    echo -e "${GREEN}Deploying Meetings & Zoom...${NC}"
                    deploy_function "sync-zoom-files"
                    deploy_function "zoom-transcript-processing"
                    deploy_function "generate-meeting-summary"
                    deploy_function "auto-embed-meetings"
                    deploy_function "categorize-meeting"
                    deploy_function "api-v1-meetings"
                    ;;
                5)
                    echo -e "${GREEN}Deploying Knowledge Base...${NC}"
                    deploy_function "google-drive-sync"
                    deploy_function "google-drive-upload"
                    deploy_function "user-knowledge-upload"
                    deploy_function "user-knowledge-drive-sync"
                    deploy_function "user-knowledge-process"
                    deploy_function "auto-embed-knowledge-files"
                    deploy_function "unified-knowledge-search"
                    ;;
                6)
                    echo -e "${GREEN}Deploying AI Agents...${NC}"
                    deploy_function "ai-chat-assistant"
                    deploy_function "semantic-search"
                    deploy_function "run-ai-agent"
                    deploy_function "generate-embeddings"
                    deploy_function "gemini-corpus-sync"
                    deploy_function "gemini-rag-query"
                    deploy_function "generate-business-doc"
                    deploy_function "generate-sow"
                    ;;
                7)
                    echo -e "${GREEN}Deploying Notifications...${NC}"
                    deploy_function "send-slack-message"
                    ;;
                8)
                    echo -e "${GREEN}Deploying Feedback...${NC}"
                    deploy_function "send-feedback-notification"
                    ;;
                *)
                    echo -e "${RED}Invalid module: $MODULE${NC}"
                    ;;
            esac
        done
        echo -e "${GREEN}✓ Selected modules deployed!${NC}"
        ;;

    3)
        read -p "Enter function name: " FUNC_NAME
        deploy_function "$FUNC_NAME"
        ;;

    4)
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}V1 Framework Edge Functions (31 total)${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        echo "Foundation (4):"
        echo "  - validate-api-key"
        echo "  - audit-log-writer"
        echo "  - send-email"
        echo "  - send-notification"
        echo ""
        echo "Auth & Users (2):"
        echo "  - admin-users"
        echo "  - admin-delete-user"
        echo ""
        echo "Clients (1):"
        echo "  - api-v1-clients"
        echo ""
        echo "Meetings & Zoom (6):"
        echo "  - sync-zoom-files"
        echo "  - zoom-transcript-processing"
        echo "  - generate-meeting-summary"
        echo "  - auto-embed-meetings"
        echo "  - categorize-meeting"
        echo "  - api-v1-meetings"
        echo ""
        echo "Knowledge Base (7):"
        echo "  - google-drive-sync"
        echo "  - google-drive-upload"
        echo "  - user-knowledge-upload"
        echo "  - user-knowledge-drive-sync"
        echo "  - user-knowledge-process"
        echo "  - auto-embed-knowledge-files"
        echo "  - unified-knowledge-search"
        echo ""
        echo "AI Agents (8):"
        echo "  - ai-chat-assistant"
        echo "  - semantic-search"
        echo "  - run-ai-agent"
        echo "  - generate-embeddings"
        echo "  - gemini-corpus-sync"
        echo "  - gemini-rag-query"
        echo "  - generate-business-doc"
        echo "  - generate-sow"
        echo ""
        echo "Notifications (2):"
        echo "  - send-notification (in Foundation)"
        echo "  - send-slack-message"
        echo ""
        echo "Feedback (1):"
        echo "  - send-feedback-notification"
        echo ""
        exit 0
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Verify deployment:"
echo "   supabase functions list"
echo ""
echo "2. Set environment secrets (if not done):"
echo "   supabase secrets set OPENAI_API_KEY=sk-..."
echo "   supabase secrets set ZOOM_CLIENT_ID=..."
echo "   (See sj-innovation-framework_edge-functions-deployment.md)"
echo ""
echo "3. Test a function:"
echo "   curl https://YOUR_PROJECT.supabase.co/functions/v1/validate-api-key"
echo ""
echo "4. Check function logs:"
echo "   supabase functions logs <function-name>"
echo ""
