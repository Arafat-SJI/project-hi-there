# Plan: ClickUp-Brain²-Style Pitch Deck → CollabAI Control Tower Edition

Rebuild `/mnt/documents/collabai-pitch-deck.pptx` (+ `.pdf`) mirroring the narrative arc of ClickUp's `meet-brain.html`, but with two key shifts:

1. **"Brain" → "Knowledge Base"** everywhere
2. **Lead story = Control Tower unifies scattered tools** (CRM + Jira + Meetings + Docs + Drive + Teams → one analytical view). The Knowledge Base is what makes that unified view *intelligent*.

**No pricing. No $ figures. No seat counts. Anywhere.**

## Core narrative

> Your data lives in 10+ tools — HubSpot, Salesforce, Jira, Confluence, Zoom, Teams, Drive, SharePoint, ActiveCollab, Outlook. None of them talk to each other. Your team can't see the whole picture, so decisions get made blind.
>
> **CollabAI Control Tower** connects every app you already use, pulls the data into one analytical view, and powers it with a **Knowledge Base** that already knows your work.

## Capability mapping (ClickUp Brain² claim → CollabAI reality)

| ClickUp says | CollabAI Control Tower equivalent |
|---|---|
| "Your company's AI" | Multi-tenant Knowledge Base with RLS, SSO, pgVector org memory |
| "Personality" | Prompt Templates + Agent Personalizations + user memory |
| "Every model, one Brain" | Multi-provider routing (OpenAI, Claude, Gemini, Lovable AI) — all query the same KB |
| "Already knows the work" | RAG over Meetings, Docs, Projects, Deals, Tasks (`unified_documents` + embeddings) |
| "Slides / Artifacts" | KB-powered agents generate decks, briefs, exec summaries |
| "Super Agents 24/7" | 24+ specialized agents reading from your KB |
| "Connected apps & MCP" | 20+ integrations + MCP |
| "Build any system" | Knowledge categories, personal + org KB, semantic search, agent teams |

## Deck structure (10 slides — no pricing)

1. **Cover** — "One Control Tower for every tool your team already uses." + booking pill
2. **The problem: your data is scattered** — visual: 10 disconnected app logos floating in chaos, with a frustrated stat ("Teams check 6+ tools to answer one question"). Sets up the pain.
3. **The fix: one place to see everything** — Control Tower diagram: CRM + Jira + Meetings + Docs + Drive + Teams → **Control Tower** → unified analytical view (deals, projects, meetings, KPIs side-by-side)
4. **Three things no other platform matches** — Unified View · Knowledge Base · Agentic Action (tri-column)
5. **It doesn't just show data. It does the work.** — 6-tile grid: Unified Analytics · Semantic Search · Auto-Indexed Meetings · Generated Artifacts · Agent-Ready Context · MCP & Integrations
6. **One Knowledge Base, every model** — provider row (OpenAI · Claude · Gemini · Lovable AI) + "auto-routed or hand-picked", all querying the same KB
7. **Connected to everything you already use** — integration logo wall: HubSpot, Salesforce, Zoho, Jira, Confluence, ActiveCollab, Zoom, Teams, Meet, Slack, Drive, SharePoint, Outlook, ClickUp, MCP — with a sub-line: *"We don't replace your stack. We make it visible."*
8. **24+ specialized agents read from your unified KB** — sample agent cards (Deal Coach, Meeting Summarizer, Project Risk Analyst, etc.)
9. **Enterprise-grade by default** — SSO (Google/Azure/SAML), RLS multi-tenant, audit logs, private/on-prem deployment, signed-URL storage
10. **CTA** — "Book a 20-min demo" + `https://collabai.software/book-demo` + QR code

## Design

- Palette: deep navy `#0F172A` cover/CTA, white body, cyan `#06B6D4` accent, slate `#64748B` secondary
- Bold display headers, oversized stats, cyan pulse-dot prefix on section labels
- No accent underlines beneath titles (AI-tell)
- Every slide has a visual: icon grids, logo wall, scattered-vs-unified diagram, agent cards, provider row

## Technical execution

- Reuse `/tmp/build_deck.js` (pptxgenjs + qrcode); rewrite slide definitions
- Embed all images base64 (LibreOffice PDF requirement)
- Build PPTX → LibreOffice (`--env:UserInstallation=file:///tmp/lohome`) → PDF → `pdftoppm` JPEGs
- QA: visually inspect every slide AND grep PPTX text for `$|price|pricing|cost|/seat|/user/mo` to guarantee zero pricing leakage; fix and re-render before delivering
- Deliver `<presentation-artifact>` links for both `.pptx` and `.pdf`

## Out of scope
- No app code changes
- No pricing of any kind
- No client-specific branding

Approve and I'll build it.
