import time
from datetime import datetime, timedelta, timezone

from .. import db
from ..ai.ringkas import ringkas
from ..cadangan import cadangan_cuaca
from ..client import unduh_json
from ..config import URL_CUACA
from ..format import pesan_tidak_pasti
from ..waktu import (JAM_RINGKAS_CUACA, JEDA_BMKG_DETIK, JENDELA_CUACA_DEPAN_JAM,
                     JENDELA_CUACA_LALU_JAM, WIB)


def _ambil_slot(js, sekarang):
    """Slot dalam jendela waktu + waktu terbit data dari BMKG."""
    slot, issued = [], None
    for blok in js.get("data", []):
        for hari in blok.get("cuaca", []):
            for s in hari:
                try:
                    t = datetime.strptime(s["local_datetime"], "%Y-%m-%d %H:%M:%S")
                except Exception:
                    continue
                if not (sekarang - timedelta(hours=JENDELA_CUACA_LALU_JAM) < t
                        <= sekarang + timedelta(hours=JENDELA_CUACA_DEPAN_JAM)):
                    continue
                slot.append({"waktu": s["local_datetime"], "kondisi": s.get("weather_desc"),
                             "suhu": s.get("t"), "kelembapan": s.get("hu"),
                             "angin": s.get("ws"), "arah_angin": s.get("wd"),
                             "ikon": s.get("image")})
                if not issued and s.get("analysis_date"):
                    try:
                        issued = datetime.fromisoformat(s["analysis_date"]).replace(tzinfo=timezone.utc)
                    except ValueError:
                        pass
    slot.sort(key=lambda x: x["waktu"])
    return slot, issued


def jalankan(area):
    print(f"[cuaca] {len(area)} kelurahan")
    lama = db.muat_lama("cuaca")
    sekarang = datetime.now(WIB).replace(tzinfo=None)
    batas_ai = (sekarang + timedelta(hours=JAM_RINGKAS_CUACA)).strftime("%Y-%m-%d %H:%M:%S")
    baris = []

    for kode, r in area.items():
        try:
            # kode sudah berformat 31.71.03.1001, langsung dipakai sebagai adm4
            js = unduh_json(URL_CUACA, {"adm4": kode})
        except Exception as e:
            print(f"  {kode} gagal: {e}")  # baris lama dibiarkan, expired_at yang menentukan
            continue
        time.sleep(JEDA_BMKG_DETIK)

        slot, issued = _ambil_slot(js, sekarang)
        if not slot:
            baris.append(db.baris_cache("cuaca", kode, "tidak_pasti", {"slots": []},
                                        (pesan_tidak_pasti("prakiraan cuaca"), "rule", None)))
            continue

        tempat = (r.get("subdistrict") or "").title()
        slot_ai = [s for s in slot if s["waktu"] <= batas_ai]
        data_ai = [{"Waktu": s["waktu"], "Cuaca": s["kondisi"], "Suhu (°C)": s["suhu"],
                    "Kelembapan (%)": s["kelembapan"], "Angin (km/j)": s["angin"],
                    "Arah angin": s["arah_angin"]} for s in slot_ai]
        teks = ringkas(lama.get(kode), "Prakiraan cuaca 24 jam ke depan", data_ai,
                       cadangan_cuaca(slot_ai, tempat))
        baris.append(db.baris_cache("cuaca", kode, "normal", {"slots": slot}, teks, issued))

    db.tulis(baris)