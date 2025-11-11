-- Update RLS policies to allow authenticated users to insert signals
drop policy if exists "Service role insert access" on signals;

create policy "Authenticated users can insert signals"
  on signals for insert
  with check (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "Service role update access"
  on signals for update
  with check (auth.role() = 'service_role');

create policy "Service role delete access"
  on signals for delete
  with check (auth.role() = 'service_role');
