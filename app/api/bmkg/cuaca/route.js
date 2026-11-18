import { buatHandlerBmkg } from '@/lib/server/bmkgRoute';

/**
 * GET /api/bmkg/cuaca
 * Prakiraan cuaca + ringkasan untuk kelurahan user yang login.
 * 200 { data: Row | null } | 401 { error } | 500 { error }
 */
export const GET = buatHandlerBmkg('cuaca');