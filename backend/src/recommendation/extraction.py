from datetime import datetime
from pathlib import Path
import fitz
import pandas as pd
from pypdf import PdfReader


def extract_pdf_pages(path: Path) -> list[dict]:
    pages_data = []
    title = path.stem.replace("-", " ").title()
    ingested_at = datetime.now().isoformat()

    try:
        doc = fitz.open(str(path))
        for page_num in range(len(doc)):
            text = doc.load_page(page_num).get_text() or ""
            if text.strip():
                pages_data.append(
                    {
                        "text": text,
                        "page": page_num + 1,
                        "filename": path.name,
                        "title": title,
                        "publisher": "BNPB",
                        "source_url": "https://bnpb.go.id",
                        "document_date": "2020",
                        "verified_by": "Tim BNPB",
                        "ingested_at": ingested_at,
                    }
                )
        doc.close()
        return pages_data
    except Exception:
        reader = PdfReader(str(path))
        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                pages_data.append(
                    {
                        "text": text,
                        "page": idx + 1,
                        "filename": path.name,
                        "title": title,
                        "publisher": "BNPB",
                        "source_url": "https://bnpb.go.id",
                        "document_date": "2020",
                        "verified_by": "Tim BNPB",
                        "ingested_at": ingested_at,
                    }
                )
        return pages_data


def load_documents(directory: str) -> list[dict]:
    root = Path(directory)
    if not root.exists():
        return []
    raw_pages = []
    for path in sorted(root.rglob("*.pdf")):
        raw_pages.extend(extract_pdf_pages(path))
    return raw_pages


def load_cleaned_emergency_data(excel_path: str) -> pd.DataFrame:
    path = Path(excel_path)
    if not path.exists():
        return pd.DataFrame(columns=["bencana"])

    df = pd.read_excel(path)
    text_columns = [
        "kabupaten",
        "jenis_bencana",
        "klasifikasi_bencana",
        "status_keadaan_darurat",
        "keterangan_status",
        "skala_bencana",
    ]
    for col in text_columns:
        if col not in df.columns:
            df[col] = ""
        df[col] = df[col].fillna("").astype(str)

    df["bencana"] = (
        df["kabupaten"]
        + ". "
        + df["jenis_bencana"]
        + ". "
        + df["klasifikasi_bencana"]
        + ". "
        + df["status_keadaan_darurat"]
        + ". "
        + df["keterangan_status"]
        + ". "
        + df["skala_bencana"]
    ).str.strip()

    df = df[df["jenis_bencana"].str.replace(".", "", regex=False).str.strip().ne("")]
    return df.reset_index(drop=True)