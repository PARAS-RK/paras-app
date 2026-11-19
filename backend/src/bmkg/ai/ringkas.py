import hashlib
import json

from google import genai
from google.genai import types

from ..config import AI_MAX_TOKENS, AI_TEMPERATURE, GEMINI_API_KEY, MODEL
from ..waktu import blok_waktu
from .prompt import ATURAN_LENGKAP

_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None


def sidik(data):
    """Cap data + blok waktu. Berubah kalau data berubah atau lewat blok jam."""
    isi = json.dumps({"d": data, "b": blok_waktu()}, sort_keys=True, default=str, ensure_ascii=False)
    return hashlib.md5(isi.encode()).hexdigest()


def ringkas_ai(topik, data):
    if not _client:
        return None
    try:
        resp = _client.models.generate_content(
            model=MODEL,
            contents=f"Topik: {topik}\nData BMKG:\n" + json.dumps(data, ensure_ascii=False, indent=1, default=str),
            config=types.GenerateContentConfig(
                system_instruction=ATURAN_LENGKAP,
                max_output_tokens=AI_MAX_TOKENS,
                temperature=AI_TEMPERATURE,
            ),
        )
        kand = resp.candidates[0] if resp.candidates else None
        if not resp.text or (kand and "MAX_TOKENS" in str(kand.finish_reason)):
            return None
        return resp.text.strip()
    except Exception as e:
        print(f"  (AI gagal: {e})")
        return None


def ringkas(lama, nama_topik, data_ai, cadangan):
    """Return (teks, sumber, hash). Pakai yang tersimpan kalau data sama; kalau AI gagal pakai if-else."""
    h = sidik(data_ai)
    if lama and lama.get("summary_source") == "ai" and lama.get("summary_hash") == h and lama.get("summary_text"):
        return lama["summary_text"], "ai", h
    teks = ringkas_ai(nama_topik, data_ai)
    return (teks, "ai", h) if teks else (cadangan, "rule", None)