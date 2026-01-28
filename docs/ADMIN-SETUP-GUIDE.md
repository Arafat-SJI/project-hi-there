# Admin Setup Guide

> **Quick Reference**: Get admin access and manage user roles
> **Last Updated**: January 28, 2026
> **Applies To**: SJ Control Tower Framework v2.0+

---

## 🚀 Quick Start - Get Admin Access Now

### For New Installations (No Admins Yet)

The **first user to sign up** will automatically become an admin (if migration is applied).

1. Deploy the application
2. Sign up with your admin email
3. You'll automatically have admin access
4. Navigate to `/admin` to verify

### For Existing Installations (Manual Promotion)

#### Option 1: Direct SQL (Fastest - 2 minutes)

1. **Get your user ID**:
   - Open Supabase Dashboard → Authentication → Users
   - Find your account and copy the User ID (UUID)

2. **Run this SQL** in Supabase Dashboard → SQL Editor:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_ID_HERE', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

3. **Refresh your browser** (Ctrl+Shift+R or Cmd+Shift+R)

4. **Navigate to** `/admin` - you should see the admin panel ✅

#### Option 2: Edge Function (Programmatic - 5 minutes)

If the `promote-first-admin` function is deployed:

```bash
# Get your user ID first
curl -X GET 'YOUR_SUPABASE_URL/auth/v1/user' \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_ANON_KEY"

# Promote to admin
curl -X POST 'YOUR_SUPABASE_URL/functions/v1/promote-first-admin' \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID"}'
```

#### Option 3: Via User Management (If You Have Admin Access)

If someone else is already an admin:

1. Have the admin navigate to `/admin/users`
2. Click "Edit" on your account
3. Change role to "admin"
4. Click "Update"

---

## 📋 Setup Methods

### Method 1: Automated First Admin (Recommended)

**When to use**: New deployments, staging environments, fresh databases.

**Prerequisites**:
- Migration `20260128_auto_first_admin.sql` applied
- No existing admins

**How it works**:
1. Database trigger watches for new user signups
2. First user → automatically assigned `admin` role
3. Subsequent users → automatically assigned `user` role
4. No manual intervention required

**Apply the migration**:
```bash
# Push migrations to database
supabase db push

# Or reset database (⚠️ WARNING: Deletes all data!)
supabase db reset
```

**Verify**:
```sql
-- Check the trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_assign_role';

-- Check all users and their roles
SELECT
  u.email,
  ur.role,
  u.created_at
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
ORDER BY u.created_at ASC;
```

---

### Method 2: Manual SQL Assignment

**When to use**: Quick fixes, production databases with existing users.

**Step-by-step**:

1. **Identify users** who need admin access:
   ```sql
   -- List all users
   SELECT id, email, created_at
   FROM auth.users
   ORDER BY created_at ASC;
   ```

2. **Grant admin role**:
   ```sql
   -- Single user
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('USER_UUID_HERE', 'admin')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

3. **Bulk promotion** (multiple users):
   ```sql
   -- Promote multiple users by email
   INSERT INTO public.user_roles (user_id, role)
   SELECT u.id, 'admin'::app_role
   FROM auth.users u
   WHERE u.email IN (
     'admin1@example.com',
     'admin2@example.com',
     'admin3@example.com'
   )
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

4. **Update existing role**:
   ```sql
   -- Change a user's role from 'user' to 'admin'
   UPDATE public.user_roles
   SET role = 'admin'
   WHERE user_id = 'USER_UUID_HERE';
   ```

---

### Method 3: Edge Function Promotion

**When to use**: Programmatic access, API integrations, scripts.

**Available Functions**:

#### 1. `promote-first-admin` - Emergency Promotion
- No authentication required (use service role key)
- Can promote any user by ID
- Use for initial setup

**Example**:
```javascript
const response = await fetch('YOUR_SUPABASE_URL/functions/v1/promote-first-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
  },
  body: JSON.stringify({ userId: 'USER_UUID' })
});

const result = await response.json();
console.log(result);
// { success: true, message: "Admin role granted to user@example.com", ... }
```

#### 2. `promote-to-admin` - Secure Admin-Only Promotion
- Requires admin authentication
- Logs all role changes
- Production-ready

**Example**:
```javascript
const response = await fetch('YOUR_SUPABASE_URL/functions/v1/promote-to-admin', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${USER_ACCESS_TOKEN}` // Admin's JWT token
  },
  body: JSON.stringify({
    targetUserId: 'USER_TO_PROMOTE_UUID',
    newRole: 'admin' // or 'moderator' or 'user'
  })
});

