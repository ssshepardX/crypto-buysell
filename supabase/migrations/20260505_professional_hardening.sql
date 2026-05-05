-- Professional hardening: legacy signal tables and contact form guardrails.

-- Legacy trading-signal tables are no longer part of the public product surface.
-- Keep tables for compatibility, but remove broad public/authenticated writes.
drop policy if exists "Allow public read access to signals log" on public.signals_log;
drop policy if exists "Allow authenticated users to insert signals" on public.signals_log;
drop policy if exists "Allow authenticated users to update their signals" on public.signals_log;

drop policy if exists "Public read access" on public.signals;
drop policy if exists "Service role insert access" on public.signals;
drop policy if exists "Authenticated users can insert signals" on public.signals;
drop policy if exists "Service role update access" on public.signals;
drop policy if exists "Service role delete access" on public.signals;

drop policy if exists "Public read access to pump alerts" on public.pump_alerts;
drop policy if exists "Service role insert access to pump alerts" on public.pump_alerts;

-- Service role bypasses RLS, but these explicit policies document intended access.
drop policy if exists "Service role can manage signals log" on public.signals_log;
create policy "Service role can manage signals log"
  on public.signals_log
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage signals" on public.signals;
create policy "Service role can manage signals"
  on public.signals
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage pump alerts" on public.pump_alerts;
create policy "Service role can manage pump alerts"
  on public.pump_alerts
  for all
  to service_role
  using (true)
  with check (true);

create or replace function public.guard_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
  normalized_email text;
begin
  new.subject := btrim(coalesce(new.subject, ''));
  new.message := btrim(coalesce(new.message, ''));
  new.email := nullif(lower(btrim(coalesce(new.email, ''))), '');
  new.name := nullif(btrim(coalesce(new.name, '')), '');

  if char_length(new.subject) < 3 or char_length(new.subject) > 160 then
    raise exception 'Contact subject must be between 3 and 160 characters';
  end if;

  if char_length(new.message) < 10 or char_length(new.message) > 3000 then
    raise exception 'Contact message must be between 10 and 3000 characters';
  end if;

  if new.user_id is not null and auth.uid() is not null and new.user_id <> auth.uid() then
    raise exception 'Contact user mismatch';
  end if;

  normalized_email := coalesce(new.email, '');

  select count(*)
    into recent_count
  from public.contact_messages
  where created_at > now() - interval '10 minutes'
    and (
      (new.user_id is not null and user_id = new.user_id)
      or (normalized_email <> '' and lower(coalesce(email, '')) = normalized_email)
    );

  if recent_count >= 3 then
    raise exception 'Too many contact messages. Please try again later.';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_contact_message_before_insert on public.contact_messages;
create trigger guard_contact_message_before_insert
before insert on public.contact_messages
for each row
execute function public.guard_contact_message();

drop policy if exists "Anyone can create contact messages" on public.contact_messages;
create policy "Anyone can create contact messages"
  on public.contact_messages
  for insert
  with check (
    (user_id is null or auth.uid() = user_id)
    and char_length(btrim(subject)) between 3 and 160
    and char_length(btrim(message)) between 10 and 3000
  );
