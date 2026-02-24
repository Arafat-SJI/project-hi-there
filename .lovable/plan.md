

# Remove AI Chat Feature Entirely

## Overview
Remove all references to the AI Chat page and "chat with me" functionality across the app. The product uses AI agents embedded in specific pages, not a standalone chat interface.

## Changes

### 1. Navigation: Remove "AI Chat" from AI Command Center
**File: `src/shared/data/navigationStructure.ts`** (lines 278-290)
- Remove the "AI Chat" nav item from the AI Command Center group
- If AI Command Center becomes empty, remove the entire group (it only has AI Chat)

### 2. TopNav: Remove Sparkles chat shortcut
**File: `src/components/layout/TopNav.tsx`** (lines 174-184)
- Remove the AI Chat shortcut button (Sparkles icon linking to `/ai-chat`)

### 3. Dashboard: Replace "Ask AI" button in welcome banner
**File: `src/pages/Dashboard.tsx`** (line 109-114)
- Change the "Ask AI" button from linking to `/ai-chat` to linking to `/ai-agents` with label "Meet Your AI Team"

### 4. Agent Guide Popover: Remove "Or chat with me" link
**File: `src/components/dashboard/AIAgentGuidePopover.tsx`** (lines 187-192)
- Remove the secondary "Or chat with me" ghost button entirely
- Remove the `MessageSquare` import since it's no longer needed

### 5. Routes: Remove AI Chat route
**File: `src/modules/platform/routes.tsx`** (lines 72-74)
- Remove the `/ai-chat` route and its `AIChat` import

## What stays
- The `/ai-agents` page (agent listing/management) remains
- All AI agent functionality embedded in feature pages remains
- The AI Command Center nav group will be removed since it only contained AI Chat -- agents are managed via admin panel
- Edge functions (`ai-chat-assistant`) remain deployed (used by other features like knowledge form)
