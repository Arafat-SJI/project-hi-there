# Business Development — Module Blueprint

## Overview
The Business Development module is the second-largest module, consolidating all sales and relationship management: Deals/Business Opportunities (pipeline with stages), Lead Follow-Up, Contacts, Clients, Email (Gmail + SendGrid), and HubSpot CRM integration. It provides full deal lifecycle from lead through proposal to won/lost.

## Module Names
Multiple navigation modules map to this:
- `Business Opportunities` — Deals pipeline
- `Business Development` — BD rep tools (My BD Deals, BD Dashboard)
- `Clients` — Client management
- `Lead Follow-Up` — Lead tracking
- `Contacts` — Contact management

## Routes Owned
```
Deals:
/business-opportunities                      → All deals listing
/business-opportunities/dashboard            → Deals dashboard
/business-opportunities/deals                → Deals listing (alias)
/business-opportunities/deals/:slug          → Deal detail
/business-opportunities/deals/:slug/:tab     → Deal detail tab
/business-opportunities/deals/:slug/:tab/:agentSlug → Deal with agent
/business-opportunities/deals/:slug/ai-chat  → Deal AI chat
/business-opportunities/deals/:slug/email-draft-step1 → Email draft step 1
/business-opportunities/deals/:slug/email-draft-step2 → Email draft step 2
/business-opportunities/deals/:slug/edit     → Edit deal
/business-opportunities/deals/:slug/convert-to-win → Convert to win
/business-opportunities/create-deal          → Create deal
/business-opportunities/lead                 → Stage: Lead
/business-opportunities/discovery            → Stage: Discovery
/business-opportunities/estimation           → Stage: Estimation
/business-opportunities/proposal             → Stage: Proposal
/business-opportunities/lost                 → Stage: Lost
/business-opportunities/leads               → Business opportunity leads
/my-deals                                    → My deals
/my-deals/stats                              → My deals stats
/my-bd-deals                                 → My BD deals
/bd-dashboard                                → BD rep dashboard

Clients:
/clients                                     → Client listing
/clients/active                              → Active clients
/clients/:slug                               → Client detail
/communication-coach                         → Communication coach

Lead Follow-Up:
/lead-followup                               → Lead follow-up list
/lead-followup/:contactSlug                  → Contact detail
/lead-followup/:contactSlug/email-draft      → Email draft
/lead-followup/:contactSlug/email-draft-step1 → Email step 1
/lead-followup/:contactSlug/email-draft-step2 → Email step 2
/lead-followup/:contactSlug/sync             → HubSpot sync
/lead-followup/:contactSlug/communication    → Communication history
/lead-followup/:contactSlug/analyze          → Analysis
(Also /lead-follow-up/* as aliases)

Contacts:
/contacts                                    → Contacts listing

Email:
/emails                                      → Email inbox
/emails/rules                                → Email rules

Admin:
/admin/data-sync/hubspot                     → HubSpot sync
/admin/data-sync/hubspot/progress/:queueId   → Sync progress
/admin/data-sync/hubspot/matching            → Deal matching
/admin/data-sync/hubspot/cleanup             → Client cleanup
/admin/integrations/hubspot                  → HubSpot integration
/admin/agents/deal-coaching                  → Deal coaching analytics
/admin/agents/email-drafting                 → Email drafting performance
/admin/email-templates                       → Email templates
/admin/test-email                            → Test email
```

## File Inventory

### Pages (42 files)
Deals:
- src/pages/BusinessOpportunities.tsx, MyDeals.tsx, MyBdDeals.tsx
- src/pages/DealsDashboard.tsx, MyDealsStats.tsx, BdRepDashboard.tsx
- src/pages/business/BusinessOpportunityLeads.tsx, CreateDealPage.tsx, EditDealPage.tsx
- src/pages/business/StageDealsLead.tsx, StageDealsDiscovery.tsx, StageDealsEstimation.tsx
- src/pages/business/StageDealsProposal.tsx, StageDealsLost.tsx, ConvertToWinPage.tsx
- src/pages/deals/DealDetailPage.tsx, DealAIChatPage.tsx
- src/pages/deals/DealEmailDraftStep1.tsx, DealEmailDraftStep2.tsx

Clients:
- src/pages/Clients.tsx, ActiveClients.tsx, ClientDetail.tsx
- src/pages/client/EnhancedClientDashboard.tsx
- src/pages/KnowledgeClientDetail.tsx, CommunicationCoach.tsx

Contacts:
- src/pages/Contacts.tsx

