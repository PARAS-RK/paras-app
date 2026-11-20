import argparse
import inspect
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


def load_knowledge_base_records() -> list[dict]:
    """Memuat daftar item knowledge base dari recommendation.knowledge_base jika tersedia."""
    try:
        from recommendation import knowledge_base as kb_module
    except ImportError:
        return []

    raw_items = None
    for attr in ("KNOWLEDGE_BASE", "knowledge_base", "COMMUNITY_KB", "ACTIONS_KB", "ITEMS", "DATA"):
        candidate = getattr(kb_module, attr, None)
        if isinstance(candidate, list) and candidate:
            raw_items = candidate
            break

    if not raw_items:
        return []

    records: list[dict] = []
    for idx, item in enumerate(raw_items):
        if not isinstance(item, dict):
            continue

        title = str(
            item.get("title")
            or item.get("judul")
            or item.get("kegiatan")
            or item.get("name")
            or item.get("topic")
            or item.get("category")
            or item.get("kategori")
            or f"Aksi Komunitas #{idx + 1}"
        ).strip()

        steps = (
            item.get("steps")
            or item.get("langkah")
            or item.get("tahapan")
            or item.get("actions")
            or []
        )
        if isinstance(steps, list):
            steps_text = "\n".join(f"- {str(s).strip()}" for s in steps if str(s).strip())
        else:
            steps_text = str(steps or "").strip()

        responsible = str(
            item.get("responsible")
            or item.get("penanggung_jawab")
            or item.get("sasaran")
            or ""
        ).strip()
        indicator = str(
            item.get("indicator")
            or item.get("indikator")
            or ""
        ).strip()
        description = str(
            item.get("description")
            or item.get("deskripsi")
            or item.get("ringkasan")
            or ""
        ).strip()

        parts = [f"Kegiatan: {title}"]
        if description:
            parts.append(f"Deskripsi: {description}")
        if steps_text:
            parts.append(f"Langkah-langkah:\n{steps_text}")
        if responsible:
            parts.append(f"Penanggung jawab: {responsible}")
        if indicator:
            parts.append(f"Indikator keberhasilan: {indicator}")

        combined_text = "\n".join(parts).strip()
        if combined_text:
            records.append(
                {
                    "text": combined_text,
                    "source": "knowledge_base.py",
                    "meta": {
                        "source": "knowledge_base.py",
                        "index": idx,
                        "title": title,
                        "responsible": responsible,
                        "indicator": indicator,
                    },
                }
            )

    return records


def build_chunks(raw_items: list[dict], source_type: str) -> list[dict]:
    if source_type == "knowledge_base":
        kb_chunks: list[dict] = []
        for item in raw_items:
            text = (item.get("text") or "").strip()
            if not text:
                continue
            base_meta = {**(item.get("meta") or {})}
            if len(text) <= CHUNK_SIZE:
                kb_chunks.append({
                    **item,
                    "text": text,
                    "meta": base_meta,
                })
            else:
                for chunk_idx, c in enumerate(chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)):
                    cleaned = (c or "").strip()
                    if cleaned:
                        kb_chunks.append(
                            {
                                "text": cleaned,
                                "source": item.get("source", "knowledge_base.py"),
                                "meta": {**base_meta, "chunk_index": chunk_idx},
                            }
                        )
        return kb_chunks

    chunks = buat_chunks(raw_items)
    if chunks:
        return [c for c in chunks if (c.get("text") or "").strip()]

    fallback_chunks: list[dict] = []
    for page in raw_items:
        text = (page.get("text") or "").strip()
        if not text:
            continue
        for chunk_idx, c in enumerate(chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)):
            cleaned = (c or "").strip()
            if cleaned:
                fallback_chunks.append(
                    {
                        "text": cleaned,
                        "source": page.get("filename", "unknown"),
                        "meta": {
                            "source": page.get("filename", "unknown"),
                            "halaman": page.get("page"),
                            "chunk_index": chunk_idx,
                        },
                    }
                )
    return fallback_chunks


