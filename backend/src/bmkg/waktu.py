from datetime import datetime, timedelta, timezone

WIB = timezone(timedelta(hours=7))

# detik sebelum data dianggap basi -> expired_at
BASI = {
    "cuaca": 4 * 3600,
    "peringatan": 30 * 60,
    "gempa_rasa": 60 * 60,
    "gempa_besar": 60 * 60,
}

BLOK_JAM_RINGKASAN = 3        # ringkasan AI dibuat ulang maksimal sekali per blok ini
JENDELA_CUACA_LALU_JAM = 3    # slot BMKG 3 jam, slot yang masih berlaku bisa mulai 3 jam lalu
JENDELA_CUACA_DEPAN_JAM = 30  # yang disimpan ke payload
JAM_RINGKAS_CUACA = 24        # yang dikirim ke AI
JAM_GEMPA_RASA = 24
HARI_GEMPA_BESAR = 7
JEDA_BMKG_DETIK = 1.1         # BMKG membatasi ~60 request/menit per IP


def parse_waktu(s):
    """Teks ISO -> datetime aware. Tanpa zona dianggap WIB. Gagal -> None."""
    if not s:
        return None
    try:
        d = datetime.fromisoformat(str(s).replace("Z", "+00:00"))
    except ValueError:
        return None
    return d if d.tzinfo else d.replace(tzinfo=WIB)


def jam_wib(s):
    d = parse_waktu(s)
    return d.astimezone(WIB).strftime("%d-%m %H.%M WIB") if d else s


def blok_waktu():
    s = datetime.now(WIB)
    return f"{s:%Y-%m-%d}-{s.hour // BLOK_JAM_RINGKASAN}"