-- Flujo PRE-COTIZACION -> COTIZACION FINAL
-- Ejecutar en Supabase SQL Editor despues de tener creada la tabla th_documentos.

create table if not exists public.th_counters (
  key text primary key,
  last_value bigint not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.th_documentos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'PRE-COTIZACIÓN',
  numero bigint,
  fecha_emision date,
  fecha_vcto date,
  rut_empresa text,
  cliente_nombre text,
  cliente_contacto text,
  cliente_rut text,
  cliente_direccion text,
  cliente_giro text,
  cliente_comuna text,
  cliente_telefono text,
  cliente_ciudad text,
  cliente_email text,
  referencia text,
  observaciones text,
  garantia text,
  condiciones text,
  items jsonb not null default '[]'::jsonb,
  subtotal bigint not null default 0,
  neto bigint not null default 0,
  iva bigint not null default 0,
  total bigint not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.th_counters (key, last_value)
values ('cotizacion', 11865), ('pre_cotizacion', 0)
on conflict (key) do update
set last_value = greatest(public.th_counters.last_value, excluded.last_value),
    updated_at = now();

alter table public.th_documentos
  add column if not exists estado text not null default 'cotizacion_emitida',
  add column if not exists pre_numero text,
  add column if not exists emitida_at timestamptz,
  add column if not exists pre_documento_id bigint;

alter table public.th_documentos
  alter column numero drop not null;

create unique index if not exists th_documentos_numero_unique
  on public.th_documentos (numero)
  where numero is not null;

create unique index if not exists th_documentos_pre_numero_unique
  on public.th_documentos (pre_numero)
  where pre_numero is not null;

create or replace function public.next_th_pre_cotizacion()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_num bigint;
begin
  insert into public.th_counters (key, last_value)
  values ('pre_cotizacion', 0)
  on conflict (key) do nothing;

  update public.th_counters
  set last_value = last_value + 1,
      updated_at = now()
  where key = 'pre_cotizacion'
  returning last_value into next_num;

  return 'PRE-' || lpad(next_num::text, 5, '0');
end;
$$;

drop function if exists public.emit_th_cotizacion(uuid);

create or replace function public.emit_th_cotizacion(doc_id bigint)
returns public.th_documentos
language plpgsql
security definer
set search_path = public
as $$
declare
  doc public.th_documentos;
  next_num bigint;
begin
  select *
  into doc
  from public.th_documentos
  where id = doc_id
  for update;

  if not found then
    raise exception 'Documento no encontrado';
  end if;

  if doc.numero is not null then
    return doc;
  end if;

  insert into public.th_counters (key, last_value)
  values ('cotizacion', 11865)
  on conflict (key) do nothing;

  update public.th_counters
  set last_value = last_value + 1,
      updated_at = now()
  where key = 'cotizacion'
  returning last_value into next_num;

  update public.th_documentos
  set numero = next_num,
      tipo = 'COTIZACIÓN',
      estado = 'cotizacion_emitida',
      emitida_at = now(),
      updated_at = now(),
      data = coalesce(data, '{}'::jsonb)
        || jsonb_build_object(
          'numero', next_num::text,
          'tipo', 'COTIZACIÓN',
          'estado', 'cotizacion_emitida',
          'numeroReservado', true,
          'dirty', false,
          'savedAt', now()::text
        )
  where id = doc_id
  returning * into doc;

  return doc;
end;
$$;

grant execute on function public.next_th_pre_cotizacion() to anon, authenticated;
grant execute on function public.emit_th_cotizacion(bigint) to anon, authenticated;

notify pgrst, 'reload schema';
