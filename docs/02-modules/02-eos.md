# EOS — Module Blueprint

## Overview
The Entrepreneurial Operating System (EOS) module implements strategic planning and execution tools. It includes the Vision/Traction Organizer (V/TO), OKRs (Objectives & Key Results, replacing legacy Rocks/Goals), Scorecard for metrics, Issues tracking with AI analysis, and the Accountability Chart with GWC assessments.

## Module Name
`EOS` (in app_modules and navigation)
Related module: `OKRs` (separate module permission)

## Routes Owned
```
/eos                           → EOS hub page
/eos/vto                       → Vision/Traction Organizer
/eos/rocks                     → Rocks (legacy, being replaced by OKRs)
/eos/issues                    → Issues pod overview
/eos/issues/all                → All issues
/eos/issues/pod/:podId         → Issues by pod
/eos/issues/anonymous          → Anonymous issues
/eos/issues/ai                 → AI-powered issues
/eos/issues/ai/analyze         → AI issue analysis
/eos/issues/solved             → Solved issues
/eos/issues/archived           → Archived issues
/eos/issues/:issueId           → Issue detail
/eos/scorecard                 → Scorecard metrics
/eos/accountability            → Accountability chart
/eos/my-accountability         → Personal accountability
/okrs                          → OKRs management

Admin routes:
/admin/eos                     → Admin EOS hub
/admin/eos/vto                 → VTO admin
/admin/eos/accountability      → Accountability admin
/admin/eos/scorecards          → Scorecard workspace
/admin/eos/meetings            → EOS meetings config
/admin/eos/system              → EOS system config
/admin/eos/email-templates     → EOS email templates
/admin/import-anonymous-issues → Import anonymous issues
```

## File Inventory

### Pages (24 files)
- src/pages/EOS.tsx — Main EOS hub
- src/pages/OKRs.tsx — OKRs management
- src/pages/Vision.tsx — Vision page
- src/pages/eos/VTO.tsx — Vision/Traction Organizer
- src/pages/eos/EOSScorecard.tsx — Scorecard
- src/pages/eos/EOSRocks.tsx — Rocks (legacy goals)
- src/pages/eos/EOSAccountability.tsx — Accountability chart
- src/pages/eos/MyAccountabilityChart.tsx — Personal accountability
- src/pages/eos/EOSIssues.tsx — Issues main
- src/pages/eos/EOSIssueDetail.tsx — Issue detail
- src/pages/eos/EOSIssuesAll.tsx — All issues
- src/pages/eos/EOSIssuesSolved.tsx — Solved issues
- src/pages/eos/EOSIssuesArchived.tsx — Archived issues
- src/pages/eos/EOSIssuesAnonymous.tsx — Anonymous issues
- src/pages/eos/EOSIssuesAI.tsx — AI issues
- src/pages/eos/EOSIssuesAIAnalyze.tsx — AI analysis
- src/pages/eos/IssuesByPod.tsx — Issues by pod
- src/pages/eos/IssuesPodOverview.tsx — Pod overview
- src/pages/admin/AdminEOS.tsx — Admin hub
- src/pages/admin/AdminEOSSystem.tsx — System config
- src/pages/admin/AdminEOSAccountability.tsx — Admin accountability
- src/pages/admin/ScorecardWorkspace.tsx — Scorecard admin
- src/pages/admin/ImportAnonymousIssues.tsx — Import tool
- src/pages/admin/eos/VTOAdmin.tsx — VTO admin

### Components — Issues (src/components/eos/issues/) — 14 files
- IssueForm.tsx, IssueFormTypeSelector.tsx
- IssuesTable.tsx, IssueStatsCards.tsx, IssueDetailDialog.tsx
- IssuesTabNav.tsx, PodIssueCard.tsx, PodIssueSummary.tsx
- SubmitterLink.tsx, TriageAssistantModal.tsx
- PatternInsightsPanel.tsx, PodHealthAgentPanel.tsx
- PodHealthHistoryModal.tsx, QuarterlyDigestView.tsx

### Components — Issues AI Analyze (src/components/eos/issues/ai-analyze/) — 4 files
- DataSourcesStep.tsx, AnalysisProgressStep.tsx, ResultsReviewStep.tsx, index.ts

### Components — Issues AI Suggestions (src/components/eos/issues/ai-suggestions/) — 6 files
- AISuggestionCard.tsx, AISuggestionReviewDialog.tsx
- AIReviewQueue.tsx, AIWeeklyDigest.tsx, AISuggestionStats.tsx, index.ts

### Components — Accountability (src/components/accountability/) — 14 files
- ChartForm.tsx, ChartHistoryTimeline.tsx, ChartVersionHistory.tsx
- DepartmentAccordion.tsx, EmployeeAccountabilityModal.tsx, EmployeeCard.tsx
- GWCAssessmentDialog.tsx, GWCComparisonCard.tsx, GWCIndicators.tsx
- ManagerInfoCard.tsx, ResponsibilitiesEditor.tsx
- ResponsibilityItem.tsx, ResponsibilityReviewItem.tsx, StatusBadge.tsx

### Components — OKRs (src/components/okrs/) — 16 files
- AISuggestionsDialog.tsx, CheckInDialog.tsx, CloseOKRDialog.tsx
- ClosedOKRsTable.tsx, CreateOKRDialog.tsx, KeyResultItem.tsx
- KeyResultPerformanceCard.tsx, KeyResultProgressChart.tsx
- KeyResultSparkline.tsx, KeyResultsByOwner.tsx
- OKRCard.tsx, OKRDetailDialog.tsx, OKRHealthGrid.tsx
- OverdueMembersIndicator.tsx, TeamOKRsByPod.tsx, TrendAlertBadge.tsx