Leads:
- src/pages/LeadFollowUp.tsx, LeadFollowUpAnalyze.tsx
- src/pages/LeadFollowUpCommunication.tsx, LeadFollowUpContactDetail.tsx
- src/pages/LeadFollowUpEmailDraft.tsx, LeadFollowUpEmailDraftStep1.tsx
- src/pages/LeadFollowUpEmailDraftStep2.tsx, LeadFollowUpHubSpotSync.tsx

Email:
- src/pages/EmailRules.tsx, EmailInbox.tsx

Admin:
- src/pages/admin/HubSpotDealMatching.tsx, HubSpotSync.tsx, HubSpotSyncProgress.tsx
- src/pages/admin/data-sync/HubSpotClientCleanup.tsx
- src/pages/admin/agents/DealCoachingAnalytics.tsx, EmailDraftingPerformance.tsx
- src/pages/admin/EmailTemplates.tsx, TestEmail.tsx

### Components (134 files across 10 directories)
business-opportunity/ (33): DealFilters, DealAnalytics, EnhancedDealCard, FilterPresets, ConversionFunnelChart, etc.
deals/ (36 + ai-chat/4 + ai-hub/3): DealOverview, DealForm, DealComments, DealEngagementsList, DealCoachPanel, StageDealsView, etc.
clients/ (16): ClientsTable, ClientFormDialog, ClientFullDetails, DocumentList, SyncStatusBadge, etc.
contacts/ (2): ImportLeadFollowupsDialog, InlineAssigneeSelect
contact-detail-tabs/ (8): ContactAISummary, DealsTab, HubSpotActivitiesTab, MeetingContextTab, etc.
followup/ (18): ScheduledEmailsList, EmailHistory, EmailComposeModal, FollowUpStatusBadge, LeadScoreBadge, NextBestAction, etc.
email/ (4): EmailSuccessIntelligence, EmailDebugPanel, EmailContextPanel, EmailSchedulePicker
gmail/ (5): EmailRuleEditor, EmailMatchBadge, EmailListItem, EmailFilters, KBQuotaCard
hubspot/ (8): DealsProgressMonitor, SyncProgressMonitor, HubSpotSyncButton, HubSpotRevenueProjection, etc.
admin/hubspot/ (11): BulkDealSyncCard, FullSyncCard, ImportDealByUrlCard, DataHealthCard, etc.

### Hooks (68 files)
Deals (21): useDeals, useAdvancedDeals, useDealEngagements, useDealMeetings, useDealDriveFiles, useDealDuplicates, useDealAIScore, useDealCoach, useDealCoachingMemory, useDealChatSessions, useDealChatContext, useDealQuickEmail, useDealKnowledgeSync, useDealsWithRecentComments, useDealStageCounts, useDealMatching, useUpdateDealField, useDealSyncQueue, useSyncAllDeals, useBulkDealSync, useCleanupUnlinkedDeals

Clients (9): useClients, useClientMeetings, useClientAccess, useClientResearch, useClientAggregates, useClientEmails, useClientCommunicationCoach, useClientsWithKnowledge, useClientDocuments

Contacts (11): useContacts, useContactMeetings, useContactPermissions, useContactActivities, useContactCommunicationPaginated, useContactCommunicationHistory, useContactResearch, useContactEmbeddings, useContactAISummary, useContactLinkedInFromDeals, useContactMeetingSearch

Leads (4): useLeadAnalysis, useLeadAnalysisHistory, useLeadFollowUpSettings, useUpdateContactFollowUp

Email (10): useSendEmail, useScheduleEmail, useScheduledEmails, useEmailTemplates, useEmailRules, useEmailHistory, useEmailChatSession, useGmailEmails, useEmailMemory, useEmailPerformanceInsights

HubSpot (9): useHubSpot, useHubSpotQueue, useHubSpotDealsQueue, useHubSpotContactData, useHubSpotFullSync, useHubSpotSyncLogs, useHubSpotDataHealth, useHubSpotContactsQueue, useSyncHubSpotActivities

AI (1): useAIClientMatcher

Memory (3): memory/useDealMemory, memory/useEmailMemory, memory/useDealInheritance

### Types (1 file)
- src/types/deals.ts — Deal, DealFilters, DealClient, FilterPreset

### API (1 file)
- src/api/DealChecklistApi.ts

### Utilities (4 files)
- src/lib/deal-utils.ts, src/lib/deals/calculateDealHealth.ts
- src/lib/deals/resolveContactFromDeal.ts, src/lib/hubspot.ts
- src/lib/ai-agents/client-call-analyzer-agent.ts

