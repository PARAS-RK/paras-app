import { buatHandlerBmkg } from '@/lib/server/bmkgRoute';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bmkg/gempaBesar
 * Gempa M5.0+ di Indonesia (7 hari terakhir) + ringkasan.
 * 200 { data: Row | null } | 401 { error } | 500 { error }
 */
export const GET = buatHandlerBmkg('gempa_besar');