def run_index_chunks(chunks: list[dict], vectors: list[list[float]]) -> int:
    enriched_chunks = [
        {**chunk, "embedding": vectors[idx]}
        for idx, chunk in enumerate(chunks)
    ]

    sig = inspect.signature(index_chunks)
    params = list(sig.parameters.values())
    has_var_kw = any(p.kind == inspect.Parameter.VAR_KEYWORD for p in params)

    if len(params) >= 2:
        return index_chunks(enriched_chunks, vectors)
    if has_var_kw or "vectors" in sig.parameters:
        return index_chunks(enriched_chunks, vectors=vectors)
    return index_chunks(enriched_chunks)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Ingestion pipeline for RAG & Aksi Komunitas (knowledge_base.py & PDF -> pgvector)"
    )
    parser.add_argument(
        "--stage",
        choices=["all", "ingestion", "chunking", "embedding", "indexing"],
        default="all",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Jalankan ekstraksi, chunking, dan embedding tanpa menulis ke Supabase pgvector.",
    )
    args = parser.parse_args()

    try:
        df_emergency = load_cleaned_emergency_data(EMERGENCY_DATA_PATH)
        if df_emergency is not None and not df_emergency.empty:
            print(f"[INFO] Dataset darurat dibersihkan: {len(df_emergency)} baris")
    except Exception as exc:
        print(f"[WARN] Gagal memuat dataset darurat: {exc}")

    kb_records = load_knowledge_base_records()
    if kb_records:
        source_type = "knowledge_base"
        source_items = kb_records
        print(f"[INFO] Memuat {len(kb_records)} entri dari recommendation/knowledge_base.py")
    else:
        source_type = "documents"
        print(f"[INFO] knowledge_base.py kosong/tidak ditemukan, memuat dokumen dari: {DOCUMENTS_PATH}")
        try:
            source_items = load_documents(DOCUMENTS_PATH) or []
        except Exception as exc:
            print(f"[ERROR] Gagal memuat dokumen: {exc}")
            return 1
        if not source_items:
            print(f"[WARN] Tidak ada data knowledge base maupun PDF terbaca di: {DOCUMENTS_PATH}")
            return 1
        print(f"[INFO] Halaman PDF diekstrak: {len(source_items)}")

    if args.stage == "ingestion":
        return 0

    try:
        chunks = [c for c in build_chunks(source_items, source_type) if (c.get("text") or "").strip()]
    except Exception as exc:
        print(f"[ERROR] Gagal membuat chunks: {exc}")
        return 1

    if not chunks:
        print("[WARN] Tidak ada chunk valid yang dihasilkan.")
        return 1

    print(f"[INFO] Total chunk siap diproses: {len(chunks)}")
    if args.stage == "chunking":
        return 0

    texts_to_embed = [
        (c.get("embed_text") or c.get("text") or "").strip() for c in chunks
    ]
    if any(not t for t in texts_to_embed):
        print("[WARN] Terdapat chunk dengan teks kosong setelah normalisasi.")
        return 1

    try:
        vectors = embed_texts(texts_to_embed, prefix="passage: ")
    except Exception as exc:
        print(f"[ERROR] Gagal membuat embedding vektor: {exc}")
        return 1

    if not vectors or len(vectors) != len(chunks):
        print(
            f"[ERROR] Jumlah vektor ({len(vectors) if vectors else 0}) tidak sesuai dengan jumlah chunk ({len(chunks)})."
        )
        return 1

    print(f"[INFO] Embedding selesai: {len(vectors)} vektor")
    if args.stage == "embedding":
        return 0

    if args.dry_run:
        print("[INFO] --dry-run aktif: melewati penulisan ke Supabase pgvector.")
        return 0

    try:
        total = run_index_chunks(chunks, vectors)
    except Exception as exc:
        print(f"[ERROR] Gagal mengindeks chunk ke Supabase pgvector: {exc}")
        return 1

    if not total:
        print("[WARN] Indexing selesai tetapi 0 chunk tersimpan ke Supabase pgvector.")
        return 1

    print(
        f"[SUCCESS] Sumber: {len(source_items)} | Chunk: {len(chunks)} | Terindeks ke Supabase pgvector: {total}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())