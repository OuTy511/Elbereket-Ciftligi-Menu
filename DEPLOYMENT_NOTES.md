# Deployment Notes

- Latest changes confirming numeric input normalization and cart clearing have been deployed to production by the client.
- No further code adjustments were required in this pass; this file records the deployment confirmation received.

## Netlify Functions setup

- Set the build publish directory to the repository root and functions folder to `.netlify/functions` (already reflected in `netlify.toml`).
- Configure the following environment variables in Netlify:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
- After deploying, verify the API endpoints:
  - `/.netlify/functions/products`
  - `/.netlify/functions/offers`
  - `/.netlify/functions/createOrder`
