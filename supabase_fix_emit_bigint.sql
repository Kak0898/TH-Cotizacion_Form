-- FIX: usar bigint para th_documentos.id
-- Ejecuta este archivo si al emitir ves:
-- operator does not exist: bigint = uuid

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

grant execute on function public.emit_th_cotizacion(bigint) to anon, authenticated;
notify pgrst, 'reload schema';
