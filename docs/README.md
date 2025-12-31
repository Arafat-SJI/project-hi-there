# CollabAi Documentation

> **Enterprise-grade collaboration platform built with Lovable + Supabase**

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| [**QUICKSTART.md**](./QUICKSTART.md) | Getting started guide for new deployments |
| [**product-backlog.md**](./product-backlog.md) | Product roadmap and feature backlog |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | Technical architecture and data flow |
| [**DEPLOYMENT.md**](./DEPLOYMENT.md) | Deployment checklist for new clients |
| [**ADMIN-GUIDE.md**](./ADMIN-GUIDE.md) | Admin configuration and user management |

---

## 🎯 Platform Overview

**CollabAi** is a configurable multi-tenant SaaS platform for internal company use, built on:

- **Frontend:** React 18 + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Development:** Lovable.dev (AI-powered development platform)

### Core Modules

| Module | Description | Status |
|--------|-------------|--------|
| **Dashboard** | KPIs, quick actions, activity feed | ✅ Complete |
| **Clients** | Client/company management with CRUD | ✅ Complete |
| **Meetings** | Meeting scheduling with Zoom fields | ✅ Complete |
| **Knowledge Base** | Searchable knowledge entries | ✅ Complete |
| **AI Chat** | AI assistant interface | ✅ Complete |
| **Admin Panel** | User/role/config management | ✅ Complete |

---

## 🚀 Quick Start

### For New Deployments

1. **Fork/clone the project** in Lovable
2. **Connect Supabase** (auto-provisioned or external)
3. **Configure branding** via Admin Panel
4. **Enable features** as needed
5. **Invite users** and assign roles
6. **Publish** to production

See [QUICKSTART.md](./QUICKSTART.md) for detailed steps.

---

## 🔐 Authentication

### Demo Accounts

| Email | Role | Password |
|-------|------|----------|
| `demo@collabai.software` | User | `Demo@123` |
| `admin@collabai.software` | Admin | `Admin@123` |

### Supported Auth Methods

- ✅ Email/Password
- ✅ Google OAuth (requires configuration)
- 🔲 Magic Link (coming soon)

---

## 📊 Database Schema

The platform uses 14 core tables with Row Level Security (RLS):

```
profiles          - User profile information
user_roles        - Role assignments (admin, moderator, user)
clients           - Client/company data
meetings          - Meeting records
zoom_files        - Zoom recordings/transcripts
knowledge_entries - Knowledge base articles
knowledge_categories - Article categories
ai_agents         - AI agent configurations
ai_agent_runs     - AI execution logs
ai_chat_history   - Chat conversations
embeddings        - Vector embeddings for RAG
feedback          - User feedback
notifications     - User notifications
roles             - Role definitions
```

---

## ⚙️ Technology Stack

### Frontend

- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components (51 components)
- **React Query** - Data fetching & caching
- **React Router v6** - Navigation
- **React Hook Form + Zod** - Form handling
- **Lucide React** - Icons

### Backend (Supabase)

- **PostgreSQL** - Database with RLS
- **Supabase Auth** - Authentication
- **Supabase Storage** - File storage
- **Edge Functions** - Serverless logic (Deno)

### Development

- **Lovable.dev** - AI-powered development
- **GitHub** - Version control

---

## 🔧 Configuration

### Environment Variables

The following secrets are configured in Supabase:

| Secret | Required | Purpose |
|--------|----------|---------|
| `SUPABASE_URL` | ✅ Auto-set | Project URL |
| `SUPABASE_ANON_KEY` | ✅ Auto-set | Public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Auto-set | Admin API key |
| `OPENAI_API_KEY` | ✅ For AI | OpenAI integration |
| `ZOOM_CLIENT_ID` | 🔲 Optional | Zoom integration |
| `ZOOM_CLIENT_SECRET` | 🔲 Optional | Zoom integration |
| `ZOOM_ACCOUNT_ID` | 🔲 Optional | Zoom integration |
| `GOOGLE_CLIENT_ID` | 🔲 Optional | Google Drive sync |
| `GOOGLE_CLIENT_SECRET` | 🔲 Optional | Google Drive sync |
| `SENDGRID_API_KEY` | 🔲 Optional | Email notifications |
| `SLACK_WEBHOOK_URL` | 🔲 Optional | Slack notifications |

---

## 📁 Project Structure

```
collabai/
├── docs/                    # Documentation
├── public/                  # Static assets
├── src/
│   ├── components/
│   │   ├── auth/            # Authentication components
│   │   ├── layout/          # Layout (Sidebar, TopNav)
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React contexts (Auth)
│   ├── hooks/               # Custom hooks
│   ├── integrations/        # Supabase client
│   ├── lib/                 # Utilities
│   └── pages/               # Page components
├── supabase/
│   ├── functions/           # Edge functions (coming)
│   └── migrations/          # Database migrations
├── index.html
├── package.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## 🚀 Deployment

### Lovable Deployment

1. Click **Publish** in Lovable
2. Configure custom domain (optional)
3. Enable SSL (automatic)

### Client Deployment Checklist

See [DEPLOYMENT.md](./DEPLOYMENT.md) for the complete checklist:

- [ ] Supabase project configured
- [ ] Admin account created
- [ ] Branding configured
- [ ] Features enabled
- [ ] Users invited

---

## 📞 Support

- **Documentation:** This folder (`/docs`)
- **Lovable Docs:** https://docs.lovable.dev
- **Supabase Docs:** https://supabase.com/docs

---

**Version:** 1.0.0  
**Last Updated:** 2024-12-31  
**Built with ❤️ using Lovable + Supabase**
