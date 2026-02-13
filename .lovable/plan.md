

# Fix: Feedback Screenshots Not Visible ("Bucket not found")

## Problem

The `user-knowledge` storage bucket is **private** (not public), but the feedback screenshot upload code uses `getPublicUrl()` to generate image URLs. Public URLs only work for public buckets -- private buckets return `{"statusCode":"404","error":"Bucket not found"}`.

## Root Cause

In `src/pages/Feedback.tsx` (line 135):
```typescript
const { data } = supabase.storage.from("user-knowledge").getPublicUrl(path);
urls.push(data.publicUrl);
```

These public URLs are then stored in the feedback record's `metadata.screenshot_urls` and later rendered as `<img src={url}>` in `FeedbackManagement.tsx`. Since the bucket is private, none of these URLs resolve.

## Solution

Two files need changes:

### 1. `src/pages/Feedback.tsx` -- Store file **paths** instead of public URLs

Instead of calling `getPublicUrl()` and storing the full URL, store just the storage path (e.g., `userId/feedback/timestamp-random.png`). This allows the viewing side to generate signed URLs on demand.

- Line 135-136: Replace `getPublicUrl()` with just pushing the `path` string directly into the `urls` array (rename to `paths` for clarity).

### 2. `src/pages/admin/FeedbackManagement.tsx` -- Generate signed URLs for display

When rendering screenshots, generate signed URLs from the stored paths:

- Add a helper function that takes a path and calls `supabase.storage.from("user-knowledge").createSignedUrl(path, 3600)` (1-hour expiry).
- Use a `useEffect` or inline state to resolve signed URLs when `selectedFeedback` changes.
- Render the signed URLs in the `<img>` tags instead of the raw paths.
- Handle backward compatibility: if a stored URL starts with `http`, it is a legacy public URL -- attempt to extract the path portion and generate a signed URL for it too.

### Backward Compatibility

Existing feedback records already have full public URLs stored. The viewing code will detect these (they start with `https://`) and extract the path portion after `/object/public/user-knowledge/` to generate a valid signed URL.

## Technical Details

- **Signed URL expiry**: 1 hour (3600 seconds) -- sufficient for viewing sessions
- **No bucket configuration change needed** -- keeping the bucket private is the correct security posture for user-uploaded content
- **Files modified**: 2 (`src/pages/Feedback.tsx`, `src/pages/admin/FeedbackManagement.tsx`)
- **No database or migration changes required**
