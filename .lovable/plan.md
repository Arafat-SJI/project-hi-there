

# Navigation Reorganization Plan
## Thinking Like a Product Manager for an AI-Agentic Platform

---

## Current State Analysis

The current navigation has **20+ top-level menu items** displayed as a flat list. This creates cognitive overload and makes it difficult for users to understand the platform's value proposition. Key issues:

1. **Flat structure** - No grouping, users must scan everything
2. **Orphaned items** - Series, Transcripts, Streams appear as standalone items when they're sub-features
3. **Mixed contexts** - AI features scattered across different areas
4. **Redundancy** - Similar concepts have different entry points

---

## Proposed Navigation Architecture

### Primary Groups (Collapsible Sections)

```text
+------------------------------------------+
|  CONTROL TOWER                           |
|  [Company Name]                          |
+------------------------------------------+
|                                          |
|  Dashboard                               |
|                                          |
|  --- BUSINESS DEVELOPMENT ---------------+
|  |  Clients                              |
|  |  Deals                                |
|  |  Contacts                             |
+------------------------------------------+
|                                          |
|  --- WORK MANAGEMENT --------------------+
|  |  Tasks                                |
|  |  -> Streams (sub-item)                |
|  |  Projects                             |
+------------------------------------------+
|                                          |
|  --- MEETINGS ---------------------------+
|  |  Schedule                             |
|  |  Series                               |
|  |  Transcripts                          |
+------------------------------------------+
|                                          |
|  --- KNOWLEDGE --------------------------+
|  |  Knowledge Base                       |
|  |  Semantic Search                      |
|  |  Personal Library                     |
+------------------------------------------+
|                                          |
|  --- STRATEGY (EOS) ---------------------+
|  |  EOS Hub                              |
|  |  V/TO                                 |
|  |  OKRs                                 |
|  |  Issues                               |
|  |  Scorecard                            |
|  |  Accountability                       |
+------------------------------------------+
|                                          |
|  --- OPERATIONS -------------------------+
|  |  Productivity                         |
|  |  Processes                            |
+------------------------------------------+
|                                          |
|  --- AI COMMAND CENTER ------------------+
|  |  AI Agents                            |
|  |  AI Chat                              |
|  |  Feedback                             |
+------------------------------------------+
```

---

## Detailed Module Breakdown

### 1. Business Development (CRM)
**Rationale**: These are tightly coupled - you manage clients, track deals with those clients, and communicate with contacts at those clients.

| Current | Proposed |
|---------|----------|
| Clients (top-level) | Business Development > Clients |
| Deals (top-level) | Business Development > Deals |
| Contacts (top-level) | Business Development > Contacts |

**User Story**: "As a sales rep, I want all my sales activities in one place so I can manage my pipeline efficiently."

---

### 2. Work Management
**Rationale**: Tasks and Projects are related work containers. Streams are a sub-concept of Tasks.

| Current | Proposed |
|---------|----------|
| Tasks (top-level) | Work Management > Tasks |
| Streams (top-level) | Work Management > Tasks > Streams (nested) |
| Projects (top-level) | Work Management > Projects |

**User Story**: "As a project manager, I want work items grouped together so I can see all deliverables at a glance."

---

### 3. Meetings
**Rationale**: Series is a meeting configuration, Transcripts are meeting outputs. They all belong under one umbrella.

| Current | Proposed |
|---------|----------|
| Meetings (top-level) | Meetings > Schedule |
| Series (top-level - confusing) | Meetings > Series |
| Transcripts (top-level) | Meetings > Transcripts |

**User Story**: "As a team lead, I want all meeting-related features in one section so I can prepare and follow up on meetings."

---

### 4. Knowledge
**Rationale**: All knowledge assets should be accessible from one section.

| Current | Proposed |
|---------|----------|
| Knowledge Base (top-level) | Knowledge > Knowledge Base |
| Semantic Search (top-level) | Knowledge > Semantic Search |
| Personal Knowledge (bottom of nav) | Knowledge > Personal Library |

