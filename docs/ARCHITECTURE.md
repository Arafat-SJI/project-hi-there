# CollabAi Technical Architecture

> **Technical architecture and data flow for CollabAi platform**

---

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   React     │  │  React      │  │  Tailwind   │              │
│  │   Router    │  │  Query      │  │  CSS        │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                         │                                        │
│  ┌─────────────────────────────────────────────────┐            │
│  │              shadcn/ui Components               │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  PostgreSQL │  │    Auth     │  │   Storage   │              │
│  │    + RLS    │  │   Service   │  │   Buckets   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │           Edge Functions (Deno)                 │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   OpenAI    │  │    Zoom     │  │  SendGrid   │              │
│  │     API     │  │     API     │  │    Email    │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3 | UI Framework |
| Vite | 5.x | Build Tool |
| TypeScript | 5.x | Type Safety |
| Tailwind CSS | 3.4 | Styling |
| shadcn/ui | Latest | UI Components |
| React Query | 5.x | Data Fetching |
| React Router | 6.x | Navigation |
| React Hook Form | 7.x | Forms |
| Zod | 3.x | Validation |
| Lucide React | Latest | Icons |
| DOMPurify | 3.x | XSS Protection |

### Backend (Supabase)

| Service | Purpose |
|---------|---------|
| PostgreSQL | Primary database |
| Row Level Security | Data isolation |
| Auth Service | Authentication |
| Storage | File uploads |
| Edge Functions | Serverless logic |
| Realtime | Live subscriptions |

---

## 🗄️ Database Schema

### Entity Relationship

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    Users     │       │   Profiles   │       │  User Roles  │
│  (auth.users)│──────▶│              │◀──────│              │
└──────────────┘       └──────────────┘       └──────────────┘
        │                     │
        │                     │
        ▼                     ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Clients    │       │   Meetings   │       │ Knowledge    │
│              │◀──────│              │       │  Entries     │
└──────────────┘       └──────────────┘       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  Zoom Files  │
                       │              │
                       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │  Embeddings  │
                       │   (Vectors)  │
                       └──────────────┘
```

### Core Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `user_roles`
```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL, -- 'admin' | 'moderator' | 'user'
  created_at TIMESTAMPTZ
);
```

#### `clients`
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT,
  created_by UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `meetings`
```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  organizer_id UUID REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  location TEXT,
  meeting_type TEXT,
  status TEXT,
  zoom_id TEXT,
  zoom_meeting_id TEXT,
  zoom_join_url TEXT,
  zoom_start_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `knowledge_entries`
```sql
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  slug TEXT UNIQUE,
  category_id UUID REFERENCES knowledge_categories(id),
  author_id UUID REFERENCES auth.users(id),
  status TEXT,
  tags TEXT[],
  view_count INTEGER,
  search_vector TSVECTOR,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### `ai_agents`
```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  system_prompt TEXT NOT NULL,
  category TEXT,
  is_enabled BOOLEAN,
  memory_enabled BOOLEAN,
  data_sources JSONB,
  provider_config JSONB,
  required_role app_role,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## 🔐 Security Model

### Row Level Security (RLS)

Every table has RLS enabled with policies based on:

1. **User ownership** - Users can only access their own data
2. **Role-based access** - Admins have broader access
3. **Authenticated access** - Some data visible to all logged-in users

### Security Definer Function

```sql
CREATE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Example RLS Policies

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'));
```

---

## 🔄 Data Flow

### Authentication Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │───▶│ Supabase │───▶│  Profile │───▶│  Role    │
│   Page   │    │   Auth   │    │  Fetch   │    │  Check   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │                               │
                     ▼                               ▼
              ┌──────────┐                    ┌──────────┐
              │  Session │                    │ Redirect │
              │  Created │                    │Dashboard │
              └──────────┘                    └──────────┘