### Edge Functions (75+ functions)
HubSpot Sync (19): hubspot-sync-deals, hubspot-sync-contacts, hubspot-sync-companies, hubspot-sync-owners, hubspot-sync-deal-companies, hubspot-process-sync-batch, hubspot-process-single-deal, hubspot-process-deals-batch, hubspot-sync-all-deals, hubspot-prepare-deal-sync-queue, hubspot-bulk-process-deal, hubspot-bulk-prepare-queue, hubspot-deals-cron, hubspot-deals-by-stage, hubspot-latest-deals, hubspot-get-pipeline, etc.

HubSpot Company (5): hubspot-link-deals-to-clients, hubspot-link-existing, hubspot-cleanup-clients-without-deals, hubspot-search-companies, hubspot-backfill-company-ids

HubSpot Management (9): hubspot-pause-sync, hubspot-resume-sync, hubspot-cancel-sync, hubspot-full-sync, hubspot-test-connection, hubspot-import-deal-by-url, hubspot-data-assessment, hubspot-diagnose-counts, hubspot-revenue-projection

Deal (5): delete-deal, cleanup-unlinked-deals, match-deal-to-client, on-deal-won-orchestrator, ai-score-deal

Deal Communication (6): deal-coach, deal-ai-chat, quick-deal-email, send-deal-assignment-notification, send-deal-comment-notification, send-deal-won-notifications

Deal Documents (4): deal-drive-list-files, deal-drive-sync-selected, google-drive-create-deal-folder, index-client-document

Client/Contact (10): api-v1-clients, api-v1-contacts, api-v1-leads, api-v1-leads-bulk, create-client-access, log-client-email, extract-contacts, client-communication-coach, client-dashboard-api, client-documents

Lead Follow-Up (2): lead-followup-research, auto-update-follow-up-statuses

Email (8): send-email, process-scheduled-emails, send-client-weekly-update, gmail-ingest-emails, email-tracking, apply-email-rules, ai-insights-by-email, etc.

### API Endpoints
```
CLIENTS.BASE: 'api-v1-clients'
CONTACTS.BASE: 'api-v1-contacts'
DEALS.BASE: 'api-v1-deals'
LEADS.BASE: 'api-v1-leads'
LEADS.BULK: 'api-v1-leads-bulk'
HUBSPOT.SYNC_DEALS: 'hubspot-sync-deals'
HUBSPOT.SYNC_COMPANIES: 'hubspot-sync-companies'
HUBSPOT.SYNC_CONTACTS: 'hubspot-sync-contacts'
... (20+ endpoints)
```

## Database Tables
- `deals` — Deal records (stages: lead, discovery, estimation, proposal, won, lost)
- `deal_activities` — Activity timeline
- `deal_comments` — Deal comments
- `deal_documents` — Attached documents
- `deal_engagements` — Communication engagements
- `deal_checklists` — Deal checklists
- `clients` — Client records
- `client_contacts` — Client contacts
- `client_documents` — Client documents
- `contacts` — Contact records
- `contact_communications` — Communication history
- `lead_followup_contacts` — Lead follow-up tracking
- `scheduled_emails` — Scheduled email queue
- `email_rules` — Email filtering rules
- `hubspot_sync_queue` — HubSpot sync queue
- `hubspot_sync_logs` — Sync history

## Cross-Module Dependencies
**Depends on:** Platform Core, Meetings (deal/client meetings)
**Used by:** Projects (source deals, client access), Knowledge Base (deal knowledge), Admin (HubSpot settings)
**Integrations:** HubSpot (CRM sync), Gmail (email ingestion), SendGrid (email sending), Google Drive (deal folders)

## Implementation Status (Framework Pages Built)

### Deal Pipeline
| Component | Status | Notes |
|-----------|--------|-------|
| DealsPage | Done | Pipeline board view with stage columns and deal cards |
| DealDetailPage | Done | Full deal detail with tabs, stage progression, activity timeline |
| useDeals | Done | Core CRUD + stage counts + filtering |
| useUpdateDealStage | Done | Stage mutation with automatic `deal_activities` logging (from/to stage, won/lost description) |
| useDealActivities | Done | Activity timeline query for deal detail |
| ConvertToWinPage | Done | Deal-to-project conversion flow |

### Pending
- HubSpot bidirectional sync wiring
- AI deal scoring integration
- Deal coaching memory persistence
- Email drafting with AI

## Implementation Notes
- Deal pipeline: Lead → Discovery → Estimation → Proposal → Won/Lost
- HubSpot sync is bidirectional (queue-based with retry)
- AI features: deal scoring, deal coaching, email drafting
- Communication coach provides AI-powered client communication
- Email supports drafting with AI, scheduling, and tracking
- Deal-to-project conversion via ConvertToWinPage
- Client portal provides token-based external access
