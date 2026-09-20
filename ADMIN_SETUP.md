# GlitchMango admin setup

1. Open the Supabase SQL Editor for the connected GlitchMango project.
2. Run \`supabase-schema.sql\`.
3. In Supabase Authentication > Users, create or confirm your admin account.
4. Run the final commented SQL in \`supabase-schema.sql\`, replacing YOUR_ADMIN_EMAIL with the admin email.
5. Open /admin.html and sign in.

The admin API accepts write requests only when the Supabase access token belongs to a user whose app_metadata.role is admin. Keep the Supabase secret/service key only in Netlify environment variables.