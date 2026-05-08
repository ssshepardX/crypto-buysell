# Admin Panel

## Route

```txt
/admin
```

Admin route is not shown in public navigation.

## Auth Model

Admin access is email-based.

Frontend:

```txt
VITE_ADMIN_EMAIL
```

Backend:

```txt
ADMIN_EMAIL
ADMIN_EMAILS
```

The admin must sign in through Supabase Auth with the matching email.

Do not use `profiles.role` as the source of admin trust.

## Capabilities

Admin panel supports:

- view users
- view subscription plan/status
- see last seen/online approximation
- view contact messages
- update message status
- set subscription manually
- run backtests
- collect market snapshots
- label backtest events

## Online Status

Online status is derived from `profiles.last_seen_at`.

Recommended rule:

```txt
online = last_seen_at within last 5 minutes
```

## API Boundary

Admin data must go through:

```txt
admin-api
```

Do not expose direct unrestricted table writes in the browser.

## Safety

- No admin nav item for normal users.
- Wrong email redirects away.
- Backend must still reject non-admin users.
- Admin email must match exactly after lowercase/trim normalization.