```

### Data Fetching Pattern

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Page   │───▶│   Hook   │───▶│  React   │───▶│ Supabase │
│Component │    │(useQuery)│    │  Query   │    │  Client  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                     │                               │
                     ▼                               ▼
              ┌──────────┐                    ┌──────────┐
              │  Cache   │◀───────────────────│   RLS    │
              │  Update  │                    │  Filter  │
              └──────────┘                    └──────────┘
```

---

## 📁 Project Structure

```
collabai/
├── docs/                      # Documentation
│   ├── README.md              # Documentation index
│   ├── QUICKSTART.md          # Quick start guide
│   ├── DEPLOYMENT.md          # Deployment checklist
│   ├── ARCHITECTURE.md        # This file
│   ├── ADMIN-GUIDE.md         # Admin configuration
│   └── product-backlog.md     # Product roadmap
│
├── public/                    # Static assets
│   └── robots.txt
│
├── src/
│   ├── components/
│   │   ├── auth/              # Auth components
│   │   │   ├── AdminRoute.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── TopNav.tsx
│   │   └── ui/                # shadcn/ui (51 components)
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication state
│   │
│   ├── hooks/
│   │   ├── useClients.ts      # Clients data
│   │   ├── useMeetings.ts     # Meetings data
│   │   ├── useKnowledge.ts    # Knowledge data
│   │   └── use-toast.ts       # Toast notifications
│   │
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts      # Supabase client
│   │       └── types.ts       # Generated types
│   │
│   ├── lib/
│   │   ├── utils.ts           # Core utilities
│   │   ├── validation.ts      # Form validation
│   │   ├── sanitize.ts        # XSS protection
│   │   └── cache.ts           # Cache utilities
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   ├── Clients.tsx        # Clients list
│   │   ├── ClientForm.tsx     # Client add/edit
│   │   ├── ClientDetail.tsx   # Client details
│   │   ├── Meetings.tsx       # Meetings list
│   │   ├── MeetingForm.tsx    # Meeting add/edit
│   │   ├── MeetingDetail.tsx  # Meeting details
│   │   ├── Knowledge.tsx      # Knowledge base
│   │   ├── AIChat.tsx         # AI assistant
│   │   ├── Admin.tsx          # Admin panel
│   │   ├── Login.tsx          # Login page
│   │   ├── Signup.tsx         # Signup page
│   │   └── NotFound.tsx       # 404 page
│   │
│   ├── App.tsx                # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Global styles
│
├── supabase/
│   ├── config.toml            # Supabase config
│   ├── migrations/            # Database migrations
│   └── functions/             # Edge functions (coming)
│       ├── ai-chat/
│       ├── meeting-processor/
│       └── knowledge-search/
│
├── index.html                 # HTML entry
├── package.json               # Dependencies
├── tailwind.config.ts         # Tailwind config
├── tsconfig.json              # TypeScript config
└── vite.config.ts             # Vite config
```

---

## ⚡ Performance Patterns

### React Query Caching

```typescript
// Query with 5-minute cache
const { data: clients } = useQuery({
  queryKey: ['clients'],
  queryFn: fetchClients,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Lazy Loading

```typescript
// Lazy load heavy components
const AIChat = lazy(() => import('./pages/AIChat'));
```

### Optimistic Updates

```typescript
// Update UI immediately, sync later
useMutation({
  onMutate: async (newClient) => {
    queryClient.setQueryData(['clients'], (old) => [...old, newClient]);
  },
});
```

---

## 🔌 Integration Points

### OpenAI Integration

```typescript
// Edge function calls OpenAI
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: message }],
  }),
});
```

### Zoom Integration

```typescript
// Server-to-Server OAuth
const token = await getZoomAccessToken();
const recordings = await fetch(
  `https://api.zoom.us/v2/users/me/recordings`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## 📊 Monitoring

### Supabase Dashboard

- **Database:** Query performance, table sizes
- **Auth:** Login attempts, user activity
- **Edge Functions:** Invocations, errors, latency
- **Storage:** Bucket usage, file counts

### Browser DevTools

- **Console:** Client-side errors
- **Network:** API request timing
- **Performance:** Render metrics

---

**Built with Lovable + Supabase** ❤️
