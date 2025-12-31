# Next Steps After Copying Edge Functions

> **You've successfully copied the edge functions! Here's what to do next.**

---

## ✅ What You've Completed

- ✅ Copied 31 V1 edge functions to your new Supabase project
- ✅ Functions are deployed and ready to configure

---

## 🚀 Immediate Next Steps (Required)

### **1. Set Environment Variables** ⚠️ **CRITICAL**

Your edge functions won't work without these environment variables!

**Go to your Supabase project:**
```
https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/settings/functions
```

**Scroll to "Secrets" and add these:**

#### **Required for AI Features:**
```bash
OPENAI_API_KEY=sk-proj-...
```
- Get from: https://platform.openai.com/api-keys
- Required for: AI chat, semantic search, embeddings, summaries

#### **Optional - Gemini (Alternative AI):**
```bash
GEMINI_API_KEY=...
```
- Get from: https://aistudio.google.com/app/apikey
- Used as fallback/alternative to OpenAI

#### **Required for Zoom Integration:**
```bash
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
ZOOM_ACCOUNT_ID=...
```
- Get from: https://marketplace.zoom.us/
- Required for: Meeting sync, transcripts

#### **Required for Google Drive:**
```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```
- Get from: https://console.cloud.google.com/
- Required for: Knowledge base Google Drive sync

#### **Required for Email:**
```bash
SENDGRID_API_KEY=...
```
- Get from: https://app.sendgrid.com/settings/api_keys
- Required for: Email notifications

#### **Optional - Slack:**
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```
- Get from: https://api.slack.com/messaging/webhooks
- Required for: Slack notifications

#### **Auto-set by Supabase (verify these exist):**
```bash
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

---

### **2. Create Database Tables** ⚠️ **CRITICAL**

The edge functions need specific database tables to function.

**Option A: Use Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/editor
2. Click "SQL Editor"
3. Copy and paste the SQL schema from the framework
4. Run the migration

**Option B: Use Migrations (if you have CLI)**

```bash
cd your-project
supabase db push
```

**Required Tables for V1:**
```
- profiles (user profiles)
- roles (role definitions)
- user_roles (user-role assignments)
- clients (client/company management)
- meetings (meeting records)
- zoom_files (Zoom recordings and transcripts)
- knowledge_entries (knowledge base)
- knowledge_categories (KB categories)
- embeddings (vector embeddings for AI)
- ai_agents (AI agent configurations)
- ai_agent_runs (agent execution history)
- ai_chat_history (chat conversations)
- notifications (user notifications)
- feedback (user feedback)
- audit_logs (activity tracking)
```

**See:** `docs/sj-innovation-framework_architecture.md` for complete schema

---

### **3. Test Edge Functions**

Verify functions are working:

**Test via Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/functions
2. Click on a function (e.g., "validate-api-key")
3. Click "Invoke" to test

**Test via API:**
```bash
# Test a simple function
curl https://[YOUR-PROJECT].supabase.co/functions/v1/validate-api-key

# Test AI chat (requires OPENAI_API_KEY)
curl -X POST https://[YOUR-PROJECT].supabase.co/functions/v1/ai-chat-assistant \
  -H "Authorization: Bearer [YOUR-ANON-KEY]" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "session_id": "test-123"}'
```

**Check function logs:**
https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/logs/edge-functions

---

## 📋 Optional But Recommended

### **4. Set Up Frontend**

Now that backend is ready, set up the frontend:

**If using this framework:**
1. Update `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://[your-project].supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbG...
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start dev server:
   ```bash
   npm run dev
   ```

**If starting fresh:**
- See: `docs/QUICKSTART_LOVABLE.md` for frontend setup guide

---

### **5. Configure Authentication**

Set up Google OAuth (optional but recommended):

1. Go to: https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/auth/providers
2. Enable "Google" provider
3. Add your Google OAuth credentials
4. Add redirect URLs:
   - http://localhost:5173 (development)
   - https://your-production-url.com (production)

---

### **6. Create Storage Buckets**

For file uploads, create these buckets:

**Go to:** https://supabase.com/dashboard/project/[YOUR-PROJECT-REF]/storage/buckets

**Create:**
1. **user-knowledge** (private)
   - For user file uploads

2. **zoom-recordings** (private)
   - For Zoom meeting files

3. **knowledge-files** (private)
   - For knowledge base files

**Set RLS policies** for each bucket according to your needs.

---

## 🎯 Verification Checklist

Before going to production, verify:

- [ ] All environment variables are set
- [ ] Database tables are created
- [ ] At least one edge function tested successfully
- [ ] Authentication is configured (if using)
- [ ] Storage buckets are created (if using file uploads)
- [ ] Function logs show no errors
- [ ] Frontend connects to Supabase successfully
- [ ] Test user can sign up/login
- [ ] Test AI features work (if using)

---

## 📚 Additional Resources

### **Documentation:**
- [Framework Architecture](./sj-innovation-framework_architecture.md)
- [Setup Guide](./sj-innovation-framework_setup.md)
- [Edge Functions Guide](./sj-innovation-framework_edge-functions-deployment.md)
- [AI Agents Module](./sj-innovation-framework_ai-agents.md)
- [Knowledge Base Module](./sj-innovation-framework_knowledge-base.md)
- [Meetings/Zoom Module](./sj-innovation-framework_meetings-zoom.md)

### **Troubleshooting:**

**Functions returning 500 error?**
- Check environment variables are set
- Check function logs for specific error
- Verify database tables exist

**AI functions not working?**
- Verify `OPENAI_API_KEY` is set correctly
- Check you have API credits
- Try Gemini as alternative (`GEMINI_API_KEY`)

**Database queries failing?**
- Verify tables are created
- Check RLS policies allow operation
- Verify user is authenticated (if required)

---

## 🚀 Ready to Build!

You now have:
- ✅ 31 deployed edge functions
- ✅ Backend infrastructure ready
- ✅ Clear next steps to follow

**What to build next?**
1. Set up authentication
2. Create your first client
3. Test AI features
4. Customize for your use case

**Need help?** Check the documentation or create an issue on GitHub.

---

**Happy building! 🎉**
