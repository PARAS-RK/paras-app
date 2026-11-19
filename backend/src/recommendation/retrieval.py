from .embedding import embed_query
from .indexing import get_collection


def retrieve_context(question: str, top_k: int = 4) -> list[dict]:
    collection = get_collection()
    if collection.count() == 0:
        return []

    result = collection.query(
        query_embeddings=[embed_query(question, prefix="query: ")],
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"],
    )
    docs = result.get("documents", [[]])[0]
    metas = result.get("metadatas", [[]])[0]
    dists = result.get("distances", [[]])[0]

    return [
        {
            "text": text,
            "source": meta.get("source", "dokumen"),
            "title": meta.get("title", "Buku Panduan Bencana"),
            "page": meta.get("halaman", meta.get("page", "-")),
            "fase": meta.get("fase", "umum"),
            "heading": meta.get("heading", "Umum"),
            "relevance_score": round(1 - float(dist), 3),
        }
        for text, meta, dist in zip(docs, metas, dists)
    ]