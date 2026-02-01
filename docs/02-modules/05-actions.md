# Actions — Module Blueprint

## Overview
The Actions module (formerly "Tasks V2" / "My Tasks") provides standalone task management independent of projects. It includes personal task views (Today, This Week, Overdue, Delegated, All), task detail with comments and subtasks, stream-based organization, and AI assistance for task management.

**Naming:** In the new architecture, standalone tasks are called "Actions" to distinguish from project-scoped "Tasks" within the Projects module. The database table remains `tasks_v2` for backward compatibility.

## Module Name
`Actions` (in app_modules and navigation)

## Routes Owned
```
/tasks                    → Task listing (multiple views)
/tasks/:idOrSlug          → Task detail
/tasks/stream/:slug       → Tasks by stream
/tasks/t/:slug            → Legacy slug redirect → /tasks/:slug
/streams                  → Streams overview

Legacy redirects:
/actions                  → /tasks
/actions/mytasks          → /tasks
/actions/assigned-by-me   → /tasks
/actions/completed        → /tasks
/tasks-v2                 → /tasks
/tasks-v2/stream/:slug    → /tasks/stream/:slug
/tasks-v2/:id             → /tasks/:idOrSlug

Admin routes:
/admin/task-streams       → Stream management
/admin/tasks/streams      → Stream settings
/admin/settings/task-creation → Task creation settings
```

## File Inventory

### Pages (8 files)
- src/pages/TasksV2.tsx — Main task listing (Today, This Week, Overdue, Delegated, All)
- src/pages/TaskDetailV2.tsx — Task detail with full info, comments, contributors
- src/pages/StreamsPage.tsx — Stream listing/management
- src/pages/StreamTasksPage.tsx — Tasks filtered by stream
- src/pages/ActiveCollabTasks.tsx — ActiveCollab task listing
- src/pages/admin/TaskStreams.tsx — Admin stream management
- src/pages/admin/settings/TaskCreationSettings.tsx — Task creation config
- src/pages/admin/settings/TaskStreams.tsx — Stream settings

### Components — tasks-v2/ (22 files)
Display:
- TasksTable.tsx — Table view for tasks
- TaskDetailsCard.tsx — Task detail card
- TaskHeader.tsx — Page header
- TasksPagination.tsx — Pagination
- MyTasksViews.tsx — View switcher (Today, Week, Overdue, etc.)

Management:
- CreateTaskDialog.tsx — Create task
- EditTaskDialog.tsx — Edit task
- MakeTaskPublicDialog.tsx — Make task public

Features:
- SubTasksList.tsx — Subtask management
- TaskAttachmentUpload.tsx — File attachments
- TaskContributorsTab.tsx — Task contributors
- TaskAIAssistant.tsx — AI assistant
- AssigneePicker.tsx — Assignee selection

Comments:
- comments/TaskCommentsSection.tsx — Comments wrapper
- comments/TaskCommentItem.tsx — Individual comment
- comments/TaskCommentThread.tsx — Comment threading
- comments/TaskCommentHistoryDialog.tsx — Comment history
- comments/index.ts — Comments barrel export

Streams:
- StreamsGrid.tsx — Stream grid display
- StreamCard.tsx — Stream card
- StreamPeopleModal.tsx — Stream members

### Hooks (16 files)
Core:
- useTasksV2.ts — Main hook (useMyUnifiedTasksV2, useTodayTasks, useThisWeekTasks, useOverdueTasks, useDelegatedTasks, useTaskV2, useTaskBySlug, useDeleteTaskV2, useUpdateTaskStatusV2, useUpdateTaskV2, useParentTaskV2)
- useTaskCommentsV2.ts — Comments CRUD

Streams:
- useAccessibleStreams.ts — User's accessible streams
- useStreamUsers.ts — Stream members
- useStreamTaskCounts.ts — Task counts by stream

Features:
- useTaskDetails.ts — Detailed task info
- useTaskCategories.ts — Category management
- useTaskCategoryAccess.ts — Category access control
- useTaskAI.ts — AI operations
- useTaskViewPreference.ts — View preferences
- useTaskContributors.ts — Contributor management
- useTaskCreationTemplates.ts — Task templates

Cross-module:
- useConvertTakeawayToTask.ts — Convert meeting takeaway to task
- useAutoFetchTaskComments.ts — Auto-fetch comments
- useActiveCollabTasks.ts — ActiveCollab integration
- useExtractMeetingTasks.ts — Extract tasks from meetings

### Services
- src/lib/api/tasksService.ts — Task API operations (fetchTasks, createTask, updateTask, deleteTask)

### Edge Functions (8 core + 4 related)
Core:
- api-v1-tasks — RESTful task API
- task-ai-assistant — AI assistant for tasks
- task-ai-agent — AI agent for task ops
- ai-suggest-tasks — AI task suggestions
- assign-task-back — Reassign back
- reassign-task — Task reassignment
- convert-takeaway-to-task — Meeting→task conversion
- create-action-item-with-ai — AI action item creation

Related:
- create-meeting-review-tasks — Create review tasks
- parse-meeting-action-items — Parse meeting actions
- sync-action-item-to-ac — Sync to ActiveCollab
- sync-workboard-action-items — Workboard sync

### API Endpoints
```
TASKS_V2.BASE: 'api-v1-tasks-v2'
TASKS_V2.BY_ID: 'api-v1-tasks-v2/:id'
TASKS_V2.BY_SLUG: 'api-v1-tasks-v2/by-slug/:slug'
TASKS_V2.COMMENTS: 'api-v1-tasks-v2/:id/comments'
TASKS_V2.SUB_TASKS: 'api-v1-tasks-v2/:id/subtasks'
TASKS_V2.SUMMARY: 'api-v1-tasks-v2/summary'
TASKS_V2.CATEGORIES: 'api-v1-tasks-v2/categories'
```

## Database Tables
- `tasks_v2` — Task records (title, description, status, priority, assignee, due_date, stream_id, parent_id)
- `task_comments_v2` — Task comments with threading
- `task_streams` — Stream definitions (name, slug, description, members)
- `task_stream_members` — Stream membership
- `task_categories` — Task category definitions
- `task_attachments` — File attachments
- `task_contributors` — Task contributors/collaborators

## Cross-Module Dependencies
**Depends on:** Platform Core
**Used by:** Admin (stream/task settings)
**Optional integrations:**
- Meetings → convert takeaways to tasks, extract tasks from meetings
- ActiveCollab → sync tasks to/from ActiveCollab

## Implementation Notes
- Tasks use slug-based URLs (auto-generated from title)
- Multiple views: Today, This Week, Overdue, Delegated, All Tasks
- Streams organize tasks into categories/workspaces
- AI assistant helps with task creation and management
- Subtask hierarchy (parent_id) for task decomposition
- Comment threading with edit history
- Task creation templates for quick entry
- Status workflow: open → in_progress → completed
