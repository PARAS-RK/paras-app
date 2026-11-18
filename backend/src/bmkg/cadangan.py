from .format import mag, pesan_tidak_pasti
from .waktu import jam_wib


def cadangan_cuaca(slot, tempat):
    if not slot:
        return pesan_tidak_pasti("prakiraan cuaca")
    kondisi = " ".join(s["kondisi"] or "" for s in slot[:8]).lower()
    suhu = [float(s["suhu"]) for s in slot[:8] if s.get("suhu") not in (None, "")]
    rentang = f"{int(min(suhu))}-{int(max(suhu))}°C" if suhu else "tidak diketahui"
    if "petir" in kondisi:
        return (f"Hujan disertai petir berpotensi terjadi di {tempat}, dengan suhu sekitar {rentang}.\n"
                "Sebaiknya tetap di rumah jika tidak ada keperluan mendesak.")
    if "hujan" in kondisi:
        return (f"Wilayah {tempat} berpeluang mengalami hujan dengan suhu sekitar {rentang}.\n"
                "Siapkan payung atau jas hujan sebelum bepergian.")
    if "kabut" in kondisi or "asap" in kondisi:
        return (f"Kondisi udara di {tempat} terpantau berkabut dengan suhu sekitar {rentang}.\n"
                "Berhati-hatilah saat bepergian dan perhatikan kondisi jalan.")
    return (f"Di {tempat}, tidak terdeteksi hujan dalam informasi cuaca yang tersedia, dengan suhu sekitar {rentang}.\n"
            "Anda dapat beraktivitas seperti biasa sambil tetap memperhatikan perubahan cuaca.")


def cadangan_peringatan(daftar):
    if not daftar:
        return ("Tidak ada peringatan cuaca buruk untuk saat ini, aman untuk beraktivitas.\n"
                "Tetap pantau informasi cuaca ya.")
    p = daftar[0]
    judul = p.get("judul") or "cuaca buruk"
    wilayah = p.get("wilayah") or "sekitar daerah Anda"
    sampai = f", berlaku sampai {jam_wib(p['berakhir'])}" if p.get("berakhir") else ""
    lainnya = f" (ada {len(daftar) - 1} peringatan lain)" if len(daftar) > 1 else ""
    return (f"Waspada {judul} diperkirakan terjadi di {wilayah}{sampai}{lainnya}.\n"
            "Mohon tetap waspada, kurangi kegiatan di luar rumah, dan ikuti informasi resmi BMKG.")


def cadangan_gempa_rasa(daftar):
    if not daftar:
        return ("Tidak ada gempa yang terasa di daerah Anda baru-baru ini.\n"
                "Aman beraktivitas seperti biasa.")
    g = max(daftar, key=mag)
    tambahan = f" (ada {len(daftar)} gempa terasa, ini yang terkuat)" if len(daftar) > 1 else ""
    saran = ("Tetap tenang, periksa keadaan rumah, dan jauhi bangunan yang retak."
             if mag(g) >= 5 else
             "Tetap tenang dan periksa keadaan rumah, kemungkinan tidak ada kerusakan berarti.")
    return f"Baru saja ada gempa berkekuatan {g['Magnitude']} yang terasa di wilayah Anda{tambahan}.\n{saran}"


def cadangan_gempa_besar(besar, terasa, hari=7):
    if not besar:
        return (f"Tidak ada gempa besar (kekuatan 5.0 ke atas) di Indonesia dalam {hari} hari terakhir.\n"
                "Tetap pantau informasi resmi BMKG.")
    g = besar[0]
    awal = (f"Dalam {hari} hari terakhir ada {len(besar)} gempa besar di Indonesia, "
            f"yang terkuat berkekuatan {g['Magnitude']} di {g['Wilayah']}.")
    if terasa:
        return (f"{awal} Ada yang terasa sampai daerah Anda.\n"
                "Tetap tenang, periksa keadaan rumah, dan waspada kalau ada gempa susulan.")
    return (f"{awal} Tidak ada yang terasa sampai daerah Anda.\n"
            "Meski begitu tetap hati-hati dan pantau informasi resmi BMKG.")