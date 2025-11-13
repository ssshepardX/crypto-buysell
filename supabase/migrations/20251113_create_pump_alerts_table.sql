-- Create pump_alerts table for real-time pump detection
create table if not exists pump_alerts (
  id uuid default gen_random_uuid() primary key,
  symbol text not null,
  type text not null default 'PUMP_ALERT',
  price decimal not null,
  price_change decimal not null,
  volume decimal not null,
  avg_volume decimal not null,
  volume_multiplier decimal not null,
  detected_at timestamptz not null default now(),
  ai_comment jsonb,
  ai_fetched_at timestamptz,
  market_state text default 'unknown',
  organic_probability decimal,
  whale_movement boolean default false,
  risk_analysis text,
  created_at timestamptz not null default now()
);

-- Create indices for better query performance
create index if not exists idx_pump_alerts_symbol on pump_alerts(symbol);
create index if not exists idx_pump_alerts_detected_at on pump_alerts(detected_at);
create index if not exists idx_pump_alerts_volume_multiplier on pump_alerts(volume_multiplier);

-- Enable RLS
alter table pump_alerts enable row level security;

-- Public read access for all authenticated users
create policy "Public read access to pump alerts"
  on pump_alerts for select
  using (true);

-- Service role can insert
create policy "Service role insert access to pump alerts"
  on pump_alerts for insert
  with check (auth.role() = 'service_role' or auth.role() = 'authenticated');

-- Create a function to get top coins by volume
create or replace function get_top_coins_by_volume(limit_count int default 200)
returns table (
  symbol text,
  volume24h decimal,
  price decimal,
  price_change_24h decimal
) as $$
begin
  return query
  select 
    p.symbol,
    p.volume24h,
    p.price,
    p.price_change_24h
  from (
    select 
      symbol,
      volume::decimal as volume24h,
      cast(regexp_replace(coalesce(last_price, '0'), '[^0-9.]', '', 'g') as decimal) as price,
      cast(regexp_replace(coalesce(price_change_percent, '0'), '[^0-9.-]', '', 'g') as decimal) as price_change_24h
    from (
      select distinct on (symbol) *
      from pump_alerts
      order by symbol, detected_at desc
    ) latest
  ) p
  order by p.volume24h desc
  limit limit_count;
end;
$$ language plpgsql;

-- Create notification subscription table for push notifications
create table if not exists notification_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null,
  keys jsonb not null,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table notification_subscriptions enable row level security;

create policy "Users can manage own subscriptions"
  on notification_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
