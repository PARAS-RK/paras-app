<<<<<<< HEAD
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
=======
from .database import fetch_community_reports_from_supabase
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def get_dynamic_recommendations(user_report: str, top_k=2):
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    
    # 1. Tarik data riwayat/kegiatan dari Supabase
    supabase_data = fetch_community_reports_from_supabase()
    
    # Jika database kosong, gunakan data default/fallback
    if not supabase_data:
        base_activities = [
            {"activity": "Penanggulangan Sampah", "problem": "Tumpukan sampah liar", "steps": ["Pembersihan rutin"]}
        ]
    else:
        # Format data dari Supabase agar bisa dibaca model AI
        base_activities = []
        for row in supabase_data:
            base_activities.append({
                "activity": row.get("laporan_warga", "Aksi Komunitas"),
                "problem": row.get("laporan_warga"),
                "steps": row.get("rekomendasi_kegiatan", [])
            })

    # 2. Lakukan perhitungan kemiripan semantik (AI Recommendation)
    texts = [item["activity"] + ". " + item["problem"] for item in base_activities]
    embeddings = model.encode(texts, normalize_embeddings=True)
    
    query_embedding = model.encode([user_report], normalize_embeddings=True)
    scores = cosine_similarity(query_embedding, embeddings)[0]
    
    ranked_indices = np.argsort(scores)[::-1][:top_k]
    
    results = []
    for idx in ranked_indices:
        item = base_activities[idx]
        results.append({
            "Kegiatan": item["activity"],
            "Skor": round(float(scores[idx]), 3),
            "Detail": item["steps"]
        })
        
    return results
>>>>>>> 8699b996622f93c1792104e66a1334d1b8416ec3
