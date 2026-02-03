

# Plan: Fix Build Errors in Multiple Files

## Overview
There are 4 distinct issues causing 16+ build errors. The fixes involve either correcting table/column references or adding proper type handling.

## Issues and Fixes

### 1. Project Backups Files (table doesn't exist)

**Files:**
- `src/components/projects/ProjectsBackupStatus.tsx`
- `src/components/projects/ProjectsRestoreBackupDialog.tsx`

**Problem:** These files query a `project_backups` table that doesn't exist in the database schema.

**Solution:** Delete both files since they reference non-existent infrastructure. If backup functionality is needed later, it should be rebuilt with proper database tables.

---

### 2. GeminiRAGConfig.tsx (wrong column names)

**File:** `src/pages/admin/GeminiRAGConfig.tsx`

**Problem:** The interface expects columns that don't exist:
- Expects: `description`, `last_synced_at`
- Actual: `display_name`, `updated_at`

**Solution:** Update the interface and query to match actual schema:
```typescript
interface GeminiCorpus {
  id: string;
  name: string;
  display_name: string | null;  // Changed from description
  is_active: boolean | null;
  updated_at: string | null;    // Changed from last_synced_at
  created_at: string | null;
}
```
Update the select query and UI to use `display_name` instead of `description`.

---

### 3. MemoryAnalytics.tsx (wrong column names)

**File:** `src/pages/admin/MemoryAnalytics.tsx`

**Problem:** The interface uses old column names:
- `job_type` should be `batch_type`
- `processed_items` should be `processed_count`
- `error_message` doesn't exist (needs `failed_count` + `metadata` instead)

**Solution:** Update interface to match actual schema:
```typescript
interface QueueHistoryRow {
  id: string;
  batch_type: string;           // Changed from job_type
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  total_items: number | null;
  processed_count: number | null; // Changed from processed_items
  failed_count: number | null;    // Added (replacing error_message)
}
```

---

### 4. ZoomMeetingService.ts (spread type issue)

**File:** `src/lib/zoomMeetingService.ts` (line 215)

**Problem:** `requestBody.settings` is `unknown` type, cannot spread.

**Solution:** Add type assertion or properly type the settings object:
```typescript
requestBody.settings = {
  ...(requestBody.settings as Record<string, unknown>),
  approval_type: 0,
  registrants_confirmation_email: true,
};
```

---

## Summary of Changes

| File | Action |
|------|--------|
| `ProjectsBackupStatus.tsx` | Delete |
| `ProjectsRestoreBackupDialog.tsx` | Delete |
| `GeminiRAGConfig.tsx` | Update interface and query |
| `MemoryAnalytics.tsx` | Update interface and query |
| `zoomMeetingService.ts` | Add type assertion |

## Technical Notes

- The deleted backup components may need to be removed from imports/routes elsewhere
- After these fixes, the Zoom OAuth flow will work with the newly added recording scopes
- Users should still disconnect and reconnect Zoom after deployment to get new tokens with recording permissions

