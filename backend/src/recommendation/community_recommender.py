from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from .knowledge_base import ACTIVITIES

# Model multibahasa: lebih akurat untuk teks Indonesia daripada all-MiniLM-L6-v2
MODEL = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

# Hitung embedding sekali saat server start, bukan tiap request
_TEXTS = [a["activity"] + ". " + a["problem"] for a in ACTIVITIES]
_EMB = MODEL.encode(_TEXTS, normalize_embeddings=True)


def get_dynamic_recommendations(user_report: str, top_k: int = 2):
    q = MODEL.encode([user_report], normalize_embeddings=True)
    scores = cosine_similarity(q, _EMB)[0]

    results = []
    for idx in np.argsort(scores)[::-1][:top_k]:
        a = ACTIVITIES[idx]
        results.append({
            "kegiatan": a["activity"],
            "skor": round(float(scores[idx]), 3),
            "pihak_terkait": a["responsible"],
            "langkah": a["steps"],
            "indikator": a["indicator"],
        })
    return results


def format_recommendations(results):
    blocks = []
    for n, r in enumerate(results, 1):
        langkah = "\n".join(f"{i}. {s}" for i, s in enumerate(r["langkah"], 1))
        blocks.append(
            f"REKOMENDASI {n}\n"
            f"Kegiatan: {r['kegiatan']}\n"
            f"Skor kemiripan: {r['skor']}\n"
            f"Pihak terkait: {r['pihak_terkait']}\n\n"
            f"Langkah tindak lanjut:\n{langkah}\n"
            f"Indikator: {r['indikator']}"
        )
    return "\n\n".join(blocks)