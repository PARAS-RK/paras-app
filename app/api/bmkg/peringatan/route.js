import { buatHandlerBmkg } from '@/lib/server/bmkgRoute';

/**
 * GET /api/bmkg/peringatan
 * Peringatan dini cuaca + ringkasan untuk wilayah user.
 * 200 { data: Row | null } | 401 { error } | 500 { error }
 */
export const GET = buatHandlerBmkg('peringatan');