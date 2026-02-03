# Business Development — Module Blueprint

## Overview

The Business Development module handles sales and relationship management: Deals (pipeline with stage transitions), Clients, and Contacts.

## Module Name

`Business Development` (in `app_modules` and navigation, slug: `business-dev`)

## Routes Owned

From `src/modules/business-dev/routes.tsx`:

```
/clients                       → Client listing
/clients/new                   → Create client (legacy ClientForm)
/clients/:id                   → Client detail
/clients/:id/edit              → Edit client (legacy ClientForm)
/deals                         → Deals pipeline
/deals/new                     → Create deal
/deals/:slug                   → Deal detail
/deals/:slug/edit              → Edit deal
/contacts                      → Contacts listing
/contacts/:id                  → Contact detail
```

---

## File Inventory

### Pages (5 files in `src/modules/business-dev/pages/`)

| File | Purpose | Route |
|------|---------|-------|
| `DealsPage.tsx` | Deals pipeline view | `/deals` |
| `DealFormPage.tsx` | Create/edit deal form | `/deals/new`, `/deals/:slug/edit` |
| `DealDetailPage.tsx` | Deal detail with tabs | `/deals/:slug` |
| `ContactsPage.tsx` | Contacts listing | `/contacts` |
| `ContactDetailPage.tsx` | Contact detail | `/contacts/:id` |

Legacy pages in `src/pages/` (used by module routes):

| File | Purpose | Route |
|------|---------|-------|
| `Clients.tsx` | Client listing | `/clients` |
| `ClientForm.tsx` | Create/edit client | `/clients/new`, `/clients/:id/edit` |
| `ClientDetail.tsx` | Client detail | `/clients/:id` |

### Components

No module-specific components directory. UI is built directly in the page files.

### Hooks (2 files in `src/modules/business-dev/hooks/`)

| Hook | Purpose | Tables Queried |
|------|---------|----------------|
| `useDeals.ts` | Deal CRUD, pipeline management, stage transitions | `deals`, `deal_activities` |
| `useContacts.ts` | Contact CRUD | `contacts` |

### Edge Functions

No edge functions are invoked directly from the Business Dev module.

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `deals` | Deal records (title, stage, value, client_id, owner_id) |
| `deal_activities` | Deal activity log (stage changes, notes) |
| `clients` | Client records |
| `client_contacts` | Client contact associations |
| `contacts` | Contact records |

## Cross-Module Dependencies

**Depends on:** Platform Core (auth, layouts, UI)
**Used by:**
- Meetings (`useClientMeetings`, `useDealMeetings` from meetings module)
- Projects (projects reference `client_id`)

## Implementation Status

| Component | Status |
|-----------|--------|
| DealsPage pipeline view | Done |
| Deal CRUD + stage transitions | Done |
| Deal activity logging | Done |
| DealDetailPage | Done |
| ContactsPage listing | Done |
| ContactDetailPage | Done |
| Client listing (legacy) | Done |
| Client detail (legacy) | Done |

### Pending

- Contact edit/update page
- HubSpot CRM sync
- Email automation
- AI deal scoring
- Lead follow-up workflow