### Components — Scorecard (src/components/scorecard/) — 2 files
- MetricTrendChart.tsx, ScorecardMetricsTable.tsx

### Components — Other
- src/components/eos/ChartReviewModal.tsx

### Hooks (15 files)
- useEOS.ts — Main EOS data
- useEOSFilters.ts — Filter state
- useEOSIssues.ts — Issues CRUD
- useEOSIssueInsights.ts — Issue insights
- useEOSIssuesByPod.ts — Issues grouped by pod
- useAccountabilityCharts.ts — Chart data
- useMyAccountabilityChart.ts — Personal chart
- useEmployeesWithAccountability.ts — Employee accountability
- useAIIssueSuggestions.ts — AI suggestions
- usePromoteIssueToEOS.ts — Promote to EOS
- useScorecard.ts — Scorecard data
- useScorecardAdmin.ts — Admin scorecard
- useVTOAdmin.ts — VTO admin
- useOKRPermissions.ts — OKR permissions
- useProjectAIIssues.ts — Project AI issues

### Types (3 files)
- src/types/accountability.ts — GWCAssessment, ResponsibilityWithGWC, ChartFormData
- src/types/okr.ts — OKR types
- src/types/ai-issue-suggestions.ts — AIIssueSuggestion, AIReviewStatus, ConfidenceLevel

### Utilities
- src/utils/okrHelpers.ts — OKR helper functions

### Edge Functions (12 functions)
- supabase/functions/extract-meeting-issues/ — Extract issues from meetings
- supabase/functions/extract-project-issues/ — Extract issues from projects
- supabase/functions/import-pod-issues/ — Import pod issues
- supabase/functions/import-anonymous-issues/ — Import anonymous issues
- supabase/functions/suggest-okrs/ — OKR suggestion engine
- supabase/functions/analyze-okr-progress/ — OKR progress analysis
- supabase/functions/accountability-charts/ — Chart operations
- supabase/functions/eos-triage-assistant/ — Issue triage
- supabase/functions/eos-pod-health-analyzer/ — Pod health analysis
- supabase/functions/eos-pattern-detective/ — Pattern detection
- supabase/functions/eos-quarterly-digest/ — Quarterly reporting
- supabase/functions/_shared/accountability-email.ts — Email template

### API Endpoints (from config/api.ts)
```
EOS.GOALS: 'api-v1-eos/goals'
EOS.ROCKS: 'api-v1-eos/rocks'
EOS.ISSUES: 'api-v1-eos/issues'
EOS.VTO: 'api-v1-eos/vto'
EOS.SCORECARDS: 'api-v1-eos/scorecards'
OKRS.BASE: 'api-v1-okrs'
OKRS.KEY_RESULTS: 'api-v1-okrs/:id/key-results'
OKRS.UPDATES: 'api-v1-okrs/:id/updates'
OKRS.SUMMARY: 'api-v1-okrs/summary'
```

## Database Tables
- `eos_goals` / `eos_rocks` — Strategic goals (legacy, being replaced by OKRs)
- `okrs` — Objectives with key results
- `okr_key_results` — Key results linked to OKRs
- `okr_check_ins` — Check-in history
- `eos_issues` — Issues tracking
- `eos_issue_suggestions` — AI-generated suggestions
- `eos_scorecards` — Scorecard definitions
- `eos_scorecard_metrics` — Scorecard metric entries
- `accountability_charts` — Organization charts
- `accountability_responsibilities` — Role responsibilities
- `gwc_assessments` — GWC (Get it, Want it, Capacity) assessments
- `eos_vto` — V/TO content

## Cross-Module Dependencies
**Depends on:** Platform Core (auth, layouts, UI)
**Used by:** Admin (EOS admin pages)
**Optional integrations:**
- Meetings → extract-meeting-issues extracts issues from meeting transcripts
- Projects → extract-project-issues extracts issues from projects

## Implementation Status

### Built (Sprint 1 — Admin Pages)
- **AdminEOS** (`src/pages/admin/eos/AdminEOS.tsx`) — Hub page with section cards (VTO, Scorecard, Accountability, System Config, Import Issues)
- **VTOAdmin** (`src/pages/admin/eos/VTOAdmin.tsx`) — VTO section table with edit title, reset to default template, content preview
- **ScorecardWorkspace** (`src/pages/admin/eos/ScorecardWorkspace.tsx`) — Full CRUD for scorecards and metrics (type, target, unit, goal direction)
- **AdminEOSAccountability** (`src/pages/admin/eos/AdminEOSAccountability.tsx`) — Chart version management (publish/archive), role CRUD with department and responsibilities

### Admin Routes Registered
- `/admin/eos` → AdminEOS hub
- `/admin/eos/vto` → VTOAdmin
- `/admin/eos/scorecards` → ScorecardWorkspace
- `/admin/eos/accountability` → AdminEOSAccountability

### Admin Navigation
- Added EOS group to `navigationStructure.ts` adminNavigation with 4 items

## Implementation Notes
- OKRs replace the legacy Rocks/Goals system
- Issues have AI-powered triage, pattern detection, and suggestion features
- Accountability uses GWC (Get it, Want it, Capacity) assessment framework
- Pod-based issue organization (issues belong to pods/teams)
- Scorecard tracks key metrics with trend visualization
- V/TO stores the company's vision and traction strategy
