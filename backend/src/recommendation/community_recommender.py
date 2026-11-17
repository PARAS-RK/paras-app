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