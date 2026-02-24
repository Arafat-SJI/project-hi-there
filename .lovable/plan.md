

# Restructure Business Development Navigation

## Overview
Clean up the Business Development sidebar navigation to be clearer and more intuitive, following standard CRM conventions.

## Changes

### Before → After

```text
Business Development              Sales & CRM
├── Clients (header)              ├── Companies          → /clients
│   ├── All Clients               ├── Contacts           → /contacts
│   └── Active Clients            ├── Deals              → /deals
├── All Deals                     │   ├── Lead
│   ├── Lead                      │   ├── Discovery
│   ├── Discovery                 │   ├── Qualified
│   ├── Qualified                 │   ├── Estimation
│   ├── Estimation                │   └── Proposal
│   └── Proposal                  └── Lead Follow-Up     → /lead-followup
├── Contacts
└── Lead Follow-Up
```

### Key decisions
- "Clients" renamed to "Companies" (with `Building2` icon) -- broader term, not every company is a client yet
- Remove the "All Clients" / "Active Clients" sub-items -- use page-level filters instead
- "All Deals" simplified to "Deals" -- the "All" prefix is redundant
- Group title: "Business Development" → "Sales & CRM" -- shorter, industry-standard
- Contacts moves to position 2 (right after Companies) for logical grouping (companies → people at those companies)
- Lead Follow-Up stays last as a distinct workflow

## Technical Details

### File to modify
**`src/shared/data/navigationStructure.ts`** (lines 50-97)

Update the first `navigationGroups` entry:

1. Change group `title` from `"Business Development"` to `"Sales & CRM"`
2. Replace the "Clients" item (with `headerOnly` and children) with a flat "Companies" item using `Building2` icon
3. Move "Contacts" to position 2
4. Rename "All Deals" to "Deals" (keep its pipeline stage children)
5. "Lead Follow-Up" stays at position 4

No route changes needed -- all URLs (`/clients`, `/contacts`, `/deals`, `/lead-followup`) remain the same. This is a labels-and-order-only change.
