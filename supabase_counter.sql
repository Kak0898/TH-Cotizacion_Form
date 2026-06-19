-- Contador automático para cotizaciones Técnica Hidráulica
-- Última cotización usada: 11865. La próxima generada será 11866.

create table if not exists public.th_counters (
  key text primary key,
  last_value bigint not null,
  updated_at timestamptz not null default now()
);

insert into public.th_counters (key, last_value)
values ('cotizacion', 11865)
on conflict (key) do update
set last_value = greatest(public.th_counters.last_value, excluded.last_value),
    updated_at = now();

create or replace function public.next_th_cotizacion()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num bigint;
begin
  insert into public.th_counters (key, last_value)
  values ('cotizacion', 11865)
  on conflict (key) do nothing;

  update public.th_counters
  set last_value = last_value + 1,
      updated_at = now()
  where key = 'cotizacion'
  returning last_value into next_num;

  return next_num;
end;
$$;

grant execute on function public.next_th_cotizacion() to anon, authenticated;
