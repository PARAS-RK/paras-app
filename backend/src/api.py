import os
import re
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("VECLIB_MAXIMUM_THREADS", "1")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from recommendation.community_recommender import (
        format_recommendations,
        get_dynamic_recommendations,
    )
    from recommendation.generation import generate_answer, generate_community_draft
    from recommendation.knowledge_base import get_community_draft_fallback
    from recommendation.retrieval import retrieve_context
except ModuleNotFoundError:
    from src.recommendation.community_recommender import (
        format_recommendations,
        get_dynamic_recommendations,
    )
    from src.recommendation.generation import generate_answer, generate_community_draft
    from src.recommendation.knowledge_base import get_community_draft_fallback
    from src.recommendation.retrieval import retrieve_context


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["http://localhost:3000", "http://127.0.0.1:3000"]


app = FastAPI(title="PARAS RAG & Aksi Komunitas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class CommunityRecommendationRequest(BaseModel):
    report: str
    region_id: str | None = None
    top_k: int = 2


@app.get("/")
def root():
    return {"service": "PARAS RAG & Aksi Komunitas API", "status": "running"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
def chat(payload: ChatRequest):
    question = payload.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Pertanyaan tidak boleh kosong")
    try:
        contexts = retrieve_context(question)
        answer = generate_answer(question, contexts)
        sources = [
            {
                "title": item.get("title", item.get("source", "dokumen")),
                "page": item.get("page") if isinstance(item.get("page"), int) else None,
            }
            for item in contexts
        ]
        return {"answer": answer, "sources": sources}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gagal memproses chat: {exc}")


@app.post("/recommendations/community")
def recommendations_community(payload: CommunityRecommendationRequest):
    report = payload.report.strip()
    if not report:
        raise HTTPException(status_code=400, detail="Laporan tidak boleh kosong")
    try:
        try:
            results = get_dynamic_recommendations(
                user_report=report,
                top_k=max(1, min(payload.top_k, 5)),
            )
        except Exception:
            results = []

        contexts = []
        for item in results:
            parts = []
            if item.get("problem"):
                parts.append(f"Masalah: {item['problem']}")
            langkah = item.get("langkah") or []
            if isinstance(langkah, list) and langkah:
                parts.append("Langkah: " + "; ".join(str(s) for s in langkah))
            elif langkah:
                parts.append(f"Langkah: {langkah}")
            if item.get("responsible"):
                parts.append(f"Penanggung jawab: {item['responsible']}")
            if item.get("indicator"):
                parts.append(f"Indikator: {item['indicator']}")

            contexts.append({
                "title": item.get("kegiatan", "Referensi komunitas"),
                "source": "knowledge_base_paras",
                "text": "\n".join(parts),
            })

        draft = generate_community_draft(report, contexts)

        return {
            "results": results,
            "text": format_recommendations(results) if results else "",
            "draft": draft,
        }
    except Exception as exc:
        match = re.search(r"Kategori:\s*([^\n]+)", report or "", re.IGNORECASE)
        fallback = get_community_draft_fallback(match.group(1).strip() if match else "Lainnya")
        return {
            "results": [],
            "text": "",
            "draft": fallback,
        }