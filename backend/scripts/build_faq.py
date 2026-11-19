import argparse
import json
import math
import os
import re
import sys
import time
from io import StringIO
from pathlib import Path

import pandas as pd
import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env.local")

API_KEY = os.getenv("GEMINI_API_KEY", "")
_raw_id = os.getenv("SHEET_ID", "").strip().strip("\"'")
_m = re.search(r"/d/([a-zA-Z0-9_-]+)", _raw_id)
SHEET_ID = _m.group(1) if _m else _raw_id
ANSWER_SHEET = os.getenv("ANSWER_SHEET_NAME", "Tentang PARAS")
QUESTION_SHEET = os.getenv("QUESTION_SHEET_NAME", "Pertanyaan")

EMBED_MODEL = "gemini-embedding-001"
DIM = 768  # harus sama dengan yang dibaca di route.js (otomatis dari kb_index.json)
BASE = "https://generativelanguage.googleapis.com/v1beta"
OUT_DIR = ROOT / "backend" / "documents" / "incoming"

def read_sheet(sheet_name, local_csv=None):
    if local_csv:
        df = pd.read_csv(local_csv)
    else:
        if not SHEET_ID:
            sys.exit("SHEET_ID belum diisi (atau gunakan --answers-csv / --questions-csv).")
        r = requests.get(
            f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq",
            params={"tqx": "out:csv", "sheet": sheet_name},
            timeout=30,
        )
        if r.status_code != 200:
            sys.exit(
                f"Gagal membaca tab '{sheet_name}' (HTTP {r.status_code}).\n"
                "Cek: (1) SHEET_ID benar, (2) spreadsheet dibagikan 'Anyone with the link: Viewer', "
                "(3) nama tab persis sama (huruf besar/kecil & spasi) dengan di .env.local."
            )
        df = pd.read_csv(StringIO(r.content.decode("utf-8")))
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df


def load_kb(answers_csv=None, questions_csv=None):
    ans = read_sheet(ANSWER_SHEET, answers_csv)
    qs = read_sheet(QUESTION_SHEET, questions_csv)

    if "pertanyaan" not in qs.columns and set(qs.columns) == set(ans.columns):
        sys.exit(
            f"Tab pertanyaan '{QUESTION_SHEET}' tidak ditemukan: Google Sheets mengembalikan "
            f"tab pertama (kolom {list(qs.columns)}).\n"
            "Perbaiki QUESTION_SHEET_NAME di .env.local agar sama persis dengan nama tab "
            "yang berisi kolom 'key' dan 'pertanyaan'."
        )

    for need, df, name in [({"key", "label", "answer"}, ans, "jawaban"),
                           ({"key", "pertanyaan"}, qs, "pertanyaan")]:
        missing = need - set(df.columns)
        if missing:
            sys.exit(f"Tab {name}: kolom hilang {missing}. Kolom ada: {list(df.columns)}")

    ans = ans.dropna(subset=["key", "answer"]).copy()
    ans["key"] = ans["key"].astype(str).str.strip().str.lower()
    ans = ans[ans["key"] != ""]

    qs = qs.dropna(subset=["key", "pertanyaan"]).copy()
    qs["key"] = qs["key"].astype(str).str.strip().str.lower()
    qs["pertanyaan"] = qs["pertanyaan"].astype(str).str.strip()

    kb = {
        r.key: {"label": str(r.label).strip(), "answer": str(r.answer).strip()}
        for r in ans.itertuples()
    }

    orphan = sorted(set(qs["key"]) - set(kb))
    if orphan:
        print(f"[PERINGATAN] key di tab pertanyaan tapi tidak ada jawabannya (dilewati): {orphan}")
    no_q = sorted(set(kb) - set(qs["key"]))
    if no_q:
        print(f"[INFO] key tanpa contoh pertanyaan (hanya label yang di-index): {no_q}")

    items = [{"key": r.key, "text": r.pertanyaan} for r in qs.itertuples() if r.key in kb]
    # label juga dijadikan "pertanyaan" supaya topik tetap bisa ditemukan
    items += [{"key": k, "text": v["label"]} for k, v in kb.items()]
    # buang teks kosong & duplikat
    seen, uniq = set(), []
    for it in items:
        if not it["text"] or it["text"].lower() in ("nan", "none"):
            continue
        sig = (it["key"], it["text"].lower())
        if sig not in seen:
            seen.add(sig)
            uniq.append(it)
    return kb, uniq

def normalize(v):
    n = math.sqrt(sum(x * x for x in v)) or 1.0
    return [x / n for x in v]


