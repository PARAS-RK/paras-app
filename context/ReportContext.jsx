'use client';

import { useState, useContext, createContext, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { INITIAL_REPORTS } from '@/lib/reportStore';

export const ReportContext = createContext(null);

function getTimestamp() {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    }).format(new Date()) + ' WIB';
}
function addTimelineEntry(report, type, label, description = '') {
    return {
        ...report,
        timeline: [
            ...(report.timeline || []),
            {
                id: `${Date.now()}-${type}`,
                type,
                label,
                description,
                timestamp: getTimestamp(),
            },
        ],
    };
}

// Fungsi untuk memetakan data laporan dari database ke format yang digunakan di frontend.
function mapDatabaseReport(row, profile, region, category) {
    const statusMap = {
        submitted: 'pending',
        in_review: 'pending',
        in_progress: 'in_progress',
        resolved: 'handled',
        rejected: 'rejected',
    };

    return {
        id: row.ticket_code,
        databaseId: row.report_id,
        ticketCode: row.ticket_code,

        title: category?.label || row.report_category,
        details: row.report_description,

        area: region?.subdistrict
            ? `Kel. ${region.subdistrict}`
            : '',
        locationDetail: row.location_detail ?? '',

        date: new Date(row.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        }),

        reporter: row.is_anonymous || profile?.hide_name
            ? 'Anonim'
            : profile?.full_name || 'Warga',

        isAnonymous: row.is_anonymous,
        priority: 'belum ditentukan',
        urgency: 0,

        aiCategory: category?.label || row.report_category,

        // Jalur belum dapat ditentukan dari kolom reports saat ini.
        handledBy: 'unassigned',

        status: statusMap[row.report_status] || 'pending',

        clusterId: row.cluster_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,

        timeline: [],
    };
}

