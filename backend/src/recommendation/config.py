import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[2]
PROJECT_DIR = BACKEND_DIR.parent

# Muat .env dari beberapa lokasi umum agar aman saat dijalankan lokal maupun di server
for env_path in [
    PROJECT_DIR / ".env.local",
    PROJECT_DIR / ".env",
    BACKEND_DIR / ".env.local",
    BACKEND_DIR / ".env",
]:
    if env_path.exists():
        load_dotenv(env_path, override=False)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)

SUPABASE_URL = (
    os.getenv("SUPABASE_URL")
    or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    or ""
).strip()

SUPABASE_KEY = (
    os.getenv("SUPABASE_KEY")
    or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_SECRET_KEY")
    or ""
).strip()

SUPABASE_TABLE = os.getenv("SUPABASE_TABLE", "documents").strip()
SUPABASE_MATCH_FUNCTION = os.getenv("SUPABASE_MATCH_FUNCTION", "match_documents").strip()

DOCUMENTS_PATH = str(
    (BACKEND_DIR / os.getenv("DOCUMENTS_PATH", "documents/incoming")).resolve()
)
EMERGENCY_DATA_PATH = str(
    (
        BACKEND_DIR
        / os.getenv(
            "EMERGENCY_DATA_PATH",
            "data/data-mikro-status-keadaan-darurat-bencana-2025.xlsx",
        )
    ).resolve()
)

CHUNK_SIZE = 1000
CHUNK_OVERLAP = 180
MAX_CHUNK_CHARS = 900
MIN_CHUNK_CHARS = 80