

# Navigation UX Overhaul — Reduce Overwhelm

## Problem Analysis

When a CEO logs in, the sidebar currently shows **7 expanded groups + Dashboard**, totaling **~28 visible links** before scrolling. Every group defaults to `open: true`. Here is the current inventory:

```text
Dashboard
▼ Sales Hub              (4 items, "Business Opportunities" expands to 6 more)
▼ Work Management        (2 items)
▼ Meetings               (5 items)
▼ Knowledge              (3 items)
▼ Strategy (EOS)         (6 items)  — owner-only
▼ Operations             (3 items)
▼ System & Tools         (3 items)
                         ─────────
                         ~28-34 links visible on load
```

Compare to monday.com or Linear: on first load a user sees **5-8 top-level items**, not 30.

---

## Recommendations (3 changes, 1 file each)

### Change 1: Collapse all groups by default — expand only the active one

**Current behavior:** All groups start expanded (`acc[group.id] = true`).
**Proposed:** On load, only the group containing the current route is expanded. All others are collapsed. User overrides persist in localStorage as they do today.

This alone cuts visible items from ~30 to ~8 on any given page.

**File:** `src/components/layout/AppSidebar.tsx` (lines 122-132)
- Change the default initializer from `true` for every group to `false`, then set the group containing the active route to `true`.

---

### Change 2: Remove duplicate and developer-only items from front-end nav

Several items are duplicated or not useful to end users:

| Item | Issue | Action |
|------|-------|--------|
| **Feedback** | Appears in both "Operations" AND "System & Tools" | Remove from System & Tools |
| **Sessions** | Developer/debug tool, not a user feature | Remove entirely (keep in admin) |
| **Business Opportunities sub-items** (Lead, Discovery, Estimation, Proposal) | These are just filtered views of the Deals page — the Deals page already has tabs for these stages | Remove stage sub-items; keep "Deals Dashboard" and "All Deals" only |
| **AI Match** under Meetings | Niche admin/power-user feature | Move to admin sidebar or hide behind a feature flag |

This removes ~7 items from the sidebar.

**File:** `src/shared/data/navigationStructure.ts`
- Remove "Sessions" from `system-tools`
- Remove "Feedback" from `system-tools` (keep in Operations)
- Remove individual deal stage children (Lead/Discovery/Estimation/Proposal) from Business Opportunities — the Deals page tabs handle this
- Add `agencyRoles: ["owner"]` or `adminOnly: true` to AI Match

---

### Change 3: Consolidate "System & Tools" into a minimal footer section

After removing duplicates, "System & Tools" has only "Help & Guides" left. Rather than a full nav group for one link, move it to the sidebar footer area (next to the version badge).

**File:** `src/components/layout/AppSidebar.tsx`
- Render a small "Help" icon-link in the footer section instead of a full group
- Remove the `system-tools` group from `navigationStructure.ts`

---

## Result

After all three changes, the CEO's sidebar on load looks like:

```text
Dashboard
► Sales Hub                    (collapsed)
► Work Management              (collapsed)
▼ Strategy (EOS)               (expanded — current page)
    EOS Hub
    V/TO
    OKRs                       ← active
    Issues
    Scorecard
    Accountability
► Meetings                     (collapsed)
► Knowledge                    (collapsed)
► Operations                   (collapsed)
─────────────────
Help  |  v1.0.0 - Enterprise
```

**~10 visible items** vs. the current ~30. Clicking any collapsed group expands it (and the choice persists).

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/shared/data/navigationStructure.ts` | Remove Sessions, duplicate Feedback, deal stage sub-items, system-tools group. Restrict AI Match visibility. |
| `src/components/layout/AppSidebar.tsx` | Default groups to collapsed (expand only active). Move Help link to footer. |

No database changes. No new dependencies. No route changes.