def _post_with_retry(body, max_retry=6):
    """Kirim ke Gemini; kalau kena batas kuota (429) tunggu sesuai saran Google lalu coba lagi."""
    for attempt in range(1, max_retry + 1):
        r = requests.post(
            f"{BASE}/models/{EMBED_MODEL}:batchEmbedContents",
            headers={"x-goog-api-key": API_KEY},
            json=body,
            timeout=60,
        )
        if r.status_code == 200:
            return r
        if r.status_code == 429 and attempt < max_retry:
            m = re.search(r"retry in ([\d.]+)s", r.text)
            wait = (float(m.group(1)) if m else 30) + 2
            print(f"  Kuota per menit tercapai, menunggu {wait:.0f} detik lalu melanjutkan "
                  f"(percobaan {attempt}/{max_retry - 1})...")
            time.sleep(wait)
            continue
        if r.status_code == 429:
            sys.exit(
                "Kuota Gemini masih habis setelah beberapa kali menunggu.\n"
                "Tunggu 1-2 menit lalu jalankan ulang. Teks yang sudah berhasil di-embed tidak "
                "akan diulang jika kb_index.json sudah tersimpan."
            )
        sys.exit(
            f"Gemini embedding gagal (HTTP {r.status_code}).\n"
            f"Pesan dari Google: {r.text[:600]}\n"
            "Penyebab umum: API key salah/belum diisi, model embedding tidak tersedia untuk key ini, "
            "atau ada teks kosong di spreadsheet."
        )


def embed(texts, task_type, batch_size=25):
    out = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        body = {
            "requests": [
                {
                    "model": f"models/{EMBED_MODEL}",
                    "content": {"parts": [{"text": t}]},
                    "taskType": task_type,
                    "outputDimensionality": DIM,
                }
                for t in batch
            ]
        }
        r = _post_with_retry(body)
        out += [normalize(e["values"]) for e in r.json()["embeddings"]]
        if len(texts) > 1:
            print(f"  Embedding {min(i + batch_size, len(texts))}/{len(texts)}")
        time.sleep(1)
    return out

def load_cache():
    """Vektor dari build sebelumnya, supaya teks yang tidak berubah tidak dikirim ulang ke Google."""
    path = OUT_DIR / "kb_index.json"
    if not path.exists():
        return {}
    try:
        old = json.loads(path.read_text(encoding="utf-8"))
        if old.get("model") != EMBED_MODEL or old.get("dim") != DIM:
            return {}
        return {it["text"]: it["v"] for it in old["items"]}
    except Exception:
        return {}


def build(answers_csv, questions_csv):
    kb, items = load_kb(answers_csv, questions_csv)
    print(f"Topik: {len(kb)} | Contoh pertanyaan yang di-index: {len(items)}")

    cache = load_cache()
    todo = [it["text"] for it in items if it["text"] not in cache]
    todo = list(dict.fromkeys(todo))
    print(f"Memakai cache: {len(items) - len(todo)} | Perlu di-embed baru: {len(todo)}")

    new_vecs = dict(zip(todo, embed(todo, "RETRIEVAL_DOCUMENT"))) if todo else {}
    vector_of = {**cache, **new_vecs}

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "kb.json").write_text(json.dumps(kb, ensure_ascii=False, indent=2), encoding="utf-8")
    index = {
        "model": EMBED_MODEL,
        "dim": DIM,
        "items": [
            {"key": it["key"], "text": it["text"], "v": [round(x, 5) for x in vector_of[it["text"]]]}
            for it in items
        ],
    }
    (OUT_DIR / "kb_index.json").write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    print(f"Tersimpan di {OUT_DIR}\\kb.json dan kb_index.json")

def ask(question):
    index = json.loads((OUT_DIR / "kb_index.json").read_text(encoding="utf-8"))
    q = embed([question], "RETRIEVAL_QUERY")[0]
    best = {}
    for it in index["items"]:
        score = sum(a * b for a, b in zip(q, it["v"]))
        if score > best.get(it["key"], (-1, ""))[0]:
            best[it["key"]] = (score, it["text"])
    print(f'\nPertanyaan: "{question}"')
    for key, (score, text) in sorted(best.items(), key=lambda x: -x[1][0])[:5]:
        print(f"  {score:.3f}  [{key}]  cocok dengan: {text}")
    print("\nPakai skor ini untuk menentukan RAG_MIN_SCORE (batas bawah 'tahu / tidak tahu').")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--ask", help="uji satu pertanyaan terhadap indeks yang sudah ada")
    p.add_argument("--answers-csv")
    p.add_argument("--questions-csv")
    args = p.parse_args()

    if not API_KEY:
        sys.exit("GEMINI_API_KEY belum diisi di .env.local")
    if args.ask:
        ask(args.ask)
    else:
        build(args.answers_csv, args.questions_csv)