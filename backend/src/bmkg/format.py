import re


def adm4_titik(kode):
    """3174041006 -> 31.74.04.1006 (format yang diminta API BMKG)."""
    return f"{kode[:2]}.{kode[2:4]}.{kode[4:6]}.{kode[6:]}"


def bersih(nama):
    """'KOTA ADM. JAKARTA SELATAN' -> 'jakarta selatan'."""
    n = (nama or "").lower()
    n = re.sub(r"^(kab\.|kabupaten|kota adm\.|kota)\s+", "", n)
    return n.strip()


def mag(g):
    try:
        return float(str(g["Magnitude"]).replace(",", "."))
    except Exception:
        return 0.0


def pesan_tidak_pasti(nama):
    return (f"Informasi {nama} belum bisa dipastikan saat ini. "
            "Silakan cek langsung di bmkg.go.id atau aplikasi InfoBMKG.")


def item_gempa(g):
    return {"magnitudo": g["Magnitude"], "sumber": g["Wilayah"], "kedalaman": g["Kedalaman"],
            "waktu": f"{g['Tanggal']} {g['Jam']}", "potensi": g.get("Potensi"),
            "dirasakan": g.get("cocok")}