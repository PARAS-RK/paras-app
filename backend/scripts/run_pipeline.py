import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from recommendation.chunking import buat_chunks, chunk_text
from recommendation.config import (
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    DOCUMENTS_PATH,
    EMERGENCY_DATA_PATH,
)
from recommendation.embedding import embed_texts
from recommendation.extraction import load_cleaned_emergency_data, load_documents
from recommendation.indexing import index_chunks


def main():
    parser = argparse.ArgumentParser(description="Ingestion pipeline for RAG & Aksi Komunitas")
    parser.add_argument(
        "--stage",
        choices=["all", "ingestion", "chunking", "embedding", "indexing"],
        default="all",
    )
    args = parser.parse_args()

    raw_pages = load_documents(DOCUMENTS_PATH)
    df_emergency = load_cleaned_emergency_data(EMERGENCY_DATA_PATH)
    if not df_emergency.empty:
        print(f"Dataset darurat dibersihkan: {len(df_emergency)} baris")

    if not raw_pages:
        print(f"Tidak ada PDF dengan teks yang bisa dibaca di: {DOCUMENTS_PATH}")
        return

    if args.stage == "ingestion":
        print(f"Halaman PDF diekstrak: {len(raw_pages)}")
        return

    chunks = buat_chunks(raw_pages)
    if not chunks:
        chunks = [
            {"text": c, "source": p["filename"], "meta": {"source": p["filename"], "halaman": p["page"]}}
            for p in raw_pages
            for c in chunk_text(p["text"], CHUNK_SIZE, CHUNK_OVERLAP)
        ]

    if args.stage == "chunking":
        print(f"Total chunk dibuat: {len(chunks)}")
        return

    if args.stage == "embedding":
        vectors = embed_texts([c.get("embed_text", c["text"]) for c in chunks], prefix="passage: ")
        print(f"Embedding selesai: {len(vectors)} vektor")
        return

    total = index_chunks(chunks)
    print(f"Halaman: {len(raw_pages)} | Chunk diindeks ke ChromaDB: {total}")


if __name__ == "__main__":
    main()