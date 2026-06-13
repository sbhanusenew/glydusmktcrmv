# Glydus CRM - Supabase Sync & WhatsApp Integration

## New Features

### 1. WhatsApp Button
A new WhatsApp collaboration button has been added alongside Teams and Outlook buttons. When clicked, it opens WhatsApp Web with a pre-filled chat to the contact.

**Features:**
- Opens WhatsApp Web with contact phone number pre-filled
- Works like Teams and Outlook buttons for consistency
- Displays in all collaboration action areas (leads list, activity feed, admin view)
- Green button styling (#25d366) matching WhatsApp brand

**How it works:**
- Button appears next to Teams and Outlook buttons
- Phone number is automatically extracted and formatted
- Opens `wa.me/{phone}` URL to initiate WhatsApp chat
- Message is pre-filled with contact name greeting

### 2. Real-time Supabase Sync

The app now syncs all lead and contact data with Supabase in real-time using polling.

**Features:**
- **One-time Migration**: First run automatically migrates all localStorage leads to Supabase
- **Bidirectional Sync**: Changes made in the app sync to Supabase, and Supabase changes appear in the app
- **Polling-based Sync**: Checks Supabase every 10 seconds for changes
- **Automatic Data Merge**: Prevents data loss by merging local and remote changes
- **User Isolation**: Each user's data is isolated with Row Level Security (RLS) policies
- **Offline Support**: Queues changes when offline, syncs when reconnected

**Database Schema:**

Three new tables were created in Supabase:

#### `contacts` Table
```
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- lead_id (TEXT, Unique per user)
- name (TEXT)
- email (TEXT)
- phone (TEXT)
- source (TEXT, Default: 'CRM')
- priority (TEXT, Default: 'Cold')
- stage (TEXT, Default: 'New Lead')
- notes (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `interactions` Table
```
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- contact_id (UUID, Foreign Key to contacts)
- interaction_id (TEXT, Unique per user)
- type (TEXT)
- outcome (TEXT)
- sentiment (TEXT)
- priority (TEXT)
- description (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `synced_data` Table
```
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to auth.users)
- data_type (TEXT)
- last_sync (TIMESTAMP)
```

All tables have Row Level Security (RLS) enabled with policies that ensure users can only access their own data.

## Setup Instructions

### 1. Configure Supabase

Ensure your Supabase project URL and anonymous key are set in `supabase-config.js`:

```javascript
window.GLYDUS_SUPABASE_CONFIG = {
  url: "https://your-project.supabase.co",
  anonKey: "your-anon-key"
};
```

### 2. Enable User Authentication

The sync module requires Supabase authentication to work. Users must be logged in via Supabase Auth before sync initialization.

### 3. Sync Initialization

The sync automatically initializes when the app loads if:
- Supabase config is available
- User is authenticated with Supabase

To manually initialize:
```javascript
await window.supabaseSync.initialize();
```

## API Reference

### window.supabaseSync

#### Methods

**`initialize()`**
- Initializes Supabase client and starts sync
- Performs one-time data migration from localStorage
- Starts 10-second polling loop
- Returns: Promise<boolean>

**`startPolling()`**
- Starts the 10-second polling interval
- Automatically called by initialize()

**`poll()`**
- Manually triggers a sync poll cycle
- Fetches updates from Supabase
- Syncs pending local changes

**`syncContact(contact)`**
- Manually syncs a single contact to Supabase
- Parameters: contact object with id, name, email, phone, etc.
- Returns: Promise<boolean>

**`deleteContact(contactId)`**
- Deletes a contact from Supabase
- Parameters: contactId (lead_id)
- Returns: Promise<boolean>

**`queueChange(type, data)`**
- Queues a change for later sync
- Parameters: type ('contact_add', 'contact_update', 'contact_delete'), data object
- Returns: void

**`stop()`**
- Stops the polling interval
- Call when app is being unloaded

## How It Works

### Data Flow

1. **App Launch**: `initPage()` calls `supabaseSync.initialize()`
2. **Migration**: First run checks localStorage and migrates existing leads to Supabase
3. **Polling**: Every 10 seconds, the app polls Supabase for updated contacts
4. **UI Update**: When Supabase changes are detected, localStorage is updated and UI is refreshed
5. **App Changes**: When users make changes in the app, they're saved to localStorage first, then synced to Supabase

### Real-time Sync Flow

```
User Action → writeStore() → localStorage → supabaseSync.syncContact() → Supabase
       ↓
    10s Polling ← Supabase → syncContactsToApp() → localStorage → UI Refresh
```

### Conflict Resolution

When polling detects changes:
1. Fetches all contacts from Supabase for current user
2. Gets current leads from localStorage
3. Merges both datasets (Supabase wins for duplicates)
4. Updates localStorage with merged data
5. Triggers UI refresh

## Features

- ✅ Bidirectional sync between app and Supabase
- ✅ Automatic localStorage to Supabase migration
- ✅ 10-second polling for near real-time updates
- ✅ User data isolation with RLS
- ✅ Offline change queuing
- ✅ WhatsApp integration button
- ✅ Automatic timestamp management
- ✅ Error logging and recovery

## Deployment to Vercel

### Prerequisites
- Supabase project with tables created
- Supabase project URL and anonymous key

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Supabase sync and WhatsApp integration"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel Project Settings:
     - `NEXT_PUBLIC_SUPABASE_URL` (if using Next.js)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if using Next.js)
   - Or update `supabase-config.js` with your Supabase credentials before deployment

3. **Verify Deployment**
   - Access the app at your Vercel domain
   - Try adding a new lead
   - Check Supabase console to verify it was synced
   - Check WhatsApp button opens correctly

## Debugging

### Enable Console Logging
The sync module logs all operations with `[Sync]` prefix:
- `[Sync] Initialized with user: {userId}`
- `[Sync] Starting data migration...`
- `[Sync] Migration completed: N leads migrated`
- `[Sync] Synced N contacts to app`
- `[Sync] Contact synced: {contactId}`

### Check Sync Status
- Open browser DevTools → Console
- Look for `[Sync]` prefixed messages
- Check Network tab for Supabase API calls

### Common Issues

**"Supabase config not found"**
- Ensure `supabase-config.js` has valid URL and anonKey
- Check if config loads before sync module

**"No user session"**
- User must be authenticated with Supabase Auth first
- Check authentication flow in your app

**Sync not working**
- Verify RLS policies are enabled on all tables
- Check Supabase project logs for permission errors
- Ensure authenticated user ID matches database records

## Files Modified

1. **glydus-crm.js** - Added WhatsApp URL function, updated collaboration HTML, added sync initialization
2. **glydus-crm.css** - Added `.button--whatsapp` styling
3. **index.html** - Added supabase-sync.js script import
4. **supabase-sync.js** - New file with sync engine (347 lines)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- WhatsApp button: Requires WhatsApp Web or WhatsApp app installed on phone

## Future Enhancements

- [ ] Real-time subscriptions (WebSocket) instead of polling
- [ ] Conflict resolution UI for simultaneous edits
- [ ] Interaction sync (phone calls, emails, meetings)
- [ ] Activity feed sync
- [ ] User presence indicators
- [ ] Offline mode with service workers
