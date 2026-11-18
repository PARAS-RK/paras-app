import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def fetch_community_reports_from_supabase():
    """
    Mengambil data laporan warga dari tabel 'reports' di Supabase
    untuk diolah atau dijadikan konteks tambahan oleh AI.
    """
    try:
        # Mengambil data dari tabel 'reports' sesuai skema database PARAS
        response = supabase.table("reports").select("report_id, report_description, report_category, report_status, region_id").execute()
        return response.data
    except Exception as e:
        print(f"Gagal mengambil data dari Supabase: {e}")
        return []