export function ReportProvider({ children, source = 'local', regionId=null}) {
    const [reports, setReports] = useState(
        source === 'admin' ? [] : INITIAL_REPORTS
    );

    async function saveAdminReview(report, decision, route = null, reason = null) {
    // Provider publik tetap menggunakan perilaku lokal.
    if (source !== 'admin') {
        return { success: true };
    }

    if (!report?.databaseId) {
        return {
            success: false,
            message: 'ID laporan dari database tidak ditemukan.',
        };
    }

    try {
        const supabase = createClient();

        const { data: { user }, error: authError } =
            await supabase.auth.getUser();

        if (authError || !user) {
            return {
                success: false,
                message: 'Sesi login Ketua PKK belum tersedia. Bypass admin tidak cukup untuk menyimpan keputusan.',
            };
        }

        const now = new Date().toISOString();

        const { error } = await supabase
            .from('report_admin_reviews')
            .upsert({
                report_id: report.databaseId,
                review_decision: decision,
                handling_route: route,
                review_reason: reason,
                reviewed_by: user.id,
                reviewed_at: now,
                updated_at: now,
            }, {
                onConflict: 'report_id',
            });

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Gagal menyimpan keputusan laporan:', error);

        return {
            success: false,
            message: error.message || 'Gagal menyimpan keputusan ke Supabase.',
        };
    }
}

    useEffect(() => {
        if (source !== 'admin') return;

        let isActive = true;

        async function fetchReports() {
            const supabase = createClient();

            if (!regionId) {
  console.error('Region ID Ketua PKK tidak ditemukan.');
  if (isActive) setReports([]);
  return;
}

const { data: rows, error } = await supabase
  .from('reports')
  .select('*')
  .eq('region_id', regionId)
  .order('created_at', { ascending: false });

            if (error) {
                console.error('Gagal mengambil laporan:', error);
                return;
            }

            if (!rows?.length) {
                if (isActive) setReports([]);
                return;
            }

            const userIds = [...new Set(
                rows.map(row => row.user_id).filter(Boolean)
            )];

            const regionIds = [...new Set(
                rows.map(row => row.region_id)
            )];

            const categoryCodes = [...new Set(
                rows.map(row => row.report_category)
            )];

            const [profilesResult, regionsResult, categoriesResult] =
                await Promise.all([
                    userIds.length
                        ? supabase.from('profiles')
                            .select('user_id, full_name, hide_name')
                            .in('user_id', userIds)
                        : Promise.resolve({ data: [] }),

                    regionIds.length
                        ? supabase.from('regions')
                            .select('region_id, subdistrict, district, city')
                            .in('region_id', regionIds)
                        : Promise.resolve({ data: [] }),

                    categoryCodes.length
                        ? supabase.from('report_categories')
                            .select('category_code, label')
                            .in('category_code', categoryCodes)
                        : Promise.resolve({ data: [] }),
                ]);

            if (!isActive) return;

            const profiles = profilesResult.data || [];
            const regions = regionsResult.data || [];
            const categories = categoriesResult.data || [];

            const mappedReports = rows.map(row =>
                mapDatabaseReport(
                    row,
                    profiles.find(p => p.user_id === row.user_id),
                    regions.find(r => r.region_id === row.region_id),
                    categories.find(c => c.category_code === row.report_category)
                )
            );

            const mediaResponse = await fetch("/api/admin/reports/media", {
  cache: "no-store",
});

let mediaRows = [];

if (mediaResponse.ok) {
  const mediaData = await mediaResponse.json();
  mediaRows = mediaData.media ?? [];
}

const mediaByReport = new Map();

mediaRows.forEach((item) => {
  const key = String(item.report_id);

  if (!mediaByReport.has(key)) {
    mediaByReport.set(key, []);
  }

  mediaByReport.get(key).push({
    url: item.url,
    path: item.path_storage,
    numberFile: item.number_file,
  });
});

const reportsWithMedia = mappedReports.map((report) => ({
  ...report,
  media: mediaByReport.get(String(report.databaseId)) ?? [],
}));

setReports(reportsWithMedia);
        }

        fetchReports();

        return () => {
            isActive = false;
        };
    }, [source, regionId]);

    // Persetujuan untuk memulai proses penanganan laporan.
    function approveReport(id) {
    setReports(prev => prev.map(report => {
        if (report.id !== id || report.status === 'handled') return report;

        return addTimelineEntry({
            ...report,
            status: 'in_progress',
        }, 'handling', 'Penanganan dimulai',
        'Laporan mulai diproses oleh jalur penanganan terkait.');
    }));
}

    const saveEmergencyDraft = (id, message, hotline) => {
    setReports((prev) =>
        prev.map((report) =>
            report.id === id
                ? {
                    ...report,
                    emergencyDraft: message,
                    emergencyHotline: hotline,
                }
                : report
        )
    );
};

    function finalizeReport(id, publicMessage, resolution = {}) {
    setReports(prev => prev.map(report => {
        if (report.id !== id) return report;

        return addTimelineEntry({
            ...report,
            status: 'handled',
            publicMessage,
            completedAt: getTimestamp(),
            ...resolution,
        }, 'completed', 'Penanganan selesai', publicMessage);
    }));
}

    // Penolakan laporan warga pada Dashboard.
async function rejectReport(id, reason) {
    const target = reports.find(report => report.id === id);
    if (!target) return { success: false, message: 'Laporan tidak ditemukan.' };

    const route = target.handledBy === 'bpbd'
        ? 'jalur_a'
        : target.handledBy === 'community'
            ? 'jalur_b'
            : null;

    const result = await saveAdminReview(target, 'rejected', route, reason);
    if (!result.success) return result;

    setReports(prev => prev.map(report => {
        if (report.id !== id) return report;

        return addTimelineEntry({
            ...report,
            status: 'rejected',
            rejectionReason: reason,
            dashboardDecision: 'rejected',
            dashboardReviewedAt: getTimestamp(),
            recommendationDecision: null,
            recommendationRejectionReason: null,
        }, 'decision', 'Laporan ditolak', reason);
    }));

    return { success: true };
}

// Pemeriksaan awal Dashboard: menerima laporan untuk antrean AI.
async function reviewDashboardReport(id) {
    const target = reports.find(report => report.id === id);
    if (!target) return { success: false, message: 'Laporan tidak ditemukan.' };

    const isCommunity = target.handledBy === 'community';
    const route = target.handledBy === 'bpbd'
        ? 'jalur_a'
        : isCommunity ? 'jalur_b' : null;

    const result = await saveAdminReview(target, 'accepted', route);
    if (!result.success) return result;

    setReports(prev => prev.map(report => {
        if (report.id !== id || report.status === 'rejected' || report.dashboardDecision) return report;

        return addTimelineEntry({
            ...report,
            dashboardDecision: 'accepted',
            dashboardRoute: isCommunity ? 'community' : 'emergency',
            dashboardReviewedAt: getTimestamp(),
            ...(isCommunity ? { reviewDecision: 'accepted' } : {}),
        }, 'decision', 'Laporan diterima',
        `Diterima melalui ${isCommunity ? 'Jalur B' : 'Jalur A'}`);
    }));

    return { success: true };
}

// Override rute hanya dilakukan dari Dashboard.
async function rerouteReport(id, route) {
    if (!['emergency', 'community'].includes(route)) {
        return { success: false, message: 'Rute tujuan tidak valid.' };
    }

    const target = reports.find(report => report.id === id);
    if (!target || target.status === 'rejected') {
        return { success: false, message: 'Laporan tidak ditemukan atau sudah ditolak.' };
    }

    const isEmergency = route === 'emergency';
    const wasEmergency = target.handledBy === 'bpbd';

    const result = await saveAdminReview(
        target,
        'overridden',
        isEmergency ? 'jalur_a' : 'jalur_b'
    );
    if (!result.success) return result;

    setReports(prev => prev.map(report => {
        if (report.id !== id || report.status === 'rejected') return report;

        return addTimelineEntry({
            ...report,
            handledBy: isEmergency ? 'bpbd' : 'community',
            overrideFrom: report.handledBy,
            ...(isEmergency
                ? { urgency: Math.max(report.urgency, 10), priority: 'darurat' }
                : wasEmergency ? { urgency: 10 } : {}),
            status: 'pending',
            dashboardDecision: 'overridden',
            dashboardRoute: route,
            dashboardReviewedAt: getTimestamp(),
            reviewDecision: null,
            reviewedAt: null,
            recommendationDecision: null,
            recommendationRejectionReason: null,
        }, 'decision', 'Jalur laporan diubah',
        `Override dari ${wasEmergency ? 'Jalur A' : 'Jalur B'} ke ${isEmergency ? 'Jalur A' : 'Jalur B'}`);
    }));

    return { success: true };
}

    // Penolakan rekomendasi AI, bukan penolakan laporan warga.
    function rejectRecommendation(id, reason) {
        setReports((prev) =>
            prev.map((report) =>
                report.id === id
                    ? {
                        ...report,
                        recommendationDecision: 'rejected',
                        recommendationRejectionReason: reason,
                        recommendationReviewedAt: getTimestamp(),
                    }
                    : report
            )
        );
    }

    // Penerimaan rekomendasi AI.
    function acceptRecommendation(id) {
        setReports((prev) =>
            prev.map((report) =>
                report.id === id
                    ? {
                        ...report,
                        recommendationDecision: 'accepted',
                        recommendationReviewedAt: getTimestamp(),
                    }
                    : report
            )
        );
    }

    // Mencatat aktivitas dari modul penanganan laporan.
function recordTimelineActivity(id, type, label, description = '') {
    setReports(prev => prev.map(report => {
        if (report.id !== id) return report;

        return addTimelineEntry(report, type, label, description);
    }));
}

function startCommunityHandling(id, actionId, actionTitle) {
    setReports((prev) =>
        prev.map((report) => {
            if (report.id !== id) return report;
            if (report.status === 'handled' || report.status === 'rejected') {
                return report;
            }

            if (report.status === 'in_progress') {
                return report;
            }

            return addTimelineEntry(
                {
                    ...report,
                    status: 'in_progress',
                    communityActionId: actionId,
                },
                'handling',
                'Penanganan dimulai',
                `Laporan mulai ditangani melalui aksi "${actionTitle}" (ID: ${actionId}).`
            );
        })
    );
}

    function completeCommunityReports(reportIds, actionId, actionTitle) {
    if (!Array.isArray(reportIds) || reportIds.length === 0) return;

    setReports((prev) =>
        prev.map((report) => {
            if (!reportIds.includes(report.id)) return report;

            if (report.status === 'handled' || report.status === 'rejected') {
                return report;
            }

            return addTimelineEntry(
                {
                    ...report,
                    status: 'handled',
                    completedAt: getTimestamp(),
                    communityActionId: actionId,
                },
                'completed',
                'Penanganan selesai',
                `Aksi komunitas "${actionTitle}" (ID: ${actionId}) telah diselesaikan.`
            );
        })
    );
}

    // Kompatibilitas dengan pemanggilan lama.
    function reviewCommunityReport(id, decision) {
        if (!['accepted', 'escalated'].includes(decision)) return;

        setReports((prev) =>
            prev.map((report) => {
                if (
                    report.id !== id ||
                    report.handledBy !== 'community' ||
                    report.reviewDecision
                ) {
                    return report;
                }

                const reviewedAt = getTimestamp();

                return decision === 'accepted'
                    ? {
                        ...report,
                        reviewDecision: 'accepted',
                        reviewedAt,
                    }
                    : {
                        ...report,
                        reviewDecision: 'escalated',
                        reviewedAt,
                        handledBy: 'bpbd',
                        priority: 'darurat',
                        urgency: Math.max(report.urgency, 10),
                        dashboardDecision: 'overridden',
                        dashboardRoute: 'emergency',
                        dashboardReviewedAt: reviewedAt,
                        recommendationDecision: null,
                        recommendationRejectionReason: null,
                    };
            })
        );
    }

    function getReport(id) {
        return reports.find((r) => r.id === id);
    }

    return (
        <ReportContext.Provider
            value={{
                reports,
                approveReport,
                saveEmergencyDraft,
                finalizeReport,
                rejectReport,
                reviewDashboardReport,
                rejectRecommendation,
                acceptRecommendation,
                recordTimelineActivity,
                startCommunityHandling,
                completeCommunityReports,
                rerouteReport,
                reviewCommunityReport,
                getReport,
            }}
        >
            {children}
        </ReportContext.Provider>
    );
}

export function useReportContext() {
    const ctx = useContext(ReportContext);
    if (!ctx) throw new Error('useReportContext must be used inside ReportProvider');
    return ctx;
}