const result = await response.json();
console.log(result);
// { success: true, message: "User promoted to admin", ... }
```

---

### Method 4: Via User Management UI

**When to use**: Day-to-day user management by admins.

**Steps**:

1. Log in as an admin
2. Navigate to `/admin/users`
3. Find the user you want to promote
4. Click the "Edit" button (pencil icon)
5. Select new role from dropdown:
   - **admin** - Full access to admin panel
   - **moderator** - Limited admin access (configurable)
   - **user** - Standard user access (no admin panel)
6. Click "Update"
7. User's role is immediately updated
8. Change is logged in `activity_logs` table

**Features**:
- ✅ Real-time updates
- ✅ Audit logging
- ✅ Role validation
- ✅ Bulk actions support
- ✅ Search and filter users

---

## 🔍 Troubleshooting

### Issue: "Access Denied" After Login

**Symptoms**:
- User can log in successfully
- Navigating to `/admin` shows "Access Denied" page
- User should have admin access but doesn't

**Cause**: Missing or incorrect role in `user_roles` table.

**Diagnosis**:
```sql
-- Check user's role
SELECT
  u.id,
  u.email,
  ur.role,
  CASE
    WHEN ur.role IS NULL THEN '❌ No role assigned'
    ELSE '✅ Role: ' || ur.role
  END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'your-email@example.com';
```

**Fix**:
```sql
-- Option A: User has no role (insert)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com';

-- Option B: User has wrong role (update)
UPDATE public.user_roles ur
SET role = 'admin'
FROM auth.users u
WHERE ur.user_id = u.id
AND u.email = 'your-email@example.com';
```

**Then**: Clear browser cache and refresh (Ctrl+Shift+R)

---

### Issue: Admin Panel Not Visible in Navigation

**Symptoms**:
- No "Admin" link in navigation menu
- Direct access to `/admin` works

**Cause**: Frontend routing issue or role not loaded.

**Fix**:
1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear cache**: Browser DevTools → Application → Clear storage
3. **Re-login**: Sign out and sign back in
4. **Check console**: Look for errors in browser console (F12)

**Verify role is loaded**:
```javascript
// In browser console
console.log(localStorage.getItem('sb-auth-token'));
// Should show a JWT token

// Decode the token at https://jwt.io
// Check if profile includes role field
```

---

### Issue: Multiple Users, No Admins

**Symptoms**:
- Database has multiple users
- None have admin role
- Can't access admin panel

**Fix** (Choose one):

**Option 1 - Promote earliest user**:
```sql
-- Make the first registered user an admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ORDER BY created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;
```

**Option 2 - Promote specific user**:
```sql
-- Promote by email
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'intended-admin@example.com';
```

**Option 3 - Promote all existing users** (⚠️ Use carefully):
```sql
-- Make all current users admins (emergency only!)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;
```

---

### Issue: Trigger Not Working (Auto-assign)

**Symptoms**:
- New users sign up
- No role assigned automatically
- Manual assignment still required

**Diagnosis**:
```sql
-- Check if trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_assign_role';

-- Check if function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'auto_assign_first_admin';
```

**Fix**:
```bash
# Re-apply the migration
supabase db push

# Or manually create trigger
supabase db reset  # ⚠️ Deletes all data!
```

**Test the trigger**:
1. Create a test user via signup
2. Check `user_roles` table immediately:
   ```sql
   SELECT * FROM public.user_roles
   ORDER BY created_at DESC
   LIMIT 5;
   ```

---

### Issue: Role Changes Not Reflecting

**Symptoms**:
- Role updated in database
- User still sees old permissions
- Admin panel still shows "Access Denied"

**Cause**: Session/token caching.

**Fix (in order of severity)**:

1. **Hard refresh page**: Ctrl+Shift+R
2. **Clear browser cache**: DevTools → Application → Clear storage
3. **Sign out and back in**
4. **Clear all storage**:
   ```javascript
   // In browser console
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
5. **Invalidate session** (nuclear option):
   ```sql
   -- Sign out user from all sessions
   DELETE FROM auth.sessions
   WHERE user_id = 'USER_UUID';
   ```

---

## 🔐 Security Best Practices

### ✅ DO: Recommended Practices

1. **Limit Admin Accounts**
   - Only grant admin to trusted users
   - Use moderator role for limited access
   - Regularly audit admin list:
     ```sql
     SELECT u.email, ur.role, ur.created_at
     FROM public.user_roles ur
     JOIN auth.users u ON ur.user_id = u.id
     WHERE ur.role = 'admin'
     ORDER BY ur.created_at DESC;
     ```