**User Story**: "As an employee, I want to find information quickly whether it's company-wide or my personal notes."

---

### 5. Strategy (EOS)
**Rationale**: EOS is a comprehensive business operating system. All its components should be grouped.

| Current | Proposed |
|---------|----------|
| EOS (top-level) | Strategy > EOS Hub |
| OKRs (top-level - separate from EOS) | Strategy > OKRs |

**Additional items from EOS module to expose**:
- Strategy > V/TO
- Strategy > Issues
- Strategy > Scorecard
- Strategy > Accountability

**User Story**: "As an executive, I want strategic planning tools grouped together so I can run my business on EOS methodology."

---

### 6. Operations
**Rationale**: Productivity metrics and process documentation are operational concerns.

| Current | Proposed |
|---------|----------|
| Productivity (top-level) | Operations > Productivity |
| Processes (top-level) | Operations > Processes |

**User Story**: "As an operations manager, I want visibility into team performance and documented procedures."

---

### 7. AI Command Center
**Rationale**: This is the differentiator of the platform. AI features deserve their own prominent section with visual AI indicators.

| Current | Proposed |
|---------|----------|
| AI Agents (bottom of nav) | AI Command Center > AI Agents |
| AI Chat (bottom of nav) | AI Command Center > AI Chat |
| Feedback (scattered) | AI Command Center > Feedback Loop |

**Visual Enhancement**: Add the AI pulsing indicator to this section header to show "AI is active"

**User Story**: "As a power user, I want to see all AI capabilities in one place so I can leverage automation."

---

## Navigation Component Changes

### New Data Structure

```typescript
interface NavGroup {
  id: string;
  title: string;
  icon: string;
  isAI?: boolean; // Shows AI indicator
  module?: ModuleId;
  featureFlag?: string;
  items: NavItem[];
}

interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  children?: NavItem[]; // For nested items like Streams
}
```

### Files to Modify

1. **`src/shared/data/navigationStructure.ts`**
   - Restructure `mainNavigation` from flat array to grouped array
   - Add `NavGroup` with nested `NavItem[]`

2. **`src/components/layout/AppSidebar.tsx`**
   - Implement collapsible sections using Radix Collapsible or Accordion
   - Add group headers with icons
   - Support nested items (e.g., Tasks > Streams)
   - Add AI indicator animation to "AI Command Center" group

3. **`src/components/layout/TopNav.tsx`**
   - Update breadcrumbs to reflect new hierarchy

---

## Technical Implementation Details

### Sidebar Component Updates

The sidebar will use `@radix-ui/react-collapsible` (already installed) to create expandable groups:

```typescript
// Pseudo-structure for grouped navigation
<SidebarContent>
  {navigationGroups.map((group) => (
    <Collapsible key={group.id} defaultOpen>
      <CollapsibleTrigger>
        <Icon /> {group.title}
        {group.isAI && <AIIndicator variant="active" size="sm" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {group.items.map((item) => (
          <NavLink to={item.href}>
            <Icon /> {item.title}
          </NavLink>
        ))}
      </CollapsibleContent>
    </Collapsible>
  ))}
</SidebarContent>
```

### Route Changes
No route changes needed - only navigation display changes. All existing routes remain functional.

### Module Permissions
The existing `hasModule()` and `isFeatureEnabled()` checks will be applied at the group level and item level, hiding entire groups if no items are accessible.

---

## Summary of Benefits

| Before | After |
|--------|-------|
| 20+ flat menu items | 7 logical groups |
| Scanning required to find features | Grouped by user intent |
| AI features buried | AI Command Center with visual indicator |
| Series/Transcripts confusing | Clearly under Meetings |
| Streams orphaned | Nested under Tasks |

---

## Implementation Steps

1. Create new grouped navigation data structure
2. Build collapsible sidebar component with Radix Collapsible
3. Add AI indicator to AI Command Center group
4. Persist expanded/collapsed state to localStorage
5. Update navigation structure file with new grouping
6. Add chevron icons for expand/collapse visual feedback
7. Test permission filtering at group and item levels

