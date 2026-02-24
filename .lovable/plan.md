

# Update Database Schema Documentation

## Overview
Create a comprehensive `docs/01-architecture/database-schema.md` file documenting all 140+ tables currently in the database, organized by functional module. This fills the gap where `database-schema.md` is referenced in `docs/01-architecture/README.md` but does not exist. Additionally, update the outdated Section 14 in `system-architecture.md` to point to the new file instead of listing only 26 tables.

## What Will Be Created

### New File: `docs/01-architecture/database-schema.md`

A complete schema reference organized into these module sections:

1. **Core / Auth** (7 tables) -- `profiles`, `user_roles`, `roles`, `user_invites`, `user_module_permissions`, `app_config`, `app_modules`
2. **Activity & Notifications** (3 tables) -- `activity_logs`, `notifications`, `feedback`
3. **AI Agents & Chat** (10 tables) -- `ai_agents`, `ai_agent_categories`, `ai_agent_runs`, `ai_chat_history`, `ai_models`, `ai_providers`, `ai_usage_logs`, `ai_productivity_insights`, `prompt_templates`, `agent_conversations`, `agent_messages`
4. **Agent Execution & Memory** (11 tables/views) -- `agent_execution_plans`, `agent_execution_steps`, `agent_reasoning_traces`, `agent_memories`, `agent_learning_events`, `user_preferences`, plus views (`agent_memory_stats`, `agent_plan_performance`, etc.)
5. **MCP Tool Orchestration** (3 tables) -- `mcp_servers`, `mcp_tools`, `mcp_tool_executions`
6. **Embeddings & RAG** (6 tables) -- `embeddings`, `embedding_queue`, `knowledge_embeddings`, `vector_search_logs`, `gemini_corpora`, `gemini_query_logs`, `gemini_sync_logs`
7. **Knowledge Base** (6 tables) -- `knowledge_entries`, `knowledge_categories`, `knowledge_sources`, `knowledge_files`, `user_knowledge_files`, `common_knowledge`
8. **Meetings** (12 tables) -- `meetings`, `meeting_series`, `meeting_participants`, `meeting_external_participants`, `meeting_agenda_items`, `meeting_action_items`, `meeting_takeaways`, `meeting_assignments`, `meeting_assignment_suggestions`, `meeting_categorizations`, `meeting_files`, `meeting_transcripts`, `zoom_files`
9. **Clients & CRM** (4 tables) -- `clients`, `client_feedback`, `client_meetings`, `contacts`
10. **Contact Intelligence** (7 tables) -- `contact_activities`, `contact_ai_summaries`, `contact_communications`, `contact_email_engagement`, `contact_email_templates`, `contact_meeting_links`, `lead_*` tables
11. **Deals / Business Dev** (3 tables) -- `deals`, `deal_activities`, `deal_comments`
12. **Projects** (10 tables) -- `projects`, `project_statuses`, `project_members`, `project_milestones`, `project_comments`, `project_files`, `project_risks`, `project_invoices`, `project_billing`, `project_backups`, `project_favorites`, `project_client_access`, `project_client_comments`
13. **Tasks / Actions** (6 tables) -- `tasks`, `task_streams`, `task_stream_members`, `task_categories`, `task_comments`, `task_attachments`, `task_contributors`
14. **EOS / OKRs** (8 tables) -- `eos_vto`, `eos_issues`, `eos_issue_suggestions`, `eos_scorecards`, `eos_scorecard_metrics`, `eos_pods`, `okrs`, `okr_key_results`, `okr_check_ins`, `gwc_assessments`, `accountability_charts`, `accountability_responsibilities`
15. **Productivity & HR** (7 tables) -- `departments`, `employee_profiles`, `employee_skills`, `skills`, `pods`, `pod_members`, `pod_employees`, `employee_pods`, `pod_permissions`, `productivity_records`, `productivity_alerts`, `leave_events`
16. **Integrations** (6 tables) -- `integration_categories`, `integration_providers`, `integration_fields`, `integration_services`, `organization_integrations`, `integration_usage_logs`, `oauth_states`, `user_oauth_tokens`
17. **Email & Communications** (4 tables) -- `email_logs`, `email_tracking_events`, `scheduled_emails`, `sendgrid_config`
18. **Microsoft Graph** (3 tables) -- `graph_webhook_logs`, `graph_webhook_subscriptions`, `user_microsoft_teams`, `user_microsoft_teams_channels`
19. **Process & Documents** (3 tables) -- `process_categories`, `process_documents`, `unified_documents`, `processing_queue_history`
20. **System Settings** (1 table) -- `system_settings`

For each table, the doc will include:
- Column name, data type, nullable, default value
- Primary keys and foreign key relationships noted inline

### Updated File: `docs/01-architecture/system-architecture.md`
- Replace the outdated Section 14 (lines 1094-1200+) with a brief summary stating "140+ tables across 20 modules" and a link to the new `database-schema.md` file
- Keep the Mermaid ER diagram but add a note that it shows core relationships only

## Technical Notes
- All column data is sourced directly from the live database via `information_schema.columns`
- The documentation will use Markdown tables for each database table's columns
- Views (like `pods_with_stats`, `agent_memory_stats`) will be documented separately in a "Views" section

