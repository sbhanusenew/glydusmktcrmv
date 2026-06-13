# Quick Reference Card

## WhatsApp Button
```
Location: Appears next to Teams & Outlook buttons
Styling: Green (#25d366) with white text
Function: Opens WhatsApp Web with pre-filled chat
URL Format: https://wa.me/{phone}?text=Hello%20{name}
```

## Supabase Sync Flow
```
┌─────────────────────────────────────────────────────────┐
│                    App Launch                           │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │   Check localStorage for existing    │
         │        leads to migrate              │
         └──────────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │   Migrate data to Supabase           │
         │   (One-time, per user)               │
         └──────────────────────────────────────┘
                            │
                            ▼
         ┌──────────────────────────────────────┐
         │   Start 10-second polling loop       │
         └──────────────────────────────────────┘
                    ┌─────────┴──────────┐
                    ▼                    ▼
          ┌────────────────┐   ┌────────────────┐
          │ User adds/edits│   │  Supabase has  │
          │ contact in app │   │  updated data  │
          └────────────────┘   └────────────────┘
                    │                    │
                    ▼                    ▼
          ┌────────────────┐   ┌────────────────┐
          │ Save to storage│   │ Fetch from DB  │
          │ then sync to   │   │ and merge with │
          │ Supabase       │   │ local data     │
          └────────────────┘   └────────────────┘
                    │                    │
                    └────────┬───────────┘
                             ▼
                   ┌────────────────────┐
                   │  Repeat every 10s  │
                   └────────────────────┘
```

## Console Messages

### Successful Initialization
```
[Sync] Initialized with user: abc-123-def
[Sync] Data already migrated, skipping...
[Sync] Synced 5 contacts to app
```

### First Run (Migration)
```
[Sync] Initialized with user: abc-123-def
[Sync] Starting data migration...
[Sync] Migration completed: 5 leads migrated
[Sync] Synced 5 contacts to app
```

### Continuous Sync
```
[Sync] Synced N contacts to app        (Every 10 seconds)
[Sync] Contact synced: LEAD-001         (When you add/edit)
```

## Testing Commands

Open browser console (F12) and run:

```javascript
// Check if sync is initialized
console.log(window.supabaseSync);

// Manually trigger a sync
window.supabaseSync.poll();

// Sync a specific contact
window.supabaseSync.syncContact({
  id: 'LEAD-001',
  contactName: 'John Doe',
  email: 'john@example.com',
  phone: '9876543210'
});

// Stop syncing
window.supabaseSync.stop();

// Check pending changes
console.log(window.supabaseSync.pendingChanges);
```

## Database Tables

### contacts
```
Columns:
- id (UUID) - Primary Key
- user_id (UUID) - User ownership
- lead_id (TEXT) - CRM lead ID
- name (TEXT) - Contact name
- email (TEXT) - Email address
- phone (TEXT) - Phone number
- source (TEXT) - 'CRM', 'Import', etc.
- priority (TEXT) - Cold, Warm, Hot
- stage (TEXT) - New Lead, Qualified, Won, etc.
- notes (TEXT) - Additional info
- created_at (TIMESTAMP) - Auto-set
- updated_at (TIMESTAMP) - Auto-set

RLS: ✓ Enabled - Users see only their data
```

### interactions
```
Columns:
- id (UUID) - Primary Key
- user_id (UUID) - User ownership
- contact_id (UUID) - Links to contacts
- interaction_id (TEXT) - CRM interaction ID
- type (TEXT) - Call, Email, Meeting, etc.
- outcome (TEXT) - Result
- sentiment (TEXT) - Positive, Neutral, Negative
- priority (TEXT) - Follow-up priority
- description (TEXT) - Details
- created_at (TIMESTAMP) - Auto-set
- updated_at (TIMESTAMP) - Auto-set

RLS: ✓ Enabled - Users see only their data
```

### synced_data
```
Columns:
- id (UUID) - Primary Key
- user_id (UUID) - User ownership
- data_type (TEXT) - 'contacts', 'interactions', etc.
- last_sync (TIMESTAMP) - When last synced

RLS: ✓ Enabled - Users see only their data
```

## Configuration

### supabase-config.js
```javascript
window.GLYDUS_SUPABASE_CONFIG = {
  url: "https://your-project.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};
```

### Environment Variables (Vercel)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## File References

| File | Purpose | Status |
|------|---------|--------|
| supabase-sync.js | Sync engine | ✓ NEW |
| glydus-crm.js | WhatsApp function | ✓ UPDATED |
| glydus-crm.css | WhatsApp styling | ✓ UPDATED |
| index.html | Script imports | ✓ UPDATED |
| SUPABASE_SYNC_SETUP.md | Documentation | ✓ NEW |
| VERCEL_DEPLOYMENT.md | Deploy guide | ✓ NEW |
| IMPLEMENTATION_SUMMARY.md | Summary | ✓ NEW |

## Common Issues & Fixes

### Issue: "Supabase config not found"
```
→ Check: window.GLYDUS_SUPABASE_CONFIG has url and anonKey
→ Check: supabase-sync.js loads after supabase-config.js
→ Fix: Verify config.js file exists and loads before sync.js
```

### Issue: "No user session"
```
→ Check: User is authenticated with Supabase Auth
→ Check: Session exists: window.supabaseSync.userId
→ Fix: Log in first, then refresh the app
```

### Issue: Data not syncing
```
→ Check: Browser console for [Sync] error messages
→ Check: Supabase tables have RLS enabled
→ Check: User has correct permissions
→ Fix: Verify RLS policies in Supabase console
```

### Issue: WhatsApp button doesn't work
```
→ Check: Contact has phone number
→ Check: Phone format is valid (numbers + country code)
→ Check: WhatsApp Web is accessible (not blocked)
→ Fix: Open https://web.whatsapp.com manually to test
```

## Deployment Checklist

- [ ] Supabase project created
- [ ] Database tables migrated
- [ ] supabase-config.js updated with credentials
- [ ] Changes committed to GitHub
- [ ] Vercel connected to GitHub repo
- [ ] Environment variables set in Vercel (if using)
- [ ] Deploy triggered
- [ ] Vercel URL added to Supabase Auth redirects
- [ ] WhatsApp button tested
- [ ] Data sync tested (add contact, check Supabase)

## Performance Notes

- Polling interval: 10 seconds
- Migration: One-time on first app load (~1-2 seconds)
- Sync batch size: All contacts per poll
- Database: Indexed on user_id and lead_id for fast queries
- RLS: Applied at row level for security

## Next Enhancements

1. **Real-time WebSocket**: Replace polling with subscriptions
2. **Offline Mode**: Use service workers for offline-first
3. **Sync Status UI**: Show sync progress to user
4. **Conflict Resolution**: UI for simultaneous edits
5. **Activity Feed**: Sync phone calls, emails, meetings
6. **Analytics**: Track sync performance and errors

---

**Ready to deploy? Follow VERCEL_DEPLOYMENT.md**
