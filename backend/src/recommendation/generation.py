from google import genai
from .config import GEMINI_API_KEY, GEMINI_MODEL


def generate_answer(question: str, contexts: list[dict]) -> str:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY belum diatur di backend/.env")

    client = genai.Client(api_key=GEMINI_API_KEY)
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
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )
    return response.text or "Maaf, jawaban belum dapat dibuat. Silakan coba lagi."