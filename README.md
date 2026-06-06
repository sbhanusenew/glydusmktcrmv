# Glydus CRM

This folder contains a browser-based Glydus CRM with admin and user portals,
Supabase-ready login, role-aware navigation, user management, lead tracking,
activity history, and daily time logging.

## Included pages

- `index.html` admin command center with pipeline and activity visibility
- `admin-portal.html` admin workspace for lead ownership and user registration
- `user-portal.html` user workspace for lead capture, updates, and time logging
- `glydus-crm.css` shared dashboard styling
- `glydus-crm.js` shared CRM logic and browser storage
- `supabase-config.js` optional local static Supabase config fallback
- `SUPABASE-SETUP.md` click-by-click Supabase and Vercel setup checklist
- `assets/glydus-logo.svg` official Glydus logo used in the app chrome/login
- `supabase/schema.sql` production database and RLS wireframe
- `supabase/first-admin.sql` first admin profile template
- `supabase/seed-demo.sql` optional demo data template after creating Auth users

## Default access

- Admin Login ID: `Sbhanuse`
- Admin password: use the password you set for the admin user in Supabase Auth

Admins can create more users with a Login ID and password from
`admin-portal.html`.

## What this build includes

- login gate for registered users using Supabase Auth when configured
- admin-only command center and admin portal
- user portal restricted to the signed-in user
- password field when adding CRM users
- update and delete actions for current CRM users
- lead creation and lead update workflows
- automatic activity audit trail for lead changes
- manual daily activity and time tracker
- admin visibility into all user activity
- enhanced Daily Activity logging with outcome, sentiment, priority, follow-up,
  deliverable/reference, blocker review, and productivity counters
- user-only route protection with admin-only command/admin views

## Supabase Mode

When `SUPABASE_URL` and `SUPABASE_ANON_KEY` are configured, the CRM reads and
writes shared data from Supabase. Admin user creation also needs
`SUPABASE_SERVICE_ROLE_KEY` in Vercel because creating Supabase Auth users must
run server-side.

Without Supabase config, the app falls back to local demo mode.

Use `.env.example` as the Vercel/local template. Create the database tables and
RLS policies with `supabase/schema.sql`, then create the first admin Auth user
and profile with `supabase/first-admin.sql`.

Main tables:

- `crm_users`
- `leads`
- `activities`

## How to test locally

Open `user-portal.html` or run the folder with:

```bash
npm run dev
```

Then open the printed local URL in a browser.
