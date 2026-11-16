from collections import Counter
import re
from .config import CHUNK_OVERLAP, CHUNK_SIZE, MAX_CHUNK_CHARS, MIN_CHUNK_CHARS

BULLET = re.compile(r"^\s*([-•●▪◦*]|\d{1,2}[.)]|[a-zA-Z][.)])\s+")
NOMOR_AWAL = r"^(?:\d{1,2}[.)]?\s*|[IVX]+[.)]\s*)?"
FASE_HEAD = [
    (
        "pasca",
        re.compile(
            NOMOR_AWAL
            + r"(pasca\s*-?\s*bencana|pascabencana|setelah|sesudah|pemulihan|rehabilitasi|rekonstruksi)\b",
            re.I,
        ),
    ),
    (
        "pra",
        re.compile(
            NOMOR_AWAL
            + r"(pra\s*-?\s*bencana|prabencana|sebelum|persiapan|kesiapsiagaan|mitigasi|pencegahan|peringatan\s+dini)\b",
            re.I,
        ),
    ),
    (
        "saat",
        re.compile(
            NOMOR_AWAL + r"(saat|ketika|selama|tanggap\s+darurat|pada\s+saat)\b",
            re.I,
        ),
    ),
]
JENIS_KEYWORDS = {
    "gempa": "gempa",
    "tsunami": "tsunami",
    "banjir": "banjir",
    "longsor": "longsor",
    "gerakan tanah": "longsor",
    "gunung": "gunung api",
    "erupsi": "gunung api",
    "kebakaran": "kebakaran",
    "kekeringan": "kekeringan",
    "puting beliung": "angin kencang",
    "cuaca ekstrem": "cuaca ekstrem",
}


def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP):
    text = " ".join(text.split())
    if not text:
        return []
    if overlap >= chunk_size:
        raise ValueError("overlap harus lebih kecil daripada chunk_size")
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        part = text[start:end].strip()
        if part:
            chunks.append(part)
        if end == len(text):
            break
        start = end - overlap
    return chunks


def deteksi_jenis(title: str, filename: str) -> str:
    s = f"{title} {filename}".lower()
    for kw, jenis in JENIS_KEYWORDS.items():
        if kw in s:
            return jenis
    return "umum"


def kapital_ratio(line: str) -> float:
    kata = [w for w in re.findall(r"[A-Za-zÀ-ÿ]+", line) if len(w) > 2]
    return sum(w[0].isupper() for w in kata) / len(kata) if kata else 0.0


def tipe_heading(line: str):
    l = line.strip()
    if not l or len(l) > 70 or BULLET.match(l):
        return False, None
    if l.endswith((".", ",", ";", ":")) and not l.isupper():
        return False, None
    if len(l.split()) > 8:
        return False, None
    kapital = l.isupper() or kapital_ratio(l) >= 0.6
    for fase, pat in FASE_HEAD:
        if pat.search(l) and kapital:
            return True, fase
    if kapital and len(l.split()) >= 2:
        return True, None
    return False, None


def hapus_header_footer(pages: list[dict], ambang: float = 0.3) -> list[dict]:
    cnt = Counter()
    for p in pages:
        for l in {x.strip() for x in p["text"].split("\n") if x.strip()}:
            cnt[l] += 1
    batas = max(3, ambang * len(pages))
    umum = {l for l, c in cnt.items() if c >= batas and len(l) < 80}
    hasil = []
    for p in pages:
        baris = [
            l
            for l in p["text"].split("\n")
            if l.strip() not in umum and not re.fullmatch(r"\d{1,3}", l.strip())
        ]
        q = dict(p)
        q["text"] = "\n".join(baris)
        hasil.append(q)
    return hasil


def jadi_unit(lines: list[str]) -> list[str]:
    unit = []
    for l in lines:
        if BULLET.match(l) or not unit:
            unit.append(l)
        else:
            unit[-1] += " " + l
    return unit


def _bentuk(buf, s, info, filename, jenis):
    teks = "\n".join(buf)
    return {
        "text": teks,
        "source": filename,
        "embed_text": f"{jenis} | fase {s['fase']} | {s['heading']}\n{teks}",
        "meta": {
            "source": filename,
            "title": info["title"],
            "publisher": info["publisher"],
            "source_url": info["source_url"],
            "document_date": info["document_date"],
            "verified_by": info["verified_by"],
            "filename": filename,
            "jenis": jenis,
            "fase": s["fase"],
            "heading": s["heading"],
            "halaman": int(s["hal"]),
        },
    }


def buat_chunks(raw_pages: list[dict]) -> list[dict]:
    by_file = {}
    for p in raw_pages:
        by_file.setdefault(p["filename"], []).append(p)

    chunks = []
    for filename, pages in by_file.items():
        pages = hapus_header_footer(pages)
        info = pages[0]
        jenis = deteksi_jenis(info["title"], filename)
        fase, heading = "umum", ""

        seksi = []
        cur = {"fase": fase, "heading": heading, "hal": pages[0]["page"], "lines": []}
        for p in pages:
            for raw in p["text"].split("\n"):
                line = re.sub(r"\s+", " ", raw).strip()
                if not line:
                    continue
                is_h, fb = tipe_heading(line)
                if is_h:
                    if cur["lines"]:
                        seksi.append(cur)
                    if fb:
                        fase = fb
                    heading = line
                    cur = {"fase": fase, "heading": heading, "hal": p["page"], "lines": []}
                else:
                    cur["lines"].append(line)
        if cur["lines"]:
            seksi.append(cur)

        for s in seksi:
            unit = jadi_unit(s["lines"])
            buf, panjang = [], 0
            for u in unit:
                if buf and panjang + len(u) > MAX_CHUNK_CHARS:
                    chunks.append(_bentuk(buf, s, info, filename, jenis))
                    buf = buf[-1:]
                    panjang = sum(len(x) for x in buf)
                buf.append(u)
                panjang += len(u)
            if buf:
                chunks.append(_bentuk(buf, s, info, filename, jenis))

    return [c for c in chunks if len(c["text"]) >= MIN_CHUNK_CHARS]