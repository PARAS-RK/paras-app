import os

for env_key in (
    "OPENBLAS_NUM_THREADS",
    "MKL_NUM_THREADS",
    "OMP_NUM_THREADS",
    "VECLIB_MAXIMUM_THREADS",
):
    os.environ.setdefault(env_key, "1")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from recommendation.community_recommender import (
        format_recommendations,
        get_dynamic_recommendations,
    )
    from recommendation.generation import generate_answer
    from recommendation.retrieval import retrieve_context
except ModuleNotFoundError:
    from src.recommendation.community_recommender import (
        format_recommendations,
        get_dynamic_recommendations,
    )
    from src.recommendation.generation import generate_answer
    from src.recommendation.retrieval import retrieve_context

DEFAULT_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]


def get_allowed_origins() -> list[str]:
    raw_origins = os.getenv("ALLOWED_ORIGINS", "")
    origins = [
        origin.strip().rstrip("/")
        for origin in raw_origins.split(",")
        if origin.strip()
    ]
    return origins or DEFAULT_ORIGINS


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
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gagal memproses chat: {exc}") from exc


@app.post("/recommendations/community")
def recommendations_community(payload: CommunityRecommendationRequest):
    report = payload.report.strip()
    if not report:
        raise HTTPException(status_code=400, detail="Laporan tidak boleh kosong")

    try:
        results = get_dynamic_recommendations(
            user_report=report,
            top_k=max(1, min(payload.top_k, 5)),
        )
        return {"results": results, "text": format_recommendations(results)}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gagal membuat rekomendasi: {exc}") from exc