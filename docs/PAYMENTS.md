# Payments

## Provider

Creem handles subscription checkout and billing.

Frontend never receives Creem API keys.

## Plans

```txt
free
pro
trader
```

Pricing:

- Free: EUR 0
- Pro: EUR 4.99/month
- Trader: EUR 9.99/month

Billing intervals:

- monthly
- quarterly
- yearly

Discount model:

- quarterly: 25% discount
- yearly: 50% discount

Each paid plan and interval uses its own Creem product ID.

## Checkout Flow

```txt
pricing page
  -> create-checkout Edge Function
  -> Creem checkout URL
  -> payment success/cancel page
  -> webhook updates DB
```

## Edge Functions

### `create-checkout`

Requires authenticated Supabase user.

Input:

```json
{
  "plan": "pro",
  "interval": "monthly"
}
```

Sends metadata:

```txt
user_id
plan
interval
```

### `creem-webhook`

Handles subscription lifecycle events.

Expected behavior:

- verify webhook signature
- record event in `creem_events`
- keep idempotency
- update `user_subscriptions`

## Required Secrets

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

## Entitlements

Free:

- 3 AI/movement checks per day
- delayed/basic scanner
- basic chart and scores
- advanced risk masked

Pro:

- 50 AI/movement checks per day
- live scanner view
- AI Supervisor summary
- risk and whale details

Trader:

- 250 AI/movement checks per day
- manual market scanner
- all advanced details
- higher product limits

## Operational Notes

- Creem store business email and website contact email should match.
- Production should use custom domain: `https://shepardai.pro`.
- Test mode should be disabled before real launch.
