import re
from datetime import datetime, timedelta, timezone

from .. import db
from ..ai.ringkas import ringkas
from ..cadangan import cadangan_gempa_besar, cadangan_gempa_rasa
from ..client import unduh_json
from ..config import URL_GEMPA_BESAR, URL_GEMPA_RASA
from ..format import bersih, item_gempa, mag
from ..waktu import HARI_GEMPA_BESAR, JAM_GEMPA_RASA, parse_waktu

TOPIK_BESAR = (
    "Gempa besar (kekuatan 5.0 ke atas) di Indonesia dalam 7 hari terakhir. "
    "Sebutkan jumlahnya dan lokasi gempa terkuat. Jika tidak terasa di wilayah pengguna, "
    "tetap ingatkan untuk berhati-hati."
)


def _gempa_terasa(feed, target):
    hasil = []
    for g in feed:
        cocok = []
        for b in [x.strip() for x in g.get("Dirasakan", "").split(",")]:
            nama = bersih(re.sub(r"^[IVX\-]+\s+", "", b))  # buang skala MMI
            if any(t == nama or re.search(rf"\b{re.escape(t)}\b", nama) for t in target):
                cocok.append(b)
        if cocok:
            hasil.append(dict(g, cocok=", ".join(cocok)))
    return hasil


def _dalam_waktu(g, batas):
    t = parse_waktu(g.get("DateTime"))
    return t is None or t >= batas  # waktu tak terbaca: tetap disertakan


def _terbaru(daftar):
    t = [parse_waktu(g.get("DateTime")) for g in daftar if parse_waktu(g.get("DateTime"))]
    return max(t) if t else None


def jalankan(area):
    print(f"[gempa] {len(area)} kelurahan")
    try:  # kedua feed wajib ada: "terasa di wilayah" butuh keduanya
        feed_rasa = unduh_json(URL_GEMPA_RASA)["Infogempa"]["gempa"]
        feed_besar = unduh_json(URL_GEMPA_BESAR)["Infogempa"]["gempa"]
    except Exception as e:
        print(f"  feed gagal, data lama dibiarkan: {e}")
        return

    sekarang = datetime.now(timezone.utc)
    besar = sorted((g for g in feed_besar if _dalam_waktu(g, sekarang - timedelta(days=HARI_GEMPA_BESAR))),
                   key=mag, reverse=True)
    top = besar[:5]
    lama_rasa, lama_besar = db.muat_lama("gempa_rasa"), db.muat_lama("gempa_besar")
    baris = []

    for kode, r in area.items():
        target = [t for t in (bersih(r.get("city")), bersih(r.get("district"))) if t]
        rasa_semua = _gempa_terasa(feed_rasa, target)
        rasa = [g for g in rasa_semua if _dalam_waktu(g, sekarang - timedelta(hours=JAM_GEMPA_RASA))]

        # --- gempa dirasakan ---
        data_ai = [{"pusat_gempa": g["Wilayah"], "waktu": f"{g['Tanggal']} {g['Jam']}",
                    "kekuatan": g["Magnitude"], "dirasakan": g.get("Dirasakan", "")}
                   for g in rasa] or "tidak ada"
        teks = ringkas(lama_rasa.get(kode), "Gempa yang dirasakan di wilayah pengguna dalam 24 jam terakhir",
                       data_ai, cadangan_gempa_rasa(rasa))
        baris.append(db.baris_cache("gempa_rasa", kode, "ada" if rasa else "aman",
                                    {"items": [item_gempa(g) for g in rasa]}, teks, _terbaru(rasa)))

        # --- gempa besar ---
        kunci_terasa = {(g["Tanggal"], g["Jam"]) for g in rasa_semua}
        terasa = any((g["Tanggal"], g["Jam"]) in kunci_terasa for g in besar)
        if besar:
            data_ai = {"jumlah_gempa_7_hari": len(besar),
                       "gempa_terkuat": [{"Wilayah": g["Wilayah"], "Magnitude": g["Magnitude"],
                                          "Tanggal": g["Tanggal"], "Jam": g["Jam"]} for g in top],
                       "ada_yang_terasa_di_wilayah_pengguna": terasa,
                       "wilayah_pengguna": f"{r.get('city')}, {r.get('province')}"}
        else:
            data_ai = {"jumlah_gempa_7_hari": 0}
        teks = ringkas(lama_besar.get(kode), TOPIK_BESAR, data_ai,
                       cadangan_gempa_besar(besar, terasa, HARI_GEMPA_BESAR))
        status = "ada" if terasa else ("normal" if besar else "aman")
        baris.append(db.baris_cache("gempa_besar", kode, status,
                                    {"jumlah": len(besar), "terasa_di_wilayah": terasa,
                                     "items": [item_gempa(g) for g in top]}, teks, _terbaru(besar)))
    db.tulis(baris)