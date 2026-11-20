-- ==========================================
-- 002: Keputusan Ketua PKK -> Jalur A / Jalur B / Tolak
-- ==========================================
-- Jalankan di Supabase SQL Editor sebelum memakai Dashboard versi baru.
--
-- Fungsi ini menggantikan seluruh varian lama save_admin_review.
-- Kontrak yang dipakai client (context/ReportContext.jsx):
--   p_decision      : 'accepted' | 'rejected'
--   p_route         : 'jalur_a' | 'jalur_b' (wajib saat diterima, null saat ditolak)
--   p_reason        : wajib untuk 'rejected', null untuk 'accepted'
--   p_override_from : null untuk keputusan baru (hanya untuk kompatibilitas data lama)

do $$
declare
  fn record;
begin
  for fn in
    select pg_get_function_identity_arguments(p.oid) as arguments
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'save_admin_review'
  loop
    execute format('drop function public.save_admin_review(%s)', fn.arguments);
  end loop;
end $$;

create or replace function public.save_admin_review(
  p_report_id bigint,
  p_decision text,
  p_route text default null,
  p_reason text default null,
  p_override_from text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
  v_decision text := lower(btrim(coalesce(p_decision, '')));
  v_route text;
  v_reason text;
  v_notes text;
  v_review_columns text;
  v_review_values text;
  v_has_reviewed_by boolean := false;
  v_has_admin_user_id boolean := false;
begin
  -- Hanya Ketua PKK terverifikasi pada wilayah laporan yang boleh memutuskan.
  if not exists (
    select 1
    from public.reports r
    join public.profiles p
      on p.user_id = auth.uid()
    join public.pkk_members m
      on m.user_id = auth.uid()
    join public.pkk_units u
      on u.pkk_unit_id = m.pkk_unit_id
    where r.report_id = p_report_id
      and r.region_id = u.region_id
      and p.account_category = 'anggota_pkk'
      and p.account_status = 'active'
      and m.member_role = 'leader'
      and m.status = 'verified'
      and u.verification_status = 'verified'
  ) then
    raise exception 'Akses ditolak: hanya Ketua PKK wilayah laporan yang dapat memutuskan.';
  end if;

  select r.report_status
    into v_status
    from public.reports r
    where r.report_id = p_report_id
    for update;

  if not found then
    raise exception 'Laporan tidak ditemukan.';
  end if;

  if v_status <> 'submitted' then
    raise exception 'Laporan sudah diproses atau tidak berada dalam status yang dapat ditinjau.';
  end if;

  if v_decision = 'accepted' then
    if p_route not in ('jalur_a', 'jalur_b') then
      raise exception 'Jalur tujuan wajib diisi: jalur_a atau jalur_b.';
    end if;

    v_route := p_route;
    v_reason := null;
    v_notes := case p_route
      when 'jalur_a' then 'Laporan diterima melalui Jalur A (darurat) dan diteruskan ke Asisten AI.'
      else 'Laporan diterima melalui Jalur B (komunitas) dan masuk klaster Tabungan Aksi.'
    end;
  elsif v_decision = 'rejected' then
    if p_reason is null or btrim(p_reason) = '' then
      raise exception 'Alasan penolakan wajib diisi.';
    end if;

    -- Rute tidak disimpan saat laporan ditolak.
    v_route := case when p_route in ('jalur_a', 'jalur_b') then p_route else null end;
    v_reason := btrim(p_reason);
    v_notes := v_reason;
  else
    raise exception 'Keputusan tidak dikenal.';
  end if;

  update public.reports
     set report_status = case when v_decision = 'rejected' then 'rejected' else 'in_review' end,
         updated_at = now()
   where report_id = p_report_id;

  -- Log publik menjadi sumber alasan penolakan di Pantau Lapor (app/api/pantau/[id]).
  insert into public.report_status_logs (
    report_id,
    log_status,
    log_notes,
    is_public,
    created_at
  ) values (
    p_report_id,
    case when v_decision = 'rejected' then 'rejected' else 'in_review' end,
    v_notes,
    true,
    now()
  );

  -- Replace review lama agar satu laporan hanya punya satu keputusan final.
  delete from public.report_admin_reviews
   where report_id = p_report_id;

  select
    bool_or(column_name = 'reviewed_by'),
    bool_or(column_name = 'admin_user_id')
    into v_has_reviewed_by, v_has_admin_user_id
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'report_admin_reviews';

  v_review_columns := 'report_id, review_decision, handling_route, review_reason, override_from, reviewed_at';
  v_review_values := '$1, $2, $3, $4, $5, now()';

  if v_has_reviewed_by then
    v_review_columns := v_review_columns || ', reviewed_by';
    v_review_values := v_review_values || ', auth.uid()';
  end if;

  if v_has_admin_user_id then
    v_review_columns := v_review_columns || ', admin_user_id';
    v_review_values := v_review_values || ', auth.uid()';
  end if;

  execute format(
    'insert into public.report_admin_reviews (%s) values (%s)',
    v_review_columns,
    v_review_values
  ) using p_report_id, v_decision, v_route, v_reason, p_override_from;
end $$;

revoke all on function public.save_admin_review(bigint, text, text, text, text) from public, anon;
grant execute on function public.save_admin_review(bigint, text, text, text, text) to authenticated;
