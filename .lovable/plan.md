

# Fix Feedback Submission Error

## Problem
Submitting a bug report or feature request fails with error: `Could not find the 'module' column of 'feedback' in the schema cache`. The `feedback` table does not have a `module` column, but the insert statement on line 308 of `src/pages/Feedback.tsx` tries to write to it.

## Solution
Add the `module` column to the `feedback` table via a database migration.

## Changes

### 1. Database Migration
Add a `module` column (nullable text) to the `feedback` table:
```sql
ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS module TEXT;
```

### 2. No Code Changes Needed
The frontend code in `src/pages/Feedback.tsx` is already correct -- it inserts `module: formData.module || null`. The only issue is the missing database column.

## Technical Details
- The migration adds a nullable `TEXT` column, so existing rows are unaffected (they'll have `NULL` for module)
- No RLS policy changes needed since existing policies already cover all columns
- No type regeneration issues -- the insert uses the Supabase client dynamically

