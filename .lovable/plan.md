

## Plan: Seed HubSpot Demo Data for Sales Hub

### What This Does

Inserts realistic HubSpot-sourced test data so the full Sales Hub flow works end-to-end:
- **List pages** show the "Source" column with orange HubSpot badges
- **Detail pages** show the DataSourceBadge card with "View in HubSpot" button (links to mock HubSpot URLs)
- **CrmConnectionBanner** appears at the top of Contacts/Deals pages

### Data to Seed

**2 HubSpot Clients:**

| Client | Company | Synced |
|--------|---------|--------|
| Acme Corp | Acme Corporation | 2 hours ago |
| NovaTech Solutions | NovaTech Solutions Inc. | 45 min ago |

**4 HubSpot Contacts** (linked to clients):

| Contact | Title | Client |
|---------|-------|--------|
| Marcus Chen | VP of Engineering | Acme Corp |
| Sarah Winters | Head of Product | Acme Corp |
| Derek Patel | CTO | NovaTech |
| Emily Nakamura | Director of Operations | NovaTech |

**3 HubSpot Deals** (linked to clients + contacts):

| Deal | Stage | Value | Client |
|------|-------|-------|--------|
| Acme — Enterprise Platform License | proposal | $120,000 | Acme Corp |
| NovaTech — Pilot Program | qualified | $36,000 | NovaTech |
| Acme — AI Analytics Module | discovery | $45,000 | Acme Corp |

### Technical Details

- All records have `data_source = 'hubspot'`, realistic `external_id` values, and `external_url` pointing to mock HubSpot URLs (`https://app.hubspot.com/contacts/12345678/...`)
- `last_synced_at` set to recent timestamps so the "Synced X ago" text looks natural
- Contacts have `linkedin_url`, `title`, `company` filled out for rich detail pages
- Deals have `probability`, `expected_close_date`, and `description` for realistic pipeline view
- All records use `ON CONFLICT DO NOTHING` for idempotency
- `created_by` / `owner_id` set to the admin user

### Implementation

Single migration file with INSERT statements for all 9 records (2 clients + 4 contacts + 3 deals).

### Demo Flow After Seeding

1. Navigate to **Companies** → see "Acme Corp" and "NovaTech" with orange HubSpot badges in Source column
2. Click **Acme Corp** → detail page shows card: "From HubSpot · Last synced: [time]" + "View in HubSpot" button
3. Navigate to **Contacts** → see 4 HubSpot contacts with badges
4. Click **Marcus Chen** → detail shows HubSpot source card + "View in HubSpot"
5. Navigate to **Deals** → see 3 HubSpot deals with badges in pipeline
6. Click **Acme — Enterprise Platform License** → deal detail with HubSpot badge + deep link

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Insert 2 clients, 4 contacts, 3 deals with HubSpot data |