2. **Log All Role Changes**
   - Already implemented in `promote-to-admin` function
   - Review activity logs regularly:
     ```sql
     SELECT
       al.created_at,
       u.email as admin_email,
       al.action,
       al.metadata->>'target_user_email' as target_email,
       al.metadata->>'old_role' as old_role,
       al.metadata->>'new_role' as new_role
     FROM activity_logs al
     JOIN auth.users u ON al.user_id = u.id
     WHERE al.action = 'user_role_updated'
     ORDER BY al.created_at DESC
     LIMIT 50;
     ```

3. **Use Least Privilege**
   - Don't make everyone an admin
   - Use `user` role as default
   - Use `moderator` for partial access

4. **Monitor Admin Activity**
   - Review activity_logs table weekly
   - Set up alerts for sensitive actions
   - Track login patterns

5. **Secure Edge Functions**
   - Always verify JWT tokens
   - Check caller's role before allowing actions
   - Use service role key only server-side

---

### ❌ DON'T: Dangerous Practices

1. **❌ Don't Grant Admin to All Users**
   ```sql
   -- DANGEROUS - Don't do this!
   UPDATE public.user_roles SET role = 'admin';
   ```

2. **❌ Don't Disable RLS on user_roles**
   ```sql
   -- DANGEROUS - Don't do this!
   ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
   ```

3. **❌ Don't Expose Service Role Key**
   ```javascript
   // DANGEROUS - Never expose service role key to frontend!
   const supabase = createClient(url, SERVICE_ROLE_KEY);
   ```

4. **❌ Don't Skip Authentication in Edge Functions**
   ```typescript
   // DANGEROUS - Always verify the caller!
   // BAD:
   serve(async (req) => {
     const { userId } = await req.json();
     // Promote without checking who's calling!
   });

   // GOOD:
   serve(async (req) => {
     const token = req.headers.get("Authorization");
     const { user } = await supabase.auth.getUser(token);
     // Verify user is admin before proceeding
   });
   ```

5. **❌ Don't Hardcode Admin Emails in Code**
   ```javascript
   // DANGEROUS - Email-based access control is insecure
   if (user.email === 'admin@example.com') {
     // Grant access
   }
   // Use role-based access control instead!
   ```

---

## 📊 Role Hierarchy

| Role | Access Level | Admin Panel | Manage Users | Modify Settings | Create Content |
|------|-------------|-------------|--------------|-----------------|----------------|
| **admin** | Full | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **moderator** | Limited | ✅ Yes | ❌ No | ⚠️ Partial | ✅ Yes |
| **user** | Standard | ❌ No | ❌ No | ❌ No | ⚠️ Own content |

### Admin Capabilities
- Full access to `/admin/*` routes
- User management (create, edit, delete, role assignment)
- System settings configuration
- View all analytics dashboards
- Manage integrations (Microsoft, Zoom, etc.)
- AI model configuration
- Deployment and environment management

### Moderator Capabilities
- Access to `/admin/*` routes
- View users (read-only or limited edit)
- Content moderation
- View analytics
- Cannot change system settings
- Cannot manage other admins

**Note**: Currently admin and moderator have same access. Differentiation can be added via permission system.

### User Capabilities
- Access to main application
- Manage own profile
- Create/edit own content
- Use AI features
- No admin panel access

---

## 🧪 Testing & Verification

### Verify Auto-Assignment Works

1. **Check trigger exists**:
   ```sql
   SELECT * FROM information_schema.triggers
   WHERE trigger_name = 'on_auth_user_created_assign_role';
   ```

2. **Create test user**:
   - Sign up with test email
   - Should automatically get a role

3. **Verify in database**:
   ```sql
   SELECT u.email, ur.role, ur.created_at
   FROM auth.users u
   LEFT JOIN public.user_roles ur ON u.id = ur.user_id
   WHERE u.email = 'test@example.com';
   ```

4. **Test first user = admin**:
   ```bash
   # Reset database
   supabase db reset

   # Sign up first user → should be admin
   # Sign up second user → should be user
   ```

---

### Verify Manual Promotion Works

1. **Promote via SQL**:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'test@example.com';
   ```

2. **Check result**:
   ```sql
   SELECT * FROM public.user_roles WHERE user_id = (
     SELECT id FROM auth.users WHERE email = 'test@example.com'
   );
   ```

3. **Test access**:
   - Log in as promoted user
   - Navigate to `/admin`
   - Should see admin dashboard (not "Access Denied")

---

### Verify Edge Functions Work

1. **Test promote-first-admin**:
   ```bash
   curl -X POST 'http://localhost:54321/functions/v1/promote-first-admin' \
     -H "Content-Type: application/json" \
     -d '{"userId": "USER_UUID"}'
   ```

2. **Test promote-to-admin** (requires admin token):
   ```bash
   curl -X POST 'http://localhost:54321/functions/v1/promote-to-admin' \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"targetUserId": "USER_UUID", "newRole": "admin"}'
   ```

3. **Check activity logs**:
   ```sql
   SELECT * FROM activity_logs
   WHERE action = 'user_role_updated'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

