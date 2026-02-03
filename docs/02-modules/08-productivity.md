# Productivity — Module Blueprint

## Overview
The Productivity module tracks team and individual employee productivity metrics, provides department comparisons, pod-level analysis, and AI-powered insights. It also includes the Process documentation system (SOP library organized by category). The module supports CSV import for external productivity data and integrates with HR data for employee tracking.

## Module Names
- `Productivity` — Team metrics and tracking
- `Process` — Process documentation

## Routes Owned
```
/productivity                           → Productivity main dashboard
/productivity/actions                   → Productivity actions
/productivity/employee/:email           → Employee detail
/productivity/employee                  → Redirect to /productivity
/employee/:email                        → Employee detail (direct)

Process:
/process                                → Process documentation index
/process/:category                      → Process category listing
/process/:category/:slug                → Process detail

Admin:
/admin/team/employees                   → Employee management
/admin/team/employees/:email            → Admin employee detail
/admin/productivity-import              → Productivity CSV import
/admin/agents/productivity-digest       → Productivity digest agent
```

## File Inventory

### Pages (13 files)
- src/pages/Productivity.tsx — Main productivity dashboard
- src/pages/ProductivityActions.tsx — Productivity actions
- src/pages/PodProductivityDetail.tsx — Pod-level detail
- src/pages/EmployeeDetail.tsx — Employee detail view
- src/pages/admin/EmployeeManagement.tsx — Admin employee list
- src/pages/admin/EmployeeDetail.tsx — Admin employee detail
- src/pages/admin/ProductivityImport.tsx — CSV import
- src/pages/admin/agents/ProductivityDigestAgent.tsx — Digest agent
- src/pages/Process.tsx — Process documentation hub
- src/pages/process/ProcessIndex.tsx — Process index
- src/pages/process/ProcessCategory.tsx — Category listing
- src/pages/process/ProcessDetail.tsx — Process detail
- src/pages/admin/ProcessingQueue.tsx — Processing queue

### Components — productivity/ (25 files)
- AdvancedFilters.tsx — Advanced filter panel
- AttendancePatternCard.tsx — Attendance patterns
- ConsistencyRanking.tsx — Performance consistency
- ConsistentPerformers.tsx — Top consistent performers
- DepartmentBarChart.tsx — Department chart
- DepartmentComparisonMatrix.tsx — Department comparison
- DepartmentDetailCard.tsx — Department detail
- DepartmentTrendsChart.tsx — Department trends
- EmployeeDepartmentComparison.tsx — Employee vs department
- EmployeeDetailModal.tsx — Quick employee view
- EmployeeListing.tsx — Employee list
- EmployeeProductivityChart.tsx — Individual chart
- EmployeeWeeklyBreakdown.tsx — Weekly breakdown
- EnhancedFilterBar.tsx — Enhanced filters
- LocationProductivityCard.tsx — Location-based metrics
- LocationTrendsChart.tsx — Location trends
- MostImprovedEmployees.tsx — Improvement tracking
- PodsProductivityView.tsx — Pod view
- ProductivityDonutChart.tsx — Donut chart
- ProductivityHeatmap.tsx — Heatmap visualization
- ProductivityInsightsCard.tsx — AI insights
- TimeUtilizationCard.tsx — Time utilization
- TopImproversDecliners.tsx — Top improvers/decliners
- WeekSelector.tsx — Week picker
- WeeklyProductivityTrendChart.tsx — Weekly trends

### Components — employee/ (13 files)
- AIInsightHistoryCard.tsx — AI insight history
- AIProductivityInsightCard.tsx — AI productivity insights
- ComparativeAnalytics.tsx — Comparative analysis
- EmployeeActionsTab.tsx — Actions tab
- EmployeeProductivityInsights.tsx — Insights
- ManagerInfoSection.tsx — Manager info
- PerformanceSummaryCard.tsx — Performance summary
- ProductivityAlerts.tsx — Alert notifications
- TimeBreakdownChart.tsx — Time breakdown
- WeekOverWeekComparison.tsx — Week comparison
- WeekSelector.tsx — Week picker
- WeekStatusBadge.tsx — Status badge
- WeekTimeline.tsx — Timeline view

### Components — process/ (2 files)
- ProcessDocumentUploadDialog.tsx — Document upload
- ProcessCategoryUploadDialog.tsx — Category upload

