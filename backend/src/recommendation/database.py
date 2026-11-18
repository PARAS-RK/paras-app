import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_community_reports_from_supabase():
    """
    Mengambil data laporan atau riwayat aksi dari Supabase
    untuk diolah atau dijadikan konteks tambahan oleh AI.
    """
    try:
<<<<<<< HEAD
        response = supabase.table("reports").select("*").execute()
=======
        response = supabase.table("community_actions").select("*").execute()
>>>>>>> 8699b996622f93c1792104e66a1334d1b8416ec3
        return response.data
    except Exception as e:
        print(f"Gagal mengambil data dari Supabase: {e}")
        return []