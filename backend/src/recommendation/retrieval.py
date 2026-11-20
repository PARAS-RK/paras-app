from .config import SUPABASE_MATCH_FUNCTION
from .embedding import embed_query
from .indexing import get_supabase


def retrieve_context(
    question: str, top_k: int = 4, match_threshold: float = 0.3
) -> list[dict]:
    supabase = get_supabase()
    query_vector = embed_query(question, prefix="query: ")

    response = supabase.rpc(
        SUPABASE_MATCH_FUNCTION,
        {
            "query_embedding": query_vector,
            "match_threshold": match_threshold,
            "match_count": top_k,
        },
    ).execute()

    rows = response.data or []
    if not rows:
        return []

    results = []
    for row in rows:
        meta = row.get("metadata") or {}
        similarity = row.get("similarity")
        results.append(
            {
                "text": row.get("content", ""),
                "source": meta.get("source", "dokumen"),
                "title": meta.get("title", "Buku Panduan Bencana"),
                "page": meta.get("halaman", meta.get("page", "-")),
                "fase": meta.get("fase", "umum"),
                "heading": meta.get("heading", "Umum"),
                "relevance_score": (
                    round(float(similarity), 3) if similarity is not None else 0.0
                ),
            }
        )

    return results