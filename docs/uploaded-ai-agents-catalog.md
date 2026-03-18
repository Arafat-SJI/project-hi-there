# AI Agents Catalog — SJ Innovation Control Tower

> **Version:** 1.0 | **Last Updated:** March 17, 2026  
> **Purpose:** Complete reference of all AI agents for replication in other Control Tower instances.

---

## Table of Contents

1. [Sales & CRM Agents](#1-sales--crm-agents)
2. [Meetings & Communication Agents](#2-meetings--communication-agents)
3. [Project Management Agents](#3-project-management-agents)
4. [Task Agents](#4-task-agents)
5. [EOS Agents](#5-eos-entrepreneurial-operating-system-agents)
6. [Team & Productivity Agents](#6-team--productivity-agents)
7. [Knowledge & Research Agents](#7-knowledge--research-agents)
8. [HR & Operations Agents](#8-hr--operations-agents)
9. [Integration / Sync Agents](#9-integration--sync-agents)
10. [Data Source Registry](#10-data-source-registry)
11. [Data Source Presets](#11-data-source-presets)
12. [Architecture Notes](#12-architecture-notes)

---

## 1. Sales & CRM Agents

### 1.1 Deal Coach
| Field | Value |
|-------|-------|
| **Slug** | `deal-coach` |
| **Category** | Sales & CRM |
| **Description** | Provides strategic coaching and recommendations for active deals based on pipeline data, client history, and deal stage. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI (via Lovable AI Gateway) |
| **Data Sources** | `deals`, `clients`, `contacts`, `client_research` |
| **Trigger** | Manual (user-initiated from Deal detail page) |
| **Edge Function** | `run-ai-agent` |

### 1.2 Deal AI Chat
| Field | Value |
|-------|-------|
| **Slug** | `deal-ai-chat` |
| **Category** | Sales & CRM |
| **Description** | Conversational AI assistant for deal analysis, answering questions about deal context, history, and strategy. |
| **Primary Model** | Gemini 2.5 Flash |
| **Provider** | Google AI |
| **Data Sources** | `deals`, `clients`, `contacts`, `client_meetings` |
| **Trigger** | Manual (chat interface on Deal page) |
| **Edge Function** | `run-ai-agent` |

### 1.3 Deal Daily Briefing
| Field | Value |
|-------|-------|
| **Slug** | `deal-daily-briefing` |
| **Category** | Sales & CRM |
| **Description** | Generates daily deal summaries with key updates, stage changes, and action items for sales teams. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `deals`, `clients`, `contacts` |
| **Trigger** | Manual / Scheduled |
| **Edge Function** | `deal-daily-briefing` |

### 1.4 Quick Deal Email
| Field | Value |
|-------|-------|
| **Slug** | `quick-deal-email` |
| **Category** | Sales & CRM |
| **Description** | Generates rapid email drafts in context of a specific deal, pulling relevant deal data and client info. |
| **Primary Model** | Gemini 2.5 Flash |
| **Provider** | Google AI |
| **Data Sources** | `deals`, `clients`, `contacts` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 1.5 Email Draft Generator
| Field | Value |
|-------|-------|
| **Slug** | `email-draft-generator` |
| **Category** | Sales & CRM |
| **Description** | Relationship-aware email drafting that considers client history, previous communications, and contact preferences. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `deals`, `clients`, `contacts`, `client_meetings`, `client_research` |
| **Trigger** | Manual |
| **Edge Function** | `generate-email-draft` |

### 1.6 Lead Follow-Up Research
| Field | Value |
|-------|-------|
| **Slug** | `lead-followup-research` |
| **Category** | Sales & CRM |
| **Description** | Gathers lead intelligence using Perplexity AI for contact and company research before follow-up outreach. |
| **Primary Model** | Perplexity AI (sonar) |
| **Provider** | Perplexity |
| **Data Sources** | `contacts`, `lead_follow_up_contacts`, `client_research` |
| **Trigger** | Manual |
| **Edge Function** | `lead-followup-research` |
| **Notes** | Uses 4-tier progressive fallback search strategy. Results cached in `client_research` table. Freshness: 30d company, 60d social, 7d news. |

### 1.7 Company Research
| Field | Value |
|-------|-------|
| **Slug** | `company-research` |
| **Category** | Sales & CRM |
| **Description** | Deep company research with 4-tier fallback: (1) Domain-filtered + month recency, (2) No domain + month, (3) No domain + year, (4) Plain name fallback. |
| **Primary Model** | Perplexity AI (sonar) |
| **Provider** | Perplexity |
| **Data Sources** | `clients`, `client_research` |
| **Trigger** | Manual |
| **Edge Function** | `company-research` |
| **Notes** | Results validated for substantive content. Failure diagnostics persisted to DB. |

### 1.8 LinkedIn / Contact Research
| Field | Value |
|-------|-------|
| **Slug** | `contact-research` |
| **Category** | Sales & CRM |
| **Description** | Contact intelligence gathering via Perplexity AI — LinkedIn profiles, professional history, and social presence. |
| **Primary Model** | Perplexity AI (sonar) |
| **Provider** | Perplexity |
| **Data Sources** | `contacts`, `client_research` |
| **Trigger** | Manual |
| **Edge Function** | `contact-research` |

### 1.9 Lovable Prototype Builder
| Field | Value |
|-------|-------|
| **Slug** | `lovable-prototype-builder` |
| **Category** | Sales & CRM |
| **Description** | Generates client-facing prototype specifications from deal context, enabling rapid prototype creation. |
| **Primary Model** | Claude 4.5 Sonnet / Gemini 3.0 |
| **Provider** | Anthropic / Google AI |
| **Data Sources** | `deals`, `clients` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 1.10 SOW Generation Agent
| Field | Value |
|-------|-------|
| **Slug** | `sow-generator` |
| **Category** | Sales & CRM |
| **Description** | Statement of Work generation with PDF export capability. Pulls deal data, project scope, and client info. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `deals`, `clients`, `projects` |
| **Trigger** | Manual |
| **Edge Function** | `generate-sow` |

---

## 2. Meetings & Communication Agents

### 2.1 Meeting Intelligence Agent
| Field | Value |
|-------|-------|
| **Slug** | `meeting-intelligence` |
| **Category** | Meetings |
| **Description** | Analyzes meeting transcripts for issue extraction, action items, decisions, and sentiment analysis. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `zoom_files`, `meetings_v2`, `meeting_takeaways_v2` |
| **Trigger** | Event-driven (post-meeting sync) / Manual |
| **Edge Function** | `run-ai-agent` |
| **Code Module** | `src/lib/ai-agents/meeting-intelligence-agent.ts` |

### 2.2 Client Call Analyzer Agent
| Field | Value |
|-------|-------|
| **Slug** | `client-call-analyzer` |
| **Category** | Meetings |
| **Description** | Specialized analysis of client calls — extracts sentiment, concerns, opportunities, and health indicators. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `zoom_files`, `client_meetings`, `clients` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |
| **Code Module** | `src/lib/ai-agents/client-call-analyzer-agent.ts` |

### 2.3 Meeting Issue Reporter
| Field | Value |
|-------|-------|
| **Slug** | `meeting-issue-reporter` |
| **Category** | Meetings |
| **Description** | Extracts EOS-format issues from meeting transcripts and creates suggestions for the EOS Issues list. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `zoom_files`, `eos_issues` |
| **Trigger** | Manual |
| **Edge Function** | `extract-meeting-issues` |

### 2.4 Meeting Efficiency Analyzer
| Field | Value |
|-------|-------|
| **Slug** | `meeting-efficiency-analyzer` |
| **Category** | Meetings |
| **Description** | Scores meeting quality based on structure, participation, outcomes, and time efficiency. |
| **Primary Model** | Gemini 2.5 Flash |
| **Provider** | Google AI |
| **Data Sources** | `zoom_files`, `meetings_v2` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 2.5 Smart Meeting Categorizer
| Field | Value |
|-------|-------|
| **Slug** | `smart-meeting-categorizer` |
| **Category** | Meetings |
| **Description** | Auto-categorizes meetings based on topic, participants, and content analysis. |
| **Primary Model** | Gemini 2.5 Flash |
| **Provider** | Google AI |
| **Data Sources** | `zoom_files`, `meetings_v2` |
| **Trigger** | Event-driven (on meeting sync) |
| **Edge Function** | `categorize-meeting` |

### 2.6 Client Communication Coach
| Field | Value |
|-------|-------|
| **Slug** | `client-communication-coach` |
| **Category** | Meetings |
| **Description** | Provides communication improvement suggestions based on client interaction patterns and sentiment trends. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `client_meetings`, `clients`, `zoom_files` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

---

## 3. Project Management Agents

### 3.1 AI Project Analyzer
| Field | Value |
|-------|-------|
| **Slug** | `project-analyzer` |
| **Category** | Project Management |
| **Description** | Analyzes project health — timeline risk, resource utilization, scope creep, and blocker identification. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `projects`, `activecollab_tasks`, `activecollab_time_records`, `Employee` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 3.2 Weekly Update Generator
| Field | Value |
|-------|-------|
| **Slug** | `weekly-update-generator` |
| **Category** | Project Management |
| **Description** | Generates structured weekly reports (Accomplishments, In Progress, Blockers, Next Week Plan, Insights) from ActiveCollab tasks and meeting transcripts. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Model Params** | `maxOutputTokens: 8192` |
| **Data Sources** | `activecollab_tasks`, `zoom_files`, `projects` |
| **Trigger** | Manual (per-project) |
| **Edge Function** | `weekly-update-generator` |
| **Storage** | `project_weekly_updates` table |
| **Notes** | Task filtering includes `updated_at`, `ac_completed_on`, `start_date`, `due_date` with fallback to 50 recent tasks. Meeting matching uses project_name, client_name, or keywords. |

### 3.3 PM Comment Staleness Alert
| Field | Value |
|-------|-------|
| **Slug** | `pm-comment-staleness-alert` |
| **Category** | Project Management |
| **Description** | Flags stale project management communication — identifies tasks and projects with no recent comments. |
| **Primary Model** | N/A (rule-based) |
| **Trigger** | Scheduled — **Monday 07:00 UTC** |
| **Edge Function** | `pm-comment-staleness-alert` |

### 3.4 Bug/Feature Analysis Planner
| Field | Value |
|-------|-------|
| **Slug** | `bug-feature-planner` |
| **Category** | Project Management |
| **Description** | Analyzes bug reports and feature requests to generate implementation plans, estimates, and priority recommendations. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `activecollab_tasks`, `projects` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 3.5 Code Review Generator
| Field | Value |
|-------|-------|
| **Slug** | `code-review-generator` |
| **Category** | Project Management |
| **Description** | Generates automated code review feedback based on project standards and best practices. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `activecollab_tasks`, `projects` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 3.6 Technical Plan Generator
| Field | Value |
|-------|-------|
| **Slug** | `technical-plan-generator` |
| **Category** | Project Management |
| **Description** | Creates technical implementation plans from requirements — architecture decisions, task breakdown, and timeline estimates. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `projects`, `activecollab_tasks` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

---

## 4. Task Agents

### 4.1 Task AI Chat
| Field | Value |
|-------|-------|
| **Slug** | `task-ai-chat` |
| **Category** | Tasks |
| **Description** | Conversational AI assistant within task detail pages — answers questions, suggests approaches, and provides context. |
| **Primary Model** | Gemini 2.5 Flash |
| **Provider** | Google AI |
| **Data Sources** | Task context (title, description, subtasks, comments) |
| **Trigger** | Manual (chat tab in TaskAIPanel) |
| **Edge Function** | `task-ai-agent` |
| **UI Component** | `src/components/tasks-v2/ai/AIChatTab.tsx` |

### 4.2 Task AI Summary
| Field | Value |
|-------|-------|
| **Slug** | `task-ai-summary` |
| **Category** | Tasks |
| **Description** | Generates structured task snapshots — status overview, key decisions, blockers, and next steps. |
| **Primary Model** | Gemini 2.5 Flash |
| **Provider** | Google AI |
| **Data Sources** | Task context |
| **Trigger** | Manual (summary tab) |
| **Edge Function** | `task-ai-agent` |
| **Cache** | `task_ai_cache` table (action: `summary`) |

### 4.3 Task AI Research
| Field | Value |
|-------|-------|
| **Slug** | `task-ai-research` |
| **Category** | Tasks |
| **Description** | Web and RAG-based research for task context — finds relevant documentation, articles, and best practices. |
| **Primary Model** | Gemini 2.5 Flash |
| **Provider** | Google AI |
| **Data Sources** | Task context + web search + RAG |
| **Trigger** | Manual (research tab) |
| **Edge Function** | `task-ai-agent` |
| **Cache** | `task_ai_cache` table (action: `research`) |

### 4.4 Task AI Planner
| Field | Value |
|-------|-------|
| **Slug** | `task-ai-planner` |
| **Category** | Tasks |
| **Description** | Generates subtask breakdowns from task description — creates actionable, prioritized subtask plans. |
| **Primary Model** | O3-mini |
| **Provider** | OpenAI |
| **Data Sources** | Task context |
| **Trigger** | Manual (planner tab, parent tasks only) |
| **Edge Function** | `task-ai-agent` |
| **Cache** | `task_ai_cache` table (action: `plan`) |
| **UI Component** | `src/components/tasks-v2/ai/AIPlannerTab.tsx` |

---

## 5. EOS (Entrepreneurial Operating System) Agents

### 5.1 EOS Triage Assistant
| Field | Value |
|-------|-------|
| **Slug** | `eos-triage-assistant` |
| **Category** | EOS |
| **Description** | Assists with issue triage — suggests priority, severity, department assignment, and categorization. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `eos_issues`, `eos_issue_comments` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 5.2 EOS Pattern Detective
| Field | Value |
|-------|-------|
| **Slug** | `eos-pattern-detective` |
| **Category** | EOS |
| **Description** | Detects patterns and trends across EOS issues — recurring themes, systemic problems, and cross-department impacts. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `eos_issues`, `eos_issue_comments`, `quarterly_rocks` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |
| **Code Module** | `src/lib/ai-agents/intelligence-layer.ts` |

### 5.3 EOS Pod Health Analyzer
| Field | Value |
|-------|-------|
| **Slug** | `eos-pod-health` |
| **Category** | EOS |
| **Description** | Analyzes pod/team health based on EOS metrics — accountability chart completion, issue resolution rate, rock progress. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `accountability_charts`, `eos_issues`, `quarterly_rocks`, `pods` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 5.4 EOS Quarterly Digest
| Field | Value |
|-------|-------|
| **Slug** | `eos-quarterly-digest` |
| **Category** | EOS |
| **Description** | Generates quarterly summary reports for EOS — rock completion, issue trends, accountability scores, and recommendations. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `eos_issues`, `quarterly_rocks`, `accountability_charts` |
| **Trigger** | Manual / Quarterly |
| **Edge Function** | `run-ai-agent` |

### 5.5 Accountability Chart Reminder
| Field | Value |
|-------|-------|
| **Slug** | `accountability-chart-reminder` |
| **Category** | EOS |
| **Description** | Sends weekly reminders to employees with pending or overdue accountability chart submissions. |
| **Trigger** | Scheduled — **Monday 06:00 UTC** (via pg_cron) |
| **Edge Function** | `accountability-chart-reminder` |

### 5.6 Accountability Manager Nudge
| Field | Value |
|-------|-------|
| **Slug** | `accountability-manager-nudge` |
| **Category** | EOS |
| **Description** | Monthly nudge to managers to review and approve pending accountability charts from their team. |
| **Trigger** | Scheduled — **1st of month, 00:05 UTC** (via pg_cron) |
| **Edge Function** | `accountability-manager-nudge` |

### 5.7 Accountability Chart Revisit Reminder
| Field | Value |
|-------|-------|
| **Slug** | `accountability-revisit-reminder` |
| **Category** | EOS |
| **Description** | Monthly reminder for employees to revisit and update their accountability charts. |
| **Trigger** | Scheduled — **1st of month, 00:10 UTC** (via pg_cron) |
| **Edge Function** | `accountability-revisit-reminder` |

### 5.8 Accountability Overlap Analyzer
| Field | Value |
|-------|-------|
| **Slug** | `accountability-overlap-analyzer` |
| **Category** | EOS |
| **Description** | Detects overlapping responsibilities and gaps in accountability charts across the organization. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `accountability_charts` |
| **Trigger** | Scheduled — **1st of month, 06:00 UTC** (via pg_cron) |
| **Edge Function** | `accountability-overlap-analyzer` |

---

## 6. Team & Productivity Agents

### 6.1 Pod Weekly AI Summary
| Field | Value |
|-------|-------|
| **Slug** | `pod-weekly-ai-summary` |
| **Category** | Team & Productivity |
| **Description** | Generates structured team performance briefings analyzing productivity %, tasks, OKRs, billable utilization, project involvement, GitHub activity, and manager reviews. Uses 1-10 scoring rubric with 4-week trend analysis and 37.5h weekly threshold. |
| **Primary Model** | Gemini 3 Flash Preview |
| **Provider** | Google AI (via Lovable AI Gateway) |
| **Data Sources** | `Employee`, `EmployeeProductivity`, `pods`, `activecollab_tasks`, `okrs`, `projects` |
| **Trigger** | Scheduled — **Sunday 11 PM EST (Monday 04:00 UTC)** (via pg_cron) |
| **Edge Function** | `pod-weekly-ai-summary` |
| **Storage** | `pod_weekly_ai_summaries` table |
| **Notes** | Auto-emails managers (CC viewers). Incorporates Resource Projection planned hours and PM/CS manager roles. |

### 6.2 Employee Productivity Agent
| Field | Value |
|-------|-------|
| **Slug** | `employee-productivity` |
| **Category** | Team & Productivity |
| **Description** | Individual employee productivity analysis — time tracking, task completion, and trend analysis. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `Employee`, `EmployeeProductivity`, `activecollab_time_records` |
| **Trigger** | Manual |
| **Edge Function** | `run-ai-agent` |

### 6.3 Generate AI Productivity Insight
| Field | Value |
|-------|-------|
| **Slug** | `ai-productivity-insight` |
| **Category** | Team & Productivity |
| **Description** | Generates productivity insights with AI scoring, verdicts, and actionable recommendations per employee. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | `Employee`, `EmployeeProductivity`, `ActionItem` |
| **Trigger** | Manual / Scheduled |
| **Edge Function** | `generate-ai-insight` |
| **Storage** | `ai_insights` table |

### 6.4 Weekly Productivity Digest
| Field | Value |
|-------|-------|
| **Slug** | `weekly-productivity-digest` |
| **Category** | Team & Productivity |
| **Description** | Compiles and emails weekly productivity digest summaries to managers. |
| **Trigger** | Scheduled (weekly via pg_cron) |
| **Edge Function** | `weekly-productivity-digest` |

---

## 7. Knowledge & Research Agents

### 7.1 Unified Knowledge Search
| Field | Value |
|-------|-------|
| **Slug** | `unified-knowledge-search` |
| **Category** | Knowledge |
| **Description** | Cross-source semantic search across all knowledge bases — personal files, shared knowledge, client documents, and meeting transcripts. |
| **Primary Model** | Gemini 3.0 (for reranking) |
| **Provider** | Google AI |
| **Data Sources** | `user_knowledge`, `common_knowledge_files`, `knowledge_entries`, `client_documents` |
| **Trigger** | Manual (search interface) |
| **Edge Function** | `unified-knowledge-search` |

### 7.2 Unified RAG Search
| Field | Value |
|-------|-------|
| **Slug** | `unified-rag-search` |
| **Category** | Knowledge |
| **Description** | Retrieval-Augmented Generation search — combines semantic search with LLM-powered answer synthesis. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | All knowledge sources + embeddings |
| **Trigger** | Manual |
| **Edge Function** | `unified-rag-search` |

### 7.3 Gemini RAG Query
| Field | Value |
|-------|-------|
| **Slug** | `gemini-rag-query` |
| **Category** | Knowledge |
| **Description** | Direct Gemini corpus search using Google's grounding capabilities for RAG queries. |
| **Primary Model** | Gemini 3.0 |
| **Provider** | Google AI |
| **Data Sources** | Gemini corpus |
| **Trigger** | Manual |
| **Edge Function** | `gemini-rag-query` |

---

## 8. HR & Operations Agents

### 8.1 HR Request Processing
| Field | Value |
|-------|-------|
| **Slug** | `hr-request-processing` |
| **Category** | HR |
| **Description** | Automates HR request intake, categorization, and routing — leave requests, policy inquiries, and approvals. |
| **Primary Model** | Gemini 2.5 Flash |
| **Provider** | Google AI |
| **Data Sources** | HR request data |
| **Trigger** | Event-driven (on request submission) |
| **Edge Function** | `process-hr-request` |

---

## 9. Integration / Sync Agents

These agents handle data synchronization between external platforms and the Control Tower.

### 9.1 HubSpot Sync Agents (25+)
| Agent | Edge Function | Schedule |
|-------|--------------|----------|
| Sync Deals | `sync-hubspot-deals` | Hourly / Manual |
| Sync Contacts | `sync-hubspot-contacts` | Hourly / Manual |
| Sync Companies | `sync-hubspot-companies` | Daily / Manual |
| Search Companies | `hubspot-search-companies` | Manual |
| Sync Deal Properties | `sync-hubspot-deal-properties` | Daily |
| Sync Contact Properties | `sync-hubspot-contact-properties` | Daily |
| Bulk Deal Sync | `bulk-sync-hubspot-deals` | Manual |
| Deal Stage Mapping | `hubspot-deal-stage-mapping` | On config change |

### 9.2 ActiveCollab Sync Agents (17)
| Agent | Edge Function | Schedule |
|-------|--------------|----------|
| Sync Projects | `sync-activecollab-projects` | Hourly |
| Sync Tasks | `sync-activecollab-tasks` | Hourly |
| Sync Time Records | `sync-activecollab-time-records` | Hourly |
| Sync Comments | `sync-activecollab-comments` | Hourly |
| Sync Labels | `sync-activecollab-labels` | Daily |
| Sync Job Types | `sync-activecollab-job-types` | Daily |
| Sync Expenses | `sync-activecollab-expenses` | Daily |

### 9.3 Google Workspace Agents
| Agent | Edge Function | Schedule |
|-------|--------------|----------|
| Google Drive Sync | `sync-google-drive` | On-demand |
| Gmail Sync | `sync-gmail` | Periodic |
| Google Calendar Sync | `sync-google-calendar` | Periodic |

### 9.4 Zoom Sync Agents
| Agent | Edge Function | Schedule |
|-------|--------------|----------|
| Sync Zoom Files | `sync-zoom-files` | Daily / Manual |
| Sync Zoom Transcripts | `sync-zoom-transcripts` | Post-meeting |
| Zoom Recording Processor | `process-zoom-recording` | Event-driven |

### 9.5 Other Integration Agents
| Agent | Edge Function | Schedule |
|-------|--------------|----------|
| Workboard Sync | `sync-workboard` | Periodic |

---

## 10. Data Source Registry

The data source registry (`src/data/agentDataSourceRegistry.ts`) defines all available data sources organized into 8 groups:

### Groups

| Group ID | Label | Icon | Sources Count |
|----------|-------|------|---------------|
| `sales` | Sales & Business Development | Briefcase | 5 (deals, clients, contacts, client_research, lead_follow_up_contacts) |
| `operations` | Projects & Operations | FolderKanban | 7 (projects, tasks, activecollab_tasks ×2, time_records, ActionItem, project_milestones) |
| `team` | Team & Resources | Users | 3 (Employee, EmployeeProductivity, pods) |
| `knowledge` | Knowledge & Documents | FileText | 5 (user_knowledge, common_knowledge_files, client_documents, knowledge_entries, zoom_files) |
| `meetings` | Meetings & Communication | Calendar | 3 (meetings_v2, client_meetings, meeting_takeaways_v2) |
| `goals` | Goals & Performance | Target | 3 (okrs, key_results, company_goals) |
| `eos` | EOS | Shield | 5 (accountability_charts, accountability_chart_events, eos_issues, eos_issue_comments, quarterly_rocks) |
| `finance` | Finance & Invoicing | DollarSign | 3 (invoices, expenses, invoice_payments) |

---

## 11. Data Source Presets

Pre-configured data source bundles for common agent use cases:

| Preset ID | Label | Data Sources | Recommended For |
|-----------|-------|-------------|-----------------|
| `sales-agent` | Sales & Lead Agent | deals, clients, contacts, lead_follow_up_contacts, client_research, client_documents, client_meetings | Lead generation, Deal analysis, Client research, Sales forecasting |
| `project-analyst` | Project Analyst | projects, tasks, activecollab_tasks, activecollab_time_records, Employee, EmployeeProductivity | Project status reports, Resource allocation, Task prioritization |
| `financial-agent` | Financial Agent | invoices, expenses, invoice_payments, clients, projects | Revenue analysis, Expense tracking, Budget forecasting |
| `meeting-summarizer` | Meeting Summarizer | meetings_v2, client_meetings, meeting_takeaways_v2, zoom_files | Meeting summaries, Action item tracking, Decision documentation |
| `knowledge-expert` | Knowledge Expert | user_knowledge, common_knowledge_files, knowledge_entries, client_documents | Document search, Information retrieval, Best practices |
| `performance-coach` | Performance Coach | okrs, key_results, company_goals, EmployeeProductivity, Employee, accountability_charts, quarterly_rocks | Goal tracking, Performance reviews, Team alignment |
| `eos-analyst` | EOS Analyst | accountability_charts, accountability_chart_events, eos_issues, eos_issue_comments, quarterly_rocks | Accountability review, Issue triage, Rock tracking |
| `full-access` | Full Access Agent | All sources | General assistance, Cross-functional analysis, Strategic planning |

---

## 12. Architecture Notes

### Agent Execution Framework

All agents are executed through a unified framework:

1. **`run-ai-agent` Edge Function** — Generic agent runner that:
   - Loads agent config from `ai_agents` table (system prompt, model, data sources)
   - Resolves data sources and fetches relevant data
   - Calls the AI provider (Google AI / OpenAI / Anthropic / Perplexity)
   - Logs execution to `ai_agent_runs` table
   - Returns structured output

2. **Specialized Edge Functions** — For agents needing custom logic (e.g., `weekly-update-generator`, `deal-daily-briefing`)

### Key Database Tables

| Table | Purpose |
|-------|---------|
| `ai_agents` | Agent definitions (name, slug, system_prompt, model, data_sources, config) |
| `ai_agent_runs` | Execution history (status, output, latency, token metrics) |
| `ai_agent_categories` | Agent categorization |
| `ai_configurations` | Global AI settings |
| `ai_model_pricing` | Model cost tracking |
| `agent_memory` | Persistent agent memory |
| `ai_issue_suggestions` | AI-generated issue suggestions |
| `task_ai_cache` | Task agent result caching |

### Model Usage Summary

| Model | Provider | Used By |
|-------|----------|---------|
| Gemini 3.0 | Google AI | Most analysis agents (default) |
| Gemini 2.5 Flash | Google AI | Chat agents, fast tasks |
| Gemini 3 Flash Preview | Google AI | Pod Weekly Summary |
| O3-mini | OpenAI | Task Planner |
| Claude 4.5 Sonnet | Anthropic | Prototype Builder |
| Perplexity Sonar | Perplexity | Research agents |

### Frontend Components

| Component | Path | Purpose |
|-----------|------|---------|
| `TaskAIPanel` | `src/components/tasks-v2/ai/TaskAIPanel.tsx` | 4-tab AI panel for tasks |
| `AIChatTab` | `src/components/tasks-v2/ai/AIChatTab.tsx` | Chat interface |
| `AISummaryTab` | `src/components/tasks-v2/ai/AISummaryTab.tsx` | Summary generation |
| `AIResearchTab` | `src/components/tasks-v2/ai/AIResearchTab.tsx` | Research interface |
| `AIPlannerTab` | `src/components/tasks-v2/ai/AIPlannerTab.tsx` | Subtask planner |

### Intelligence Layer

The `IntelligenceLayer` (`src/lib/ai-agents/intelligence-layer.ts`) provides cross-agent capabilities:
- Trend detection across issues
- Pattern recognition
- Feedback loop for continuous improvement (`src/lib/ai-agents/feedback-loop.ts`)

### Prompt Management

System prompts are managed in:
- `ai_agents.system_prompt` (database) — per-agent prompts
- `src/lib/ai-agents/prompts.ts` — shared prompt templates with `fillPromptTemplate()` utility

---

*This catalog is designed for replication. Adapt agent slugs, edge functions, and data source mappings to match your nonprofit's domain and database schema.*
