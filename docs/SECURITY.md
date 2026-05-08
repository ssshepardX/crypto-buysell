# Security

## Current Baseline

The app uses:

- Supabase Auth
- Supabase RLS
- Edge Functions as backend boundary
- service role only in Edge Functions
- Vercel security headers
- no private provider keys in frontend
- cache to reduce third-party API usage

## Vercel Headers

Configured in:

```txt
vercel.json
```

Headers include:

- HSTS
- X-Content-Type-Options
- X-Frame-Options
- Referrer-Policy
- Permissions-Policy
- Content-Security-Policy

## Secrets

Never expose:

- Supabase service role key
- Creem API key
- Creem webhook secret
- AI provider keys
- cron secret

Only `VITE_` variables are available to the browser.

## Auth

Protected app routes require Supabase session.

Admin requires:

- matching admin email in frontend
- matching admin email in backend
- valid Supabase authenticated user

## RLS

RLS must stay enabled for user-owned tables.

General model:

- user reads own subscription/usage/profile data
- authenticated users read safe cached market analysis
- service role writes backend-owned analysis/cache tables
- admin operations go through `admin-api`

## Payment Security

Creem webhook must:

- verify signature
- reject invalid signatures
- store processed events
- remain idempotent

Frontend must only request checkout creation. It must not update subscription state.

## Rate/Cost Control

Important controls:

- 15-minute shared analysis cache
- daily usage limits by plan
- AI summary cache by language
- RSS sentiment cache
- scanner restricted by plan

## Public API Warning

Do not expose backend functions publicly without API keys and rate limits.

If a public developer API is added, it needs:

- `api_keys`
- hashed key storage
- per-key rate limit
- per-key plan
- request logs
- abuse revoke

## Known Risks / Future Work

- Add stricter contact form rate limiting.
- Add API request logging for all high-cost operations.
- Add automated RLS policy tests.
- Add webhook replay tests.
- Add monitoring alerts for Edge Function error rate.
