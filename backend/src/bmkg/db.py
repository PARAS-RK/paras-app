from datetime import datetime, timedelta, timezone

from supabase import create_client

from .config import SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL
from .waktu import BASI

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

TOTAL_DITULIS = 0  # jumlah baris yang berhasil ditulis selama run ini (dibaca run.py)


def muat_area():
    """Kelurahan unik yang dipakai user."""
    area, mulai = {}, 0
    while True:
        res = (sb.table("profiles")
                 .select("region_id, regions(subdistrict_code, subdistrict, district, city, province)")
                 .not_.is_("region_id", "null").order("region_id")
                 .range(mulai, mulai + 999).execute())
        for p in res.data:
            r = p.get("regions")
            if r and r.get("subdistrict_code"):
                area[r["subdistrict_code"]] = r
        if len(res.data) < 1000:
            return area
        mulai += 1000


def muat_lama(tipe):
    """Ringkasan yang sudah tersimpan, untuk cek hash."""
    lama, mulai = {}, 0
    while True:
        res = (sb.table("bmkg_cache")
                 .select("area_code,summary_text,summary_source,summary_hash")
                 .eq("data_type", tipe).order("area_code")
                 .range(mulai, mulai + 999).execute())
        lama.update({r["area_code"]: r for r in res.data})
        if len(res.data) < 1000:
            return lama
        mulai += 1000


def baris_cache(tipe, kode, status, payload, ringkasan, issued=None):
    teks, sumber, h = ringkasan
    sekarang = datetime.now(timezone.utc)
    return {
        "data_type": tipe, "area_code": kode, "status": status, "payload": payload,
        "summary_text": teks, "summary_source": sumber, "summary_hash": h,
        "source_issued_at": issued.isoformat() if issued else None,
        "fetched_at": sekarang.isoformat(),
        "expired_at": (sekarang + timedelta(seconds=BASI[tipe])).isoformat(),
    }


def tulis(baris):
    global TOTAL_DITULIS
    for i in range(0, len(baris), 200):
        sb.table("bmkg_cache").upsert(baris[i:i + 200], on_conflict="data_type,area_code").execute()
    TOTAL_DITULIS += len(baris)
    print(f"  {len(baris)} baris ditulis")


def bersihkan(hari=7):
    """Hapus baris kelurahan yang sudah lama tidak diperbarui (tidak ada user lagi)."""
    batas = (datetime.now(timezone.utc) - timedelta(days=hari)).isoformat()
    sb.table("bmkg_cache").delete().lt("fetched_at", batas).execute()