# Edge Function Copy Tool - User Guide

## 🎯 What It Does

This tool allows you to copy edge functions from one Supabase project to another using a simple point-and-click interface. No terminal or CLI required!

---

## 🚀 Quick Start

### **Step 1: Access the Tool**

Open your browser and go to:
```
http://localhost:5173/edge-function-copy
```

Or if deployed:
```
https://your-app.com/edge-function-copy
```

---

### **Step 2: Get Your API Tokens**

You need a **Personal Access Token** from Supabase:

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **"Generate New Token"**
3. Give it a name like "Edge Function Copy Tool"
4. **Copy the token** - you won't see it again!
5. Do this for BOTH source and target projects (can use same token)

---

### **Step 3: Get Project References**

For both source and target projects:

1. Go to your Supabase project dashboard
2. Look at the URL: `https://supabase.com/dashboard/project/[PROJECT-REF]`
3. Copy the `PROJECT-REF` part

**Example:**
- URL: `https://supabase.com/dashboard/project/tjkqvbxtziheggurtvcz`
- Project Ref: `tjkqvbxtziheggurtvcz`

---

### **Step 4: Use the Tool**

#### **4.1 Configure Source Project**

1. Enter **Source Project Ref** (the project you're copying FROM)
2. Enter **Source API Token**
3. Click **"List Functions"**
4. Wait for functions to load

#### **4.2 Select Functions**

You'll see all available functions grouped by category:
- ✅ Green checkmark = Available in source project
- ⚪ Gray circle = Not found in source project

**Options:**
- Click individual checkboxes to select specific functions
- Click **"Select All V1"** to select all 31 framework functions
- Click **"Deselect All"** to start over

#### **4.3 Configure Target Project**

1. Enter **Target Project Ref** (the project you're copying TO)
2. Enter **Target API Token**

#### **4.4 Copy Functions**

1. Review your selection count
2. Click **"Copy X Functions"** button
3. Watch the progress bar
4. Wait for completion

---

## 📊 What Gets Copied

### **V1 Framework Functions (31 total)**

**Foundation (4):**
- validate-api-key
- audit-log-writer
- send-email
- send-notification

**Authentication & Users (2):**
- admin-users
- admin-delete-user

**Clients (1):**
- api-v1-clients

**Meetings & Zoom (6):**
- sync-zoom-files
- zoom-transcript-processing
- generate-meeting-summary
- auto-embed-meetings
- categorize-meeting
- api-v1-meetings

**Knowledge Base (7):**
- google-drive-sync
- google-drive-upload
- user-knowledge-upload
- user-knowledge-drive-sync
- user-knowledge-process
- auto-embed-knowledge-files
- unified-knowledge-search

**AI Agents (8):**
- ai-chat-assistant
- semantic-search
- run-ai-agent
- generate-embeddings
- gemini-corpus-sync
- gemini-rag-query
- generate-business-doc
- generate-sow

**Notifications (2):**
- send-slack-message
- send-feedback-notification

---

## ⚠️ Important Notes

### **What Gets Copied:**
- ✅ Edge function code
- ✅ Function entry points
- ✅ Dependencies

### **What Does NOT Get Copied:**
- ❌ Environment variables (you must set these manually)
- ❌ Database tables
- ❌ Storage buckets
- ❌ RLS policies

---

## 🔧 After Copying Functions

### **1. Set Environment Variables**

Go to your target project and set these secrets:

```bash
# AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...

# Zoom Integration
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
ZOOM_ACCOUNT_ID=...

# Google OAuth & Drive
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# SendGrid (Email)
SENDGRID_API_KEY=...

# Slack (Optional)
SLACK_WEBHOOK_URL=...
```

**How to set secrets:**
1. Go to: https://supabase.com/dashboard/project/[PROJECT-REF]/settings/functions
2. Scroll to "Secrets"
3. Add each environment variable

---

### **2. Create Database Tables**

The edge functions need specific database tables. Run the migrations:

1. Copy migrations from framework to your project
2. Run: `supabase db push` (if using CLI)
3. Or apply migrations via Supabase Dashboard

See: `docs/sj-innovation-framework_setup.md` for database schema.

---

### **3. Test Functions**

Test that functions were copied successfully:

```bash
# List functions
curl https://YOUR_PROJECT.supabase.co/functions/v1/

# Test a simple function
curl https://YOUR_PROJECT.supabase.co/functions/v1/validate-api-key
```

---

## 🐛 Troubleshooting

### **Error: "Failed to fetch functions: 401"**

**Solution:** Your API token is invalid or expired. Generate a new one.

### **Error: "Failed to fetch functions: 403"**

**Solution:** Your token doesn't have permission to access this project. Make sure you're using the right token.

### **Error: "Failed to deploy function: 404"**

**Solution:** Target project ref is incorrect. Double-check the project ref.

### **Error: "Failed to get code for [function]: 404"**

**Solution:** The function doesn't exist in your source project.

### **Some functions failed to copy**

**Solution:** Check the error list. Common issues:
- Rate limiting (wait a few minutes and try again)
- Missing dependencies in source project
- Network timeout (try copying fewer functions at once)

---

## 💡 Pro Tips

### **Tip 1: Copy in Batches**

If copying all 31 functions fails, try copying by category:
1. First: Foundation functions (4)
2. Then: AI functions (8)
3. Then: Meetings (6)
4. etc.

### **Tip 2: Keep Token Secure**

- ❌ Don't share your API token
- ❌ Don't commit it to git
- ✅ Regenerate after use
- ✅ Use separate tokens for different projects

### **Tip 3: Verify Before Production**

After copying:
1. Test each function in the Supabase dashboard
2. Check function logs for errors
3. Verify environment variables are set
4. Test with sample data

---

## 🔗 Related Documentation

- [Supabase Management API](https://supabase.com/docs/reference/api/introduction)
- [Edge Functions Deployment Guide](./sj-innovation-framework_edge-functions-deployment.md)
- [Framework Setup Guide](./sj-innovation-framework_setup.md)

---

## ❓ FAQ

**Q: Can I copy functions between different organizations?**
A: Yes, as long as you have API tokens for both projects.

**Q: Will this overwrite existing functions?**
A: Yes! If a function with the same name exists in the target, it will be updated.

**Q: Can I use this for production?**
A: Yes, but test thoroughly first. Consider using separate projects for staging.

**Q: How long does it take?**
A: About 30-60 seconds for all 31 functions (with rate limiting delays).

**Q: What if I only need some functions?**
A: Just select the ones you need! No requirement to copy all 31.

---

**Happy copying! 🚀**
