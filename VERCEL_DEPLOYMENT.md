# Deployment Guide - Glydus CRM on Vercel with Supabase

## Quick Start

This guide walks you through deploying your Glydus CRM application to Vercel with Supabase real-time sync and WhatsApp integration.

## Prerequisites

✅ Supabase account (https://supabase.com)
✅ Vercel account (https://vercel.com)
✅ GitHub account with repository
✅ Git installed locally

## Step 1: Prepare Supabase

### 1.1 Create/Access Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project or use existing one
3. Wait for project to be ready (3-5 minutes)

### 1.2 Get Connection Details

In Supabase console:
1. Navigate to **Settings → API**
2. Copy:
   - **Project URL** (looks like: `https://xxxx.supabase.co`)
   - **Anon Public Key** (under "Project API keys")

### 1.3 Verify Database Tables

In Supabase console:
1. Navigate to **SQL Editor**
2. Run the migration query from `supabase-sync.js` or use the setup script
3. Verify tables exist:
   - `public.contacts`
   - `public.interactions`
   - `public.synced_data`

### 1.4 Enable Authentication

1. Navigate to **Authentication → Providers**
2. Ensure Email/Password is enabled
3. Set redirect URL to your Vercel domain (e.g., `https://your-crm.vercel.app/auth/callback`)

## Step 2: Configure Your App for Deployment

### 2.1 Update Supabase Config

Edit `supabase-config.js` with your Supabase credentials:

```javascript
window.GLYDUS_SUPABASE_CONFIG = window.GLYDUS_SUPABASE_CONFIG || {
  url: "https://YOUR_PROJECT_ID.supabase.co",
  anonKey: "YOUR_ANON_PUBLIC_KEY",
};
```

**DO NOT commit secrets to GitHub.** Instead, use environment variables (Step 3).

### 2.2 Optional: Use Environment Variables

Create `.env.local` locally (NOT committed to git):

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

Then update `supabase-config.js` to use them:

```javascript
window.GLYDUS_SUPABASE_CONFIG = window.GLYDUS_SUPABASE_CONFIG || {
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
};
```

## Step 3: Push to GitHub

### 3.1 Commit Changes

```bash
cd /path/to/glydus-crm
git add .
git commit -m "Add Supabase sync and WhatsApp integration - ready for deployment"
git push origin main
```

### 3.2 Verify GitHub

1. Visit your GitHub repository
2. Verify all files are committed:
   - `supabase-sync.js` (new)
   - `glydus-crm.js` (updated)
   - `glydus-crm.css` (updated)
   - `index.html` (updated)
   - `SUPABASE_SYNC_SETUP.md` (new)
   - `supabase-config.js` (updated with your URL/key or with env var references)

## Step 4: Deploy to Vercel

### 4.1 Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Select **Import Git Repository**
4. Find your GitHub repository and click **Import**
5. Configure project:
   - **Framework Preset**: Other (static HTML/JavaScript)
   - **Build Command**: Leave blank (not needed for static app)
   - **Output Directory**: `.` (root directory)
   - **Environment Variables**: (See next step)

### 4.2 Set Environment Variables (If Using .env)

1. In Vercel project settings → **Environment Variables**
2. Add:
   ```
   VITE_SUPABASE_URL = https://YOUR_PROJECT_ID.supabase.co
   VITE_SUPABASE_ANON_KEY = YOUR_ANON_PUBLIC_KEY
   ```
3. Select which environments (Production, Preview, Development)
4. Click **Save**

**Alternative:** If you hardcoded values in `supabase-config.js`, skip this step.

### 4.3 Deploy

1. Click **Deploy**
2. Wait for build to complete (usually 1-2 minutes)
3. You'll get a Vercel URL like: `https://glydus-crm.vercel.app`

### 4.4 Update Supabase Redirect URL

After deployment, update your Supabase project:

1. Go to Supabase → **Settings → Auth**
2. Update **Redirect URLs** to include your Vercel URL:
   ```
   https://your-app-name.vercel.app/auth/callback
   ```

## Step 5: Test Deployment

### 5.1 Access Your App

1. Open your Vercel URL: `https://your-app-name.vercel.app`
2. You should see the Glydus CRM homepage
3. Open **Admin Portal** or **User Portal**

### 5.2 Test WhatsApp Button

1. Add or navigate to a contact with a phone number
2. Look for **Teams**, **Outlook**, and **WhatsApp** buttons
3. Click **WhatsApp** button
4. Should open WhatsApp Web in new tab
5. Verify it's ready to send message to the contact

### 5.3 Test Supabase Sync

1. Add a new lead/contact in the app
2. Fill in name, email, phone, priority
3. Save the contact
4. Go to Supabase console → **Table Editor**
5. Navigate to `public.contacts` table
6. You should see the new contact with your user_id
7. Go back to app and refresh page
8. Contact should still appear (loaded from Supabase)

### 5.4 Test Bidirectional Sync

1. In Supabase console, update a contact (e.g., change priority to "Hot")
2. Refresh the app or wait 10 seconds
3. The contact priority should update in the app
4. Change something in the app
5. Check Supabase console to see the update synced

## Troubleshooting

### Issue: "Supabase config not found"

**Solution:**
- Check browser console for errors
- Verify `supabase-config.js` loads (Network tab)
- Ensure URL and anonKey are set in config

### Issue: "No user session"

**Solution:**
- User must be authenticated first
- Check if Supabase Auth is working
- Try logging in through the authentication flow

### Issue: WhatsApp button not working

**Solution:**
- Contact must have valid phone number
- Try opening WhatsApp Web manually: `https://wa.me/1234567890`
- Phone number formatting might need adjustment for your region

### Issue: Data not syncing

**Solution:**
- Check RLS policies in Supabase
- Verify user_id in auth.users matches records
- Check browser console for sync errors
- Try manual sync: Open DevTools and run `window.supabaseSync.poll()`

### Issue: "Row Level Security" errors in console

**Solution:**
- Go to Supabase → Tables
- For each table (contacts, interactions, synced_data):
  1. Click the menu (...)
  2. Enable RLS if not enabled
  3. Verify policies are created

## Production Checklist

- [ ] Supabase project created and tables migrated
- [ ] Supabase Auth configured with Vercel URL
- [ ] All environment variables set in Vercel
- [ ] Repository pushed to GitHub
- [ ] App deployed to Vercel
- [ ] WhatsApp button tested
- [ ] Data syncs from app to Supabase
- [ ] Data syncs from Supabase to app
- [ ] SSL certificate active (Vercel auto-provisions)
- [ ] Custom domain configured (optional)

## Monitoring

### Check App Health

- Vercel Analytics: https://vercel.com → Project → Analytics
- Supabase Logs: Supabase console → Logs
- Browser Console: Open DevTools → Console to see `[Sync]` logs

### Enable Enhanced Logging

In `supabase-sync.js`, all sync operations log with `[Sync]` prefix:
```
[Sync] Initialized with user: abc-123
[Sync] Starting data migration...
[Sync] Migration completed: 5 leads migrated
[Sync] Synced 5 contacts to app
```

## Next Steps

1. **Domain Setup**: Connect custom domain in Vercel settings
2. **Monitoring**: Set up alerts for sync failures
3. **Backup**: Enable Supabase automated backups
4. **Analytics**: Track usage with Vercel Analytics
5. **Real-time Features**: Upgrade polling to WebSocket subscriptions

## Getting Help

- **Vercel Support**: https://vercel.com/help
- **Supabase Docs**: https://supabase.com/docs
- **GitHub Issues**: Create issue in your repository

## Deployment Summary

```
Glydus CRM with Supabase Sync
├── Frontend: Vercel (Static HTML/CSS/JS)
├── Database: Supabase PostgreSQL
├── Auth: Supabase Auth
├── Sync: Polling every 10 seconds
└── Features: Teams, Outlook, WhatsApp buttons
```

You now have a fully deployed, real-time synced CRM application! 🚀
