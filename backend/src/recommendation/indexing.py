import hashlib
from supabase import Client, create_client
from .config import SUPABASE_KEY, SUPABASE_TABLE, SUPABASE_URL
from .embedding import embed_texts

_supabase_client: Client | None = None
BATCH_SIZE = 50


def get_supabase() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise RuntimeError(
                "Konfigurasi Supabase belum lengkap: pastikan URL "
                "(SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL) dan Key "
                "(SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY) sudah diatur."
            )
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client


def index_chunks(chunks: list[dict], batch_size: int = BATCH_SIZE) -> int:
    if not chunks:
        return 0

    supabase = get_supabase()
    unik: dict[str, dict] = {}

    for item in chunks:
        text = (item.get("text") or "").strip()
        if not text:
            continue

        meta = dict(item.get("meta") or {"source": item.get("source", "dokumen")})
        source = (
            meta.get("source")
            or meta.get("filename")
            or item.get("source")
            or "dokumen"
        )
        meta.setdefault("source", source)

        digest = hashlib.md5(f"{source}{text}".encode("utf-8")).hexdigest()
        unik[digest] = {
            "text": text,
            "embed_text": (item.get("embed_text") or text).strip(),
            "meta": meta,
        }

    if not unik:
        return 0

    ids = list(unik.keys())
    items = list(unik.values())
    vectors = embed_texts([x["embed_text"] for x in items], prefix="passage: ")

    rows = [
        {
            "chunk_id": chunk_id,
            "content": item["text"],
            "metadata": item["meta"],
            "embedding": vector,
        }
        for chunk_id, item, vector in zip(ids, items, vectors)
    ]

    for start in range(0, len(rows), batch_size):
        batch = rows[start : start + batch_size]
        supabase.table(SUPABASE_TABLE).upsert(batch, on_conflict="chunk_id").execute()

    return len(rows)