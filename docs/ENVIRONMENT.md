# Environment Variables

## Frontend: Vercel

Required:

```txt
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_ADMIN_EMAIL
```

Optional:

```txt
VITE_SITE_URL=https://shepardai.pro
```

Do not expose AI provider keys, Creem API keys, service role keys, or webhook secrets in Vite variables.

## Supabase Edge Function Secrets

Core:

```txt
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAIL
ADMIN_EMAILS
CRON_SECRET
```

AI summary:

```txt
GEMINI_API_KEY
OPENROUTER_API_KEY
```

At least one AI provider key is needed for live AI summaries. Without one, deterministic fallback summaries are returned.

Creem:

```txt
CREEM_API_KEY
CREEM_WEBHOOK_SECRET
CREEM_TEST_MODE
CREEM_PRO_MONTHLY_PRODUCT_ID
CREEM_PRO_QUARTERLY_PRODUCT_ID
CREEM_PRO_YEARLY_PRODUCT_ID
CREEM_TRADER_MONTHLY_PRODUCT_ID
CREEM_TRADER_QUARTERLY_PRODUCT_ID
CREEM_TRADER_YEARLY_PRODUCT_ID
```

Optional paid sentiment providers:

```txt
ENABLE_PAID_SENTIMENT_PROVIDERS=false
CRYPTOPANIC_API_TOKEN
COINGECKO_API_KEY
```

Optional Reddit:

```txt
ENABLE_REDDIT_SENTIMENT=false
REDDIT_CLIENT_ID
REDDIT_CLIENT_SECRET
REDDIT_USER_AGENT
```

Current MVP should keep Reddit disabled unless deliberately enabled.

## Removed / Not Needed

Google Custom Search is not used in the RSS-only MVP:

```txt
GOOGLE_CUSTOM_SEARCH_API_KEY
GOOGLE_CUSTOM_SEARCH_ENGINE_ID
```

These can be removed from Supabase secrets.

## Set Secrets

```bash
supabase secrets set ADMIN_EMAIL=you@example.com
supabase secrets set CRON_SECRET=strong-random-value
supabase secrets set OPENROUTER_API_KEY=...
```

## Security Rule

Anything prefixed with `VITE_` is public in the browser bundle.

Never put private API keys in `VITE_` variables.
