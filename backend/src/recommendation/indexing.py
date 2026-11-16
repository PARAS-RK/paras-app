import hashlib
import chromadb
from .config import CHROMA_PATH, COLLECTION_NAME
from .embedding import embed_texts


def get_collection():
    client = chromadb.PersistentClient(path=CHROMA_PATH)
    return client.get_or_create_collection(
        name=COLLECTION_NAME, metadata={"hnsw:space": "cosine"}
    )


def index_chunks(chunks: list[dict]) -> int:
    if not chunks:
        return 0

    collection = get_collection()
    unik = {}
    for item in chunks:
        meta = item.get("meta") or {"source": item.get("source", "dokumen")}
        source = meta.get("source") or meta.get("filename") or item.get("source", "dokumen")
        meta.setdefault("source", source)
        digest = hashlib.md5((source + item["text"]).encode("utf-8")).hexdigest()
        unik[digest] = {
            "text": item["text"],
            "embed_text": item.get("embed_text") or item["text"],
            "meta": meta,
        }

    ids = list(unik.keys())
    items = list(unik.values())
    vectors = embed_texts([x["embed_text"] for x in items], prefix="passage: ")

    collection.upsert(
        ids=ids,
        documents=[x["text"] for x in items],
        metadatas=[x["meta"] for x in items],
        embeddings=vectors,
    )
    return len(ids)