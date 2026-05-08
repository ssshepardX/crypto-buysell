# Backtesting

## Purpose

Backtesting measures whether Shepard AI correctly identifies the cause of movement.

It is not a classic buy/sell profit backtest.

## Modes

### Historical Kline

Uses Binance historical candles.

Good for:

- technical/risk score checks
- event detection tuning
- volume/range/wick pattern tests

Limit:

- no historical order book
- no historical live trades beyond available public data

### Snapshot

Uses `market_snapshots` collected from live cron.

Good for:

- whale/fraud proxy validation
- liquidity conditions
- orderbook/trade pressure

Limit:

- needs time to collect data

## Tables

### `market_snapshots`

Stores:

- symbol
- timeframe
- price
- kline JSON
- orderbook JSON
- trades JSON
- indicators JSON
- risk JSON
- cause JSON

### `movement_events`

Stores detected events and outcomes.

Manual labels:

- `organic_demand`
- `whale_push`
- `thin_liquidity_move`
- `fomo_trap`
- `fraud_pump_risk`
- `news_social_catalyst`
- `balanced_market`

### `backtest_runs`

Stores backtest config and metrics.

## Metrics

- precision
- recall
- false positive rate
- lead time
- cause accuracy
- whale/fraud proxy rate
- confidence calibration

## Admin Flow

```txt
/admin
  -> Backtests tab
  -> choose symbols/timeframe/date/mode
  -> run
  -> inspect event table
  -> edit manual labels
```

## Cron

Recommended snapshot cron:

```txt
every 5 minutes
```

Initial scope:

```txt
top 40 USDT pairs
```

Retention target:

```txt
30 days raw snapshots
movement events permanent
```

## Important Rule

Backtests should not call AI.

AI is for explanations only, not deterministic score decisions.
