import os
from pathlib import Path

from dotenv import load_dotenv

# repo root = backend/src/bmkg/config.py -> naik 3 level
load_dotenv(Path(__file__).resolve().parents[3] / ".env.local")

# ---- API BMKG ----
URL_CUACA = "https://api.bmkg.go.id/publik/prakiraan-cuaca"
URL_GEMPA_BESAR = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json"
URL_GEMPA_RASA = "https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json"
URL_PERINGATAN = "https://www.bmkg.go.id/alerts/nowcast/id"

# ---- Model AI ----
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
AI_MAX_TOKENS = 2000
AI_TEMPERATURE = 0.3

# ---- Supabase ----
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]