### Hooks (19 files)
Productivity:
- useProductivity.ts — Main productivity data
- useProductivityAnalytics.ts — Analytics data
- usePodProductivity.ts — Pod-level productivity
- useWeeklyProductivityDigest.ts — Weekly digest

Employee:
- useEmployees.ts — Employee list
- useEmployeeDirectory.ts — Employee directory
- useEmployeeProfile.ts — Employee profile
- useEmployeeFullProfile.ts — Full employee details
- useEmployeePods.ts — Employee pod membership
- useEmployeesWithAccountability.ts — With accountability data
- useParticipantEligibleEmployees.ts — Meeting-eligible employees
- useACConnectedEmployees.ts — ActiveCollab-connected employees

Process:
- useProcesses.ts — Process documentation

Supporting:
- usePodHealth.ts — Pod health metrics
- useTeamMembers.ts — Team members
- useDepartmentSync.ts — Department sync
- useHRDataSync.ts — HR data sync
- useLeaveEvents.ts — Leave/PTO events
- useSjEmployeeCalendar.ts — Employee calendar

### Types (1 file)
- src/types/productivity.ts — Productivity types

### Edge Functions (12 functions)
Productivity:
- api-v1-productivity — Productivity API
- sync-productivity-native — Native productivity sync
- import-productivity-csv — CSV import

Team Metrics:
- team-productivity-list — Team listing
- team-productivity-metrics — Team metrics

Employee:
- api-v1-employees — Employee API
- sync-hr-employees — HR employee sync

AI & Reporting:
- generate-ai-productivity-insight — AI insights
- employee-productivity-agent — Productivity agent
- send-productivity-alert-email — Alert emails
- weekly-productivity-digest — Weekly digest

### API Endpoints
```
EMPLOYEES.BASE: 'api-v1-employees'
PRODUCTIVITY.TEAM_METRICS: 'team-productivity-metrics'
PRODUCTIVITY.IMPORT_CSV: 'import-productivity-csv'
```

## Database Tables
- `productivity_records` — Weekly productivity data per employee
- `employee_profiles` — Extended employee information
- `departments` — Department definitions
- `pods` — Pod/team definitions
- `pod_members` — Pod membership
- `leave_events` — PTO/leave tracking
- `process_documents` — Process documentation
- `process_categories` — Process categories
- `productivity_alerts` — Alert records
- `ai_productivity_insights` — AI-generated insights

## Cross-Module Dependencies
**Depends on:** Platform Core
**Used by:** Admin (employee management, productivity import)
**Optional integrations:**
- HR system (employee sync)
- EOS (employees with accountability)
- Meetings (meeting efficiency as productivity metric)

## Implementation Status (Framework Pages Built)

### Dashboard
| Component | Status | Notes |
|-----------|--------|-------|
| ProductivityPage | Done | Summary cards, department overview grid, pod breakdown panel, department utilization bar chart, attendance donut chart, filterable employee table with search/department/week filters |
| Pod Breakdown | Done | Per-pod utilization Progress bar (color-coded), efficiency %, task count, department badge, member count |
| Department Utilization Chart | Done | recharts BarChart from summary departments |
| Attendance Donut | Done | recharts PieChart with present/partial/leave/absent segments |

### Hooks
| Hook | Status | Notes |
|------|--------|-------|
| useProductivityRecords | Done | Filterable query to `productivity_records` with department/location/week/search |
| useProductivitySummary | Done | Aggregates total employees, avg utilization/efficiency, tasks completed, department breakdown |
| usePodProductivity | Done | Parallel queries to pods + pod_members + employee_profiles + productivity_records, aggregates per pod |
| useDepartments | Done | Active departments list |
| useAvailableWeeks | Done | Distinct week_start values for week selector |

### Process Documentation
| Component | Status | Notes |
|-----------|--------|-------|
| ProcessPage | QA-ready | Index / category / document views |
| ProcessFormPage | QA-ready | Create + edit process document with tags |
| useProcesses | Done | Categories, documents, CRUD operations |

### Pending
- Productivity CSV import admin page
- Employee detail historical trends
- AI productivity insights generation
- Pod health metrics and alerts

## Implementation Notes
- Productivity data imported via CSV or HR system sync
- Week-based tracking (ISO week numbers)
- Department and pod-level aggregation
- AI generates weekly productivity insights
- Location-based and attendance-based analytics
- Process documentation organized by category (Business Dev, HR, QA, etc.)
- Employee detail shows historical trends and comparisons
