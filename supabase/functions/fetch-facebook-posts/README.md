# Fetch Facebook Posts (Edge Function)

This function fetches the latest posts from the ERIO Facebook page via the Facebook Graph API and returns them as JSON. The frontend renders these posts without embedding Facebook’s iframe, so there are no console errors from Facebook’s SDK.

## Setup

1. **Get a Facebook access token**
   - Go to [Meta for Developers](https://developers.facebook.com/), create or select an app.
   - For the ERIO page you need either:
     - **Page access token**: In Meta Business Suite → Settings → Page access, or use the Graph API Explorer with the page selected.
     - **App token**: `app_id|app_secret` (can read public page posts; keep app secret private).
   - For a long-lived page token: use the Graph API Explorer with “Get Page Access Token” for the page “UIC External Relations and Internationalization Office”.

2. **Set the secret in Supabase**
   ```bash
   supabase secrets set FACEBOOK_PAGE_ACCESS_TOKEN=your_token_here
   ```
   Or in the Supabase Dashboard: Project Settings → Edge Functions → Secrets.

3. **Deploy the function**
   ```bash
   supabase functions deploy fetch-facebook-posts
   ```

If the token is not set or the function is not deployed, the dashboard will show the “View ERIO on Facebook” link instead of the feed.
