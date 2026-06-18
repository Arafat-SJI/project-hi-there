## Final plan — Knowledge Base admin consolidation (Option A)

Collapse 5 pages → **3 top-level items** under the Knowledge Base section. Sub-pages live as in-page **tabs only** (no sidebar sub-menu duplication, since they're already nested under Knowledge Base).

### New structure

```
Knowledge Base (sidebar group)
├── Dashboard               /admin/knowledge/dashboard
├── Content                 /admin/knowledge/content    (tabs: Categories | Files)
└── Access & Testing        /admin/knowledge/access     (tabs: Permissions | Playground)
```

### Changes

1. **New page** `src/pages/admin/KnowledgeContent.tsx`
   - shadcn `Tabs` with `?tab=categories|files` URL sync
   - Renders existing `<KnowledgeCategories />` and `<KnowledgeFiles />` unchanged

2. **New page** `src/pages/admin/KnowledgeAccess.tsx`
   - shadcn `Tabs` with `?tab=permissions|playground` URL sync
   - Renders existing `<KnowledgePermissions />` and `<KnowledgePlayground />` unchanged

3. **`src/modules/admin/routes.tsx`**
   - Add: `/admin/knowledge/content`, `/admin/knowledge/access`
   - Redirect: `/categories` → `/content?tab=categories`, `/files` → `/content?tab=files`, `/permissions` → `/access?tab=permissions`, `/playground` → `/access?tab=playground`

4. **`src/shared/data/navigationStructure.ts`**
   - Knowledge Base children become: `Dashboard`, `Content`, `Access & Testing` (drop the 4 old entries)

5. **No deletions** of the original page files — they're reused as tab contents. No DB, hooks, or business-logic changes.

### Test
- Visit `/admin/knowledge/content` → Categories tab renders, switch to Files tab.
- Visit `/admin/knowledge/access` → Permissions tab renders, switch to Playground tab.
- Old URLs redirect with correct tab pre-selected.
- Sidebar shows 3 items under Knowledge Base.
