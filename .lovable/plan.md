

## Plan: "Meet Your AI Team" — Landing Page Agent Showcase

### The Idea

Add a new dedicated section to the landing page between FeatureGrid and SocialProof called **"Meet Your AI Team"**. Instead of abstract feature descriptions, visitors see actual AI agent personas — each with a face/avatar, name, a one-liner about what they do, and which part of the platform they live in. This makes the AI feel human, approachable, and embedded rather than bolted on.

---

### Design Concept

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     Meet Your AI Team                               │
│        They live inside your workflow — ready when you are          │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Avatar   │  │  Avatar   │  │  Avatar   │  │  Avatar   │         │
│  │   📝      │  │   ✅      │  │   💼      │  │   📊      │         │
│  │ Meeting   │  │ Action    │  │ Deal      │  │ Project   │         │
│  │Summarizer │  │ Item      │  │ Coach     │  │ Analyst   │         │
│  │           │  │Extractor  │  │           │  │           │         │
│  │"I turn    │  │"I pull    │  │"I help    │  │"I flag    │         │
│  │ meetings  │  │ tasks     │  │ close     │  │ risks     │         │
│  │ into      │  │ from your │  │ deals     │  │ before    │         │
│  │ action."  │  │ notes."   │  │ faster."  │  │ they hit."│         │
│  │           │  │           │  │           │  │           │         │
│  │ 📍Meetings│  │ 📍Meetings│  │ 📍Sales   │  │ 📍Projects│         │
│  │   Hub     │  │   Hub     │  │   Hub     │  │           │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │   🔍      │  │   🏗️      │  │   📧      │  │   🧠      │         │
│  │Knowledge  │  │ EOS       │  │ Email     │  │Operations │         │
│  │ Search    │  │ Coach     │  │ Drafter   │  │ Advisor   │         │
│  │           │  │           │  │           │  │           │         │
│  │"I find    │  │"I guide   │  │"I draft   │  │"I spot    │         │
│  │ answers   │  │ your EOS  │  │ follow-up │  │ team      │         │
│  │ in your   │  │ rhythm."  │  │ emails."  │  │ patterns."│         │
│  │ docs."    │  │           │  │           │  │           │         │
│  │ 📍Knowledge│ │ 📍Strategy│  │ 📍Sales   │  │ 📍Ops     │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│         ● ● ● (dot pagination for mobile carousel)                  │
│                                                                     │
│         [ See All Agents → ]  (links to /login)                     │
└─────────────────────────────────────────────────────────────────────┘
```

Each card:
- Large round avatar area with the agent's emoji avatar (from DB seed) or a generated initial
- A pulsing green "active" dot (reusing `AIIndicator`)
- Agent name in bold
- A first-person quote: "Hi, I'm [name]. I [whatIDo]." — written conversationally
- A subtle "📍 Lives in: [section]" tag showing where in the app they work
- Hover: card lifts with `shadow-ai`, border glows `border-primary/30`

### Agent Data (Hardcoded in Component)

Using the agents already seeded in the database, the component will use a static array of 8 representative agents:

| Agent | Quote | Section |
|-------|-------|---------|
| Meeting Summarizer | "I turn your meetings into structured summaries." | Meetings Hub |
| Action Item Extractor | "I pull tasks and deadlines from your transcripts." | Meetings Hub |
| Deal Coach | "I help you close deals with strategy and email drafts." | Sales Hub |
| Project Analyst | "I flag project risks before they become problems." | Work Management |
| Knowledge Search | "I find answers across your entire knowledge base." | Knowledge |
| EOS Coach | "I guide your team through L10s, rocks, and IDS." | Strategy |
| Email Draft Assistant | "I draft follow-up emails that get replies." | Sales Hub |
| Operations Advisor | "I spot productivity patterns in your team." | Operations |

### Mobile Behavior

- On mobile (`< lg`): horizontal scroll carousel with snap points, 2 cards visible at a time
- On desktop (`lg+`): 4-column grid, 2 rows

---

### Implementation

**New file: `src/components/landing/AITeamShowcase.tsx`**
- Static array of 8 agent objects with `name`, `avatar` (emoji), `quote`, `section`, `sectionIcon`
- Grid layout: `grid-cols-2 lg:grid-cols-4`
- Each card uses existing `ai-card` class, `AIIndicator` dot, and hover effects
- Section heading with Sparkles icon matching other landing sections
- CTA button at bottom linking to `/login`

**Modified file: `src/pages/Index.tsx`**
- Import and insert `<AITeamShowcase />` between `<FeatureGrid />` and `<SocialProof />`

### Files Changed

| File | Change |
|------|--------|
| `src/components/landing/AITeamShowcase.tsx` | **New** — 8-agent showcase grid |
| `src/pages/Index.tsx` | Add import + render `<AITeamShowcase />` |

