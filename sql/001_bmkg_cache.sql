create table if not exists public.bmkg_cache (
  cache_id         uuid primary key default gen_random_uuid(),
  data_type        text not null,
  area_code        text not null,                    -- = regions.subdistrict_code (10 digit, tanpa titik)
  status           text not null default 'normal',
  payload          jsonb not null default '{}'::jsonb,
  summary_text     text,
  summary_source   text,
  summary_hash     text,
  source_issued_at timestamptz,                      -- waktu terbit data menurut BMKG
  fetched_at       timestamptz not null default now(),
  expired_at       timestamptz not null,             -- lewat ini = data dianggap basi
  updated_at       timestamptz not null default now(),

  constraint bmkg_cache_data_type_check
    check (data_type in ('cuaca', 'peringatan', 'gempa_rasa', 'gempa_besar')),
  constraint bmkg_cache_area_code_check
    check (area_code ~ '^[0-9]{10}$'),
  constraint bmkg_cache_status_check
    check (status in ('normal', 'ada', 'aman', 'tidak_pasti')),
  constraint bmkg_cache_summary_source_check
    check (summary_source is null or summary_source in ('ai', 'rule')),
  constraint bmkg_cache_payload_object_check
    check (jsonb_typeof(payload) = 'object'),
  constraint bmkg_cache_expiry_check
    check (expired_at > fetched_at),
  constraint bmkg_cache_unique_area_type
    unique (data_type, area_code)
);

create index if not exists bmkg_cache_area_code_idx on public.bmkg_cache (area_code);
create index if not exists profiles_region_id_idx   on public.profiles (region_id);

-- updated_at otomatis
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists bmkg_cache_set_updated_at on public.bmkg_cache;
create trigger bmkg_cache_set_updated_at
  before update on public.bmkg_cache
  for each row execute function public.set_updated_at();

-- RLS
alter table public.bmkg_cache enable row level security;

revoke all on public.bmkg_cache from anon, authenticated;
grant  select on public.bmkg_cache to authenticated;
-- Tanpa policy insert/update/delete: hanya service_role (backend Python) yang bisa menulis.

-- Kode kelurahan milik user yang sedang login
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

drop policy if exists bmkg_cache_select_own_region on public.bmkg_cache;
create policy bmkg_cache_select_own_region
  on public.bmkg_cache
  for select
  to authenticated
  using (area_code = (select public.my_subdistrict_code()));