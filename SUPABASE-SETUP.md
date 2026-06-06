# Supabase Setup Checklist

Follow these steps after pushing the latest code to GitHub and redeploying Vercel.

## 1. Create the database tables

1. Open Supabase Dashboard.
2. Select the project connected to Vercel.
3. Open SQL Editor.
4. Click New Query.
5. Paste the full contents of `supabase/schema.sql`.
6. Click Run.
7. Open Table Editor and confirm these tables exist:
   - `crm_users`
   - `leads`
   - `activities`

## 2. Create the first admin login

1. In Supabase, open Authentication.
2. Open Users.
3. Click Add user.
4. Enter the admin email you want to use.
5. Enter the admin password.
6. Enable Auto Confirm User if Supabase shows that option.
7. Create the user.
8. Copy the new user's UID.
9. Open SQL Editor.
10. Open `supabase/first-admin.sql`.
11. Replace `replace-with-auth-user-uuid` with the copied UID.
12. If you used a different admin email, update the email value too.
13. Run the query.

The CRM Login ID for this profile is `Sbhanuse`. The password is the password you set in Supabase Auth.

## 3. Confirm Vercel environment variables

1. Open Vercel Dashboard.
2. Open your CRM project.
3. Go to Settings.
4. Go to Environment Variables.
5. Confirm Production has either:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

Or the Vercel Marketplace names:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`

6. If you changed or added variables, redeploy the latest Production deployment.

## 4. Test the live app

1. Open `https://crmv2gly.vercel.app/user-portal.html`.
2. Sign in with Login ID `Sbhanuse` and the Supabase Auth password.
3. Open Admin Portal.
4. Create one CRM user.
5. Open User Portal.
6. Create one lead.
7. Open Supabase Table Editor.
8. Confirm the new rows appear in `crm_users`, `leads`, and `activities`.

## 5. Common fixes

- If login fails, confirm the Auth user email matches the row in `crm_users`.
- If user creation fails, confirm the service key is available as `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`.
- If data does not appear, redeploy Vercel after changing environment variables.
- If only local demo data appears, `/api/config` is not returning Supabase URL/key.
