import json
import re

import requests

from .config import GEMINI_API_KEY, GEMINI_MODEL

GEMINI_ENDPOINT = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)
FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash"]


def _candidate_models() -> list[str]:
    """Model utama sesuai env, disusul cadangan yang sedang tersedia."""
    models = [GEMINI_MODEL, *FALLBACK_MODELS]
    seen = set()
    return [m for m in models if m and not (m in seen or seen.add(m))]


def _generate_text(prompt: str) -> str:
    """Panggil Gemini lewat v1beta, dengan fallback jika model utama sibuk."""
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY belum diatur di .env.local")

    errors = []
    for model in _candidate_models():
        try:
            response = requests.post(
                GEMINI_ENDPOINT.format(model=model),
                headers={"x-goog-api-key": GEMINI_API_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
                timeout=30,
            )
            if response.status_code != 200:
                errors.append(f"{model}: HTTP {response.status_code}")
                continue

            for candidate in response.json().get("candidates", []):
                parts = (candidate.get("content") or {}).get("parts", [])
                for part in parts:
                    text = part.get("text")
                    if text:
                        return text
            errors.append(f"{model}: tidak ada teks hasil")
        except requests.RequestException as exc:
            errors.append(f"{model}: {type(exc).__name__}")

    raise RuntimeError("Gemini gagal: " + " | ".join(errors))


def generate_answer(question: str, contexts: list[dict]) -> str:
    context_text = "\n\n".join(
        f"Sumber: {item.get('title', item.get('source', 'dokumen'))} "
        f"(Halaman {item.get('page', '-')})\n{item['text']}"
        for item in contexts
    )
    if not context_text:
        context_text = "Tidak ada konteks dokumen yang ditemukan."

    prompt = f"""
Kamu adalah asisten informasi kebencanaan dan aksi komunitas yang empatik dan terstruktur.
Jawab dalam bahasa Indonesia berdasarkan konteks dokumen yang diberikan.
Jangan mengarang pasal, nomor telepon, atau informasi yang tidak didukung konteks.
Jika konteks tidak cukup, katakan dengan jelas dan sarankan koordinasi dengan pengurus wilayah/BPBD setempat.

KONTEKS:
{context_text}

PERTANYAAN / LAPORAN:
{question}
"""
    return _generate_text(prompt).strip() or "Maaf, jawaban belum dapat dibuat. Silakan coba lagi."


def _extract_report_category(report: str) -> str:
    match = re.search(r"Kategori:\s*([^\n]+)", report or "", re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return "Lainnya"


def generate_community_draft(report: str, contexts: list[dict]) -> dict:
    """Buat draf aksi komunitas dari konteks RAG memakai Gemini.

    Jika Gemini gagal atau tidak mengembalikan field wajib, gunakan draf
    cadangan berdasarkan kategori klaster agar UI tetap punya langkah dan
    jadwal yang bisa diedit Ketua PKK.
    """
    from .knowledge_base import get_community_draft_fallback

    category = _extract_report_category(report)
    fallback = get_community_draft_fallback(category)

    context_text = "\n\n".join(
        f"Sumber: {item.get('title', item.get('source', 'referensi'))}\n"
        f"{item.get('text', '')}"
        for item in contexts
    ) or "Tidak ada referensi knowledge base yang cocok."

    prompt = f"""
Kamu adalah asisten Ketua PKK PARAS. Susun satu draf rencana aksi komunitas yang siap ditinjau dan diedit Ketua PKK.

Gunakan hanya konteks referensi di bawah ini. Jangan mengarang nomor telepon, pasal, atau data resmi yang tidak ada di konteks. Jika informasi jadwal tidak tersedia, berikan estimasi wajar dan sifatnya sebagai usulan.

KONTEKS REFERENSI:
{context_text}

LAPORAN / KLASTER:
{report}

Balas HANYA dengan objek JSON valid, tanpa markdown dan tanpa penjelasan tambahan. Gunakan kunci persis ini:
{{
  "name": "nama kegiatan singkat dan spesifik",
  "description": "deskripsi singkat maksimal 2 kalimat",
  "steps": ["langkah 1", "langkah 2", "langkah 3"],
  "participantTarget": "angka sebagai teks, misalnya 40",
  "duration": "estimasi durasi, misalnya 2-3 jam",
  "registrationRange": "usulan jadwal pendaftaran",
  "implementationRange": "usulan jadwal pelaksanaan"
}}
"""

    try:
        raw = _generate_text(prompt).strip()
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()

        try:
            data = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Gemini tidak mengembalikan JSON yang valid") from exc

        if not isinstance(data, dict):
            raise RuntimeError("Format draf Gemini tidak sesuai")

        allowed = [
            "name",
            "description",
            "participantTarget",
            "duration",
            "registrationRange",
            "implementationRange",
        ]
        draft = dict(fallback)

        for field in allowed:
            value = data.get(field)
            if value is not None and str(value).strip():
                draft[field] = str(value).strip()

        steps = data.get("steps")
        if isinstance(steps, list):
            cleaned = [str(step).strip() for step in steps if str(step).strip()]
            if cleaned:
                draft["steps"] = "\n".join(cleaned)
        elif steps is not None and str(steps).strip():
            draft["steps"] = str(steps).strip()

        if not draft.get("name") or not draft.get("steps"):
            raise RuntimeError("Draf Gemini tidak lengkap")

        draft["fallback"] = False
        return draft
    except Exception:
        result = dict(fallback)
        result["fallback"] = True
        return result
