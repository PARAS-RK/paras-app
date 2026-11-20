"""
  python backend/scripts/run.py --jobs cuaca
  python backend/scripts/run.py --jobs peringatan,gempa

Kode keluar 1 (run merah di GitHub) kalau: tidak ada kelurahan aktif, atau satu job
tidak menulis satu baris pun. Kegagalan sebagian dan AI yang gagal hanya jadi peringatan.
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from bmkg import db  # noqa: E402
from bmkg.ai import ringkas as modul_ringkas  # noqa: E402
from bmkg.jobs import cuaca, gempa, peringatan  # noqa: E402

JOBS = {"cuaca": cuaca.jalankan, "peringatan": peringatan.jalankan, "gempa": gempa.jalankan}
# baris yang diharapkan per kelurahan (gempa menulis 2: dirasakan + besar)
BARIS_PER_AREA = {"cuaca": 1, "peringatan": 1, "gempa": 2}


def anotasi_error(pesan):
    print(f"::error::{pesan}")  # tampil sebagai anotasi merah di halaman run GitHub


def anotasi_warning(pesan):
    print(f"::warning::{pesan}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", default="cuaca,peringatan,gempa")
    dipilih = [j for j in ap.parse_args().jobs.split(",") if j in JOBS]

    if not dipilih:
        anotasi_error("Tidak ada job yang valid. Pilihan: cuaca, peringatan, gempa")
        sys.exit(1)

    area = db.muat_area()
    print(f"{len(area)} kelurahan aktif")
    if not area:
        anotasi_error("0 kelurahan aktif: cek SUPABASE_URL, key, dan data profiles/regions")
        sys.exit(1)

    gagal = False
    for nama in dipilih:
        sebelum = db.TOTAL_DITULIS
        try:
            JOBS[nama](area)
        except Exception as e:
            anotasi_error(f"Job {nama} berhenti karena error: {e}")
            gagal = True
            continue

        ditulis = db.TOTAL_DITULIS - sebelum
        harapan = BARIS_PER_AREA[nama] * len(area)
        if ditulis == 0:
            anotasi_error(f"Job {nama} tidak menulis satu baris pun: cek log di atas")
            gagal = True
        elif ditulis < harapan:
            anotasi_warning(f"Job {nama}: hanya {ditulis} dari {harapan} baris yang tertulis")

    if modul_ringkas.AI_GAGAL:
        anotasi_warning(f"Ringkasan AI gagal {modul_ringkas.AI_GAGAL} kali, memakai aturan cadangan")

    if "cuaca" in dipilih:
        try:
            db.bersihkan()
        except Exception as e:
            anotasi_warning(f"Pembersihan cache lama gagal: {e}")

    sys.exit(1 if gagal else 0)