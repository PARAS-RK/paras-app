import { buatHandlerBmkg } from '@/lib/server/bmkgRoute';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bmkg/gempaRasa
 * Gempa yang dirasakan di wilayah user (24 jam terakhir) + ringkasan.
 * 200 { data: Row | null } | 401 { error } | 500 { error }
 */
export const GET = buatHandlerBmkg('gempa_rasa');