---

## 🆘 Emergency Recovery

### Scenario: Completely Locked Out (No Admins)

**Option 1 - Direct Database Access**:
```sql
-- Find a user to promote
SELECT id, email, created_at FROM auth.users
ORDER BY created_at ASC;

-- Promote them to admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_FROM_ABOVE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**Option 2 - Create New Admin via SQL**:
```sql
-- Create a new user directly (bypass normal signup)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'emergency-admin@yourdomain.com',
  crypt('TEMP_PASSWORD_123', gen_salt('bf')),
  now(),
  now(),
  now()
)
RETURNING id;

-- Then grant admin role with the returned ID
INSERT INTO public.user_roles (user_id, role)
VALUES ('ID_FROM_ABOVE', 'admin');
```

**Option 3 - Reset Entire Database** (⚠️ NUCLEAR):
```bash
# WARNING: This deletes ALL data!
supabase db reset
```

---

## 📚 Related Documentation

- [Admin Panel Features](./development/ADMIN-PANEL-DETAILED.md) - Complete list of 22 admin pages
- [Admin Panel Fix Plan](./development/ADMIN-PANEL-FIX-PLAN.md) - Detailed fix implementation
- [Phase 2: Foundation](./development/PHASE-02-FOUNDATION.md) - Authentication architecture
- [Phase 6: Advanced Features](./development/PHASE-06-ADVANCED-FEATURES.md) - Admin features

---

## 💡 Future Enhancements

### Short Term (Next Sprint)
- [ ] Add "Promote to Admin" button in UI with confirmation modal
- [ ] Email notification when user role changes
- [ ] Admin dashboard widget showing role distribution pie chart

### Medium Term (Next Month)
- [ ] Granular permissions system (beyond 3 roles)
- [ ] Custom roles (e.g., `billing_admin`, `content_moderator`)
- [ ] Temporary role assignments with auto-expiration
- [ ] Two-factor authentication requirement for admins

### Long Term (Next Quarter)
- [ ] Full RBAC (Role-Based Access Control) with permission matrix
- [ ] Role templates and inheritance
- [ ] IP whitelisting for admin routes
- [ ] SOC 2 / GDPR compliance audit logs
- [ ] Admin session timeout and re-authentication

---

## ❓ Frequently Asked Questions

**Q: Can I have multiple admins?**
A: Yes! There's no limit. Use the User Management page to promote multiple users to admin.

**Q: What happens if I demote all admins?**
A: You'll be locked out of the admin panel. Use emergency recovery procedures to promote someone back to admin.

**Q: Can users see who the admins are?**
A: No. RLS policies prevent non-admins from querying the `user_roles` table for other users.

**Q: How do I demote an admin to a regular user?**
A: Navigate to `/admin/users`, click "Edit" on the admin, change role to "user", and save. Always ensure at least one admin remains!

**Q: Is there a "super admin" that can't be demoted?**
A: No, all admins have equal power. Be careful not to demote yourself if you're the only admin!

**Q: Can admins delete other admins?**
A: Yes, but this is dangerous. Consider adding a safeguard to prevent deleting the last admin.

**Q: Do role changes take effect immediately?**
A: Yes in the database, but users may need to refresh their browser or re-login for the UI to reflect changes.

**Q: Can I automate role assignment based on email domain?**
A: Yes! Modify the `auto_assign_first_admin()` function to check email domains:
```sql
IF NEW.email LIKE '%@yourdomain.com' THEN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
END IF;
```

**Q: How do I see all role changes that happened?**
A: Query the activity_logs table:
```sql
SELECT * FROM activity_logs
WHERE action = 'user_role_updated'
ORDER BY created_at DESC;
```

**Q: Is it safe to run the auto-assignment migration in production?**
A: Yes, but only if you don't have existing admins. If admins exist, skip the trigger creation.

**Q: What's the difference between admin and moderator?**
A: Currently they have the same access. You can customize permissions in `AdminRoute.tsx` and individual page components to differentiate them.

---

**Last Updated**: January 28, 2026
**Maintained By**: Development Team
**Review Schedule**: Monthly
**Support**: For issues, see Emergency Recovery section above
