-- Menghapus penilaian AI (skor urgensi & kategori prediksi) dan semua ambang poin.
-- Aturan Tabungan Aksi sekarang hanya: 3 pelapor unik.
-- report_cluster_support adalah VIEW dengan security_invoker=true, bukan tabel.
-- Karena itu view harus di-drop dan dibuat ulang tanpa kolom threshold.

BEGIN;

DROP VIEW IF EXISTS public.report_cluster_support;

DROP TABLE IF EXISTS public.report_ai_assessments;

ALTER TABLE public.report_clusters
    DROP COLUMN IF EXISTS is_threshold_reached;

ALTER TABLE public.report_categories
    DROP COLUMN IF EXISTS action_threshold;

CREATE VIEW public.report_cluster_support
WITH (security_invoker = true) AS
SELECT c.cluster_id,
       c.pkk_unit_id,
       c.cluster_category,
       count(DISTINCT s.user_id) AS supporter_count
FROM public.report_clusters c
JOIN public.report_categories rc
  ON rc.category_code::text = c.cluster_category::text
LEFT JOIN LATERAL (
    SELECT r.user_id
    FROM public.reports r
    WHERE r.cluster_id = c.cluster_id
      AND r.user_id IS NOT NULL
      AND r.report_status::text <> 'rejected'::text
    UNION
    SELECT v.user_id
    FROM public.report_votes v
    JOIN public.reports r2 ON r2.report_id = v.report_id
    WHERE r2.cluster_id = c.cluster_id
      AND r2.report_status::text <> 'rejected'::text
) s ON true
GROUP BY c.cluster_id, c.pkk_unit_id, c.cluster_category;

GRANT ALL ON public.report_cluster_support
    TO postgres, anon, authenticated, service_role;

COMMIT;
