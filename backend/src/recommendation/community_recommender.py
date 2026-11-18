from .database import fetch_community_reports_from_supabase
from .knowledge_base import ACTIVITIES
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def get_dynamic_recommendations(user_report: str, top_k=2):
    model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    
    # 1. Tarik data dari Supabase
    supabase_data = fetch_community_reports_from_supabase()
    
    # Mulai dengan data statis dari knowledge_base agar referensi lengkap
    base_activities = list(ACTIVITIES)
    
    # Jika ada data dari Supabase, tambahkan ke dalam daftar referensi
    if supabase_data:
        for row in supabase_data:
            # Disesuaikan dengan kolom tabel reports: report_description & report_category
            laporan = row.get("report_description") or "Laporan Warga"
            kategori = row.get("report_category") or "Umum"
            
            base_activities.append({
                "activity": f"Penanganan Masalah: {kategori}",
                "problem": laporan,
                "steps": [
                    f"Verifikasi laporan terkait kategori {kategori}.",
                    "Lakukan peninjauan lapangan dan koordinasi penanganan darurat.",
                    "Perbarui status laporan di sistem setelah penanganan selesai."
                ]
            })

    # 2. Amankan proses penggabungan teks dari nilai None
    texts = []
    for item in base_activities:
        act = item.get("activity") or ""
        prob = item.get("problem") or ""
        texts.append(act + ". " + prob)
        
    embeddings = model.encode(texts, normalize_embeddings=True)
    
    query_embedding = model.encode([user_report], normalize_embeddings=True)
    scores = cosine_similarity(query_embedding, embeddings)[0]
    
    ranked_indices = np.argsort(scores)[::-1][:top_k]
    
    results = []
    for idx in ranked_indices:
        item = base_activities[idx]
        results.append({
            "kegiatan": item.get("activity", "Aksi Warga"),
            "skor": round(float(scores[idx]), 3),
            "langkah": item.get("steps", [])
        })
        
    return results


def format_recommendations(results):
    blocks = []
    for n, r in enumerate(results, 1):
        langkah_list = r.get("langkah", [])
        if isinstance(langkah_list, list):
            langkah = "\n".join(f"{i}. {s}" for i, s in enumerate(langkah_list, 1))
        else:
            langkah = str(langkah_list)
            
        blocks.append(
            f"REKOMENDASI {n}\n"
            f"Kegiatan: {r.get('kegiatan', '-')}\n"
            f"Skor kemiripan: {r.get('skor', 0)}\n\n"
            f"Langkah tindak lanjut:\n{langkah}"
        )
    return "\n\n".join(blocks)