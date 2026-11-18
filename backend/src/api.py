import os
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from recommendation.community_recommender import get_dynamic_recommendations, format_recommendations
from recommendation.generation import generate_answer
from recommendation.retrieval import retrieve_context


app = FastAPI(title="PARAS RAG & Aksi Komunitas API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class CommunityRecommendationRequest(BaseModel):
    report: str
    region_id: str | None = None
    top_k: int = 2


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
        raise HTTPException(status_code=500, detail=str(exc))


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

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))