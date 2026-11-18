"""
  python backend/scripts/run.py --jobs cuaca
  python backend/scripts/run.py --jobs peringatan,gempa
"""
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from bmkg import db  # noqa: E402
from bmkg.jobs import cuaca, gempa, peringatan  # noqa: E402

JOBS = {"cuaca": cuaca.jalankan, "peringatan": peringatan.jalankan, "gempa": gempa.jalankan}

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--jobs", default="cuaca,peringatan,gempa")
    dipilih = [j for j in ap.parse_args().jobs.split(",") if j in JOBS]

    area = db.muat_area()
    print(f"{len(area)} kelurahan aktif")
    if area:
        for nama in dipilih:
            JOBS[nama](area)
    if "cuaca" in dipilih:
        db.bersihkan()