-- ==========================================
-- SKRIP GABUNGAN FINAL: TABEL BMKG_CACHE (VERSI UPDATE)
-- ==========================================

-- 1. Penyesuaian Nama Kolom
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'bmkg_cache' 
      and column_name = 'expires_at'
  ) then
    alter table public.bmkg_cache rename column expires_at to expired_at;
  end if;
end $$;


-- 2. Fungsi Pendukung ---------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Kode kelurahan milik user yang login (security definer: tidak bergantung RLS profiles/regions)
create or replace function public.my_subdistrict_code()
returns text
language sql stable security definer
set search_path = ''
as $$
  select r.subdistrict_code
  from public.profiles p
  join public.regions  r on r.region_id = p.region_id
  where p.user_id = auth.uid()
  limit 1
$$;
revoke execute on function public.my_subdistrict_code() from public, anon;
grant  execute on function public.my_subdistrict_code() to authenticated;


-- 3. Constraint & Indeks bmkg_cache --------------------------------------
-- NOT VALID = hanya berlaku untuk data baru, baris lama tidak memblokir migrasi.
alter table public.bmkg_cache drop constraint if exists bmkg_cache_type_check;
alter table public.bmkg_cache add constraint bmkg_cache_type_check
  check (data_type in ('cuaca', 'peringatan', 'gempa_rasa', 'gempa_besar', 'bencana')) not valid;

alter table public.bmkg_cache drop constraint if exists bmkg_cache_area_code_check;
alter table public.bmkg_cache add constraint bmkg_cache_area_code_check
  check (area_code ~ '^[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{4}$') not valid;   -- Sesuai format regions dengan titik

alter table public.bmkg_cache drop constraint if exists bmkg_cache_payload_object_check;
alter table public.bmkg_cache add constraint bmkg_cache_payload_object_check
  check (jsonb_typeof(payload) = 'object') not valid;

create index if not exists bmkg_cache_area_code_idx   on public.bmkg_cache (area_code);
create index if not exists profiles_region_id_idx     on public.profiles (region_id);


-- 4. RLS (Row Level Security) & Policy -----------------------------------
alter table public.bmkg_cache enable row level security;
revoke all    on public.bmkg_cache from anon, authenticated;
grant  select on public.bmkg_cache to authenticated;

drop policy if exists bmkg_cache_select_own_region on public.bmkg_cache;
create policy bmkg_cache_select_own_region
  on public.bmkg_cache for select to authenticated
  using (area_code = (select public.my_subdistrict_code()));


-- 5. Fungsi Pembersihan Cache Otomatis ----------------------------------
create or replace function public.bersihkan_bmkg_cache(hari int default 7)
returns integer
language sql
set search_path = ''
as $$
  with d as (
    delete from public.bmkg_cache c
    where c.fetched_at < now() - make_interval(days => hari)
    returning 1
  )
  select count(*)::int from d
$$;
revoke execute on function public.bersihkan_bmkg_cache(int) from public, anon, authenticated;
grant  execute on function public.bersihkan_bmkg_cache(int) to service_role;


