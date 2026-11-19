import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from .. import db
from ..ai.ringkas import ringkas
from ..cadangan import cadangan_peringatan
from ..client import unduh
from ..config import URL_PERINGATAN
from ..format import bersih
from ..waktu import parse_waktu

NS = {"cap": "urn:oasis:names:tc:emergency:cap:1.2"}


def _masih_berlaku(p):
    d = parse_waktu(p.get("berakhir"))
    return True if d is None else d >= datetime.now(timezone.utc)


def _ambil_semua():
    hasil = []
    for it in ET.fromstring(unduh(URL_PERINGATAN)).findall(".//item"):
        link = it.findtext("link")
        try:
            info = ET.fromstring(unduh(link)).find("cap:info", NS)
            hasil.append({
                "judul": info.findtext("cap:headline", default="", namespaces=NS),
                "deskripsi": info.findtext("cap:description", default="", namespaces=NS),
                "berlaku": info.findtext("cap:effective", default="", namespaces=NS),
                "berakhir": info.findtext("cap:expires", default="", namespaces=NS),
                "wilayah": info.findtext("cap:area/cap:areaDesc", default="", namespaces=NS),
                "link": link,
            })
        except Exception:
            hasil.append({"judul": it.findtext("title") or "", "deskripsi": it.findtext("description") or "",
                          "berlaku": "", "berakhir": "", "wilayah": "", "link": link})
    return [p for p in hasil if _masih_berlaku(p)]


def jalankan(area):
    print(f"[peringatan] {len(area)} kelurahan")
    try:
        semua = _ambil_semua()
    except Exception as e:
        print(f"  feed gagal, data lama dibiarkan: {e}")
        return
    lama = db.muat_lama("peringatan")
    baris = []

    for kode, r in area.items():
        kunci = [k for k in (bersih(r.get("district")), bersih(r.get("city"))) if k]
        cocok = [p for p in semua
                 if any(re.search(rf"\b{re.escape(k)}\b",
                                  f"{p['wilayah']} {p['judul']} {p['deskripsi']}".lower())
                        for k in kunci)]

        items = [{"judul": p["judul"], "wilayah": p["wilayah"], "berlaku": p["berlaku"],
                  "berakhir": p["berakhir"], "deskripsi": p["deskripsi"][:300], "link": p["link"]}
                 for p in cocok]
        data_ai = [{k: v for k, v in i.items() if k != "link"} for i in items] or "tidak ada"
        teks = ringkas(lama.get(kode), "Peringatan dini cuaca di kecamatan/kabupaten pengguna",
                       data_ai, cadangan_peringatan(cocok))
        waktu = [parse_waktu(p["berlaku"]) for p in cocok if parse_waktu(p["berlaku"])]
        baris.append(db.baris_cache("peringatan", kode, "ada" if cocok else "aman",
                                    {"items": items}, teks, max(waktu) if waktu else None))
    db.tulis(baris)