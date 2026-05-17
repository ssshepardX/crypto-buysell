create schema if not exists private;

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  items_count integer not null default 0,
  error_summary text,
  meta_json jsonb not null default '{}'::jsonb
);

create index if not exists automation_runs_job_started_idx
  on public.automation_runs(job_name, started_at desc);

alter table public.automation_runs enable row level security;

drop policy if exists "Authenticated users can read automation runs" on public.automation_runs;
create policy "Authenticated users can read automation runs"
  on public.automation_runs for select
  to authenticated
  using (true);

drop policy if exists "Service role can manage automation runs" on public.automation_runs;
create policy "Service role can manage automation runs"
  on public.automation_runs for all
  to service_role
  using (true)
  with check (true);

do $$
begin
  if exists (select 1 from cron.job where jobname = 'market-scanner-cache-15m') then
    perform cron.unschedule('market-scanner-cache-15m');
  end if;
  if exists (select 1 from cron.job where jobname = 'sentiment-scan-cache-15m') then
    perform cron.unschedule('sentiment-scan-cache-15m');
  end if;
  if exists (select 1 from cron.job where jobname = 'market-overview-cache-5m') then
    perform cron.unschedule('market-overview-cache-5m');
  end if;
end $$;

select cron.schedule(
  'market-scanner-cache-15m',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://wwdnuxpzsmdbeffhdsoy.supabase.co/functions/v1/analyze-coin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZG51eHB6c21kYmVmZmhkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjQzNTEsImV4cCI6MjA5MzA0MDM1MX0.1lhsZsyvSKRK40CDmpXrp5EOOiMTCu235LOIQ5-_ReM',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZG51eHB6c21kYmVmZmhkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjQzNTEsImV4cCI6MjA5MzA0MDM1MX0.1lhsZsyvSKRK40CDmpXrp5EOOiMTCu235LOIQ5-_ReM',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := jsonb_build_object('mode', 'scan-market')
  );
  $$
);

select cron.schedule(
  'sentiment-scan-cache-15m',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://wwdnuxpzsmdbeffhdsoy.supabase.co/functions/v1/sentiment-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZG51eHB6c21kYmVmZmhkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjQzNTEsImV4cCI6MjA5MzA0MDM1MX0.1lhsZsyvSKRK40CDmpXrp5EOOiMTCu235LOIQ5-_ReM',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZG51eHB6c21kYmVmZmhkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjQzNTEsImV4cCI6MjA5MzA0MDM1MX0.1lhsZsyvSKRK40CDmpXrp5EOOiMTCu235LOIQ5-_ReM',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := jsonb_build_object('mode', 'market', 'limit', 12)
  );
  $$
);

select cron.schedule(
  'market-overview-cache-5m',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://wwdnuxpzsmdbeffhdsoy.supabase.co/functions/v1/market-overview',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZG51eHB6c21kYmVmZmhkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjQzNTEsImV4cCI6MjA5MzA0MDM1MX0.1lhsZsyvSKRK40CDmpXrp5EOOiMTCu235LOIQ5-_ReM',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZG51eHB6c21kYmVmZmhkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NjQzNTEsImV4cCI6MjA5MzA0MDM1MX0.1lhsZsyvSKRK40CDmpXrp5EOOiMTCu235LOIQ5-_ReM',
      'x-cron-secret', current_setting('app.cron_secret', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
