-- =====================================================================
-- Menambah jenis kontak darurat yang dipakai wilayah: PLN, SAR, dan
-- layanan darurat terpadu. Constraint unik (region_id, agency_type)
-- tetap dipertahankan agar satu wilayah tidak punya duplikat jenis.
-- =====================================================================

alter table public.emergency_contacts
    drop constraint if exists emergency_contacts_agency_type_check;

alter table public.emergency_contacts
    add constraint emergency_contacts_agency_type_check
    check (
        agency_type in (
            'bpbd',
            'damkar',
            'ambulance',
            'police',
            'other',
            'pln',
            'sar',
            'darurat'
        )
    );
