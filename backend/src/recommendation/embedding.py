from sentence_transformers import SentenceTransformer
from .config import EMBEDDING_MODEL

_model = None


def get_embedding_model():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_texts(texts, prefix: str = ""):
    model = get_embedding_model()
    formatted = [f"{prefix}{t}" if prefix else t for t in texts]
    vectors = model.encode(formatted, normalize_embeddings=True)
    return vectors.tolist()


def embed_query(text: str, prefix: str = "query: "):
    return embed_texts([text], prefix=prefix)[0]