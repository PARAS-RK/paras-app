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
        const supabase = createClient();
    if (source !== 'admin') {
        return { success: true };
    }

    if (!report.databaseId) {
        return {
            success: false,
            error: 'ID laporan database tidak ditemukan.',
        };
    }

    const { data: { user }, error: authError } =
        await supabase.auth.getUser();
        console.log('AUTH CHECK:', {
    userId: user?.id,
    email: user?.email,
    authError,
    reportId: report?.databaseId,
});

    if (authError || !user) {
        return {
            success: false,
            error: 'Sesi admin tidak ditemukan.',
        };
    }

    const now = new Date().toISOString();
    const reportStatus =
        decision === 'rejected' ? 'rejected' : 'in_review';

    const logNotes = {
        accepted: 'Laporan diterima oleh Ketua PKK.',
        rejected: reason || 'Laporan ditolak oleh Ketua PKK.',
        overridden: `Rute penanganan diubah menjadi ${route === 'jalur_a' ? 'Jalur A' : 'Jalur B'}.`,
    };

    // 1. Simpan keputusan admin
    const { error: reviewError } = await supabase
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

    if (reviewError) {
        console.error('Gagal menyimpan keputusan:', reviewError);
        return { success: false, error: reviewError.message };
    }

    // 2. Perbarui status laporan
    const { error: reportError } = await supabase
        .from('reports')
        .update({
            report_status: reportStatus,
            updated_at: now,
        })
        .eq('report_id', report.databaseId);

    if (reportError) {
        console.error('Gagal memperbarui status laporan:', reportError);
        return { success: false, error: reportError.message };
    }

    // 3. Catat riwayat perubahan status
    const { error: logError } = await supabase
        .from('report_status_logs')
        .insert({
            report_id: report.databaseId,
            log_status: reportStatus,
            log_notes: logNotes[decision] || 'Keputusan admin diperbarui.',
            is_public: false,
            created_by: user.id,
        });

    if (logError) {
        console.error('Gagal menyimpan riwayat status:', logError);
        return { success: false, error: logError.message };
    }

    return { success: true };
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
    console.log('REGION ID:', regionId);
    console.log('ERROR FETCH:', error);
    console.log('JUMLAH LAPORAN:', rows?.length);
    console.log('DATA LAPORAN:', rows);

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

            const reportIds = rows.map(row => row.report_id);

// Ambil keputusan admin
const { data: reviewRows, error: reviewError } = await supabase
    .from('report_admin_reviews')
    .select(`
        report_id,
        review_decision,
        handling_route,
        review_reason,
        reviewed_at
    `)
    .in('report_id', reportIds);

if (reviewError) {
    console.error('Gagal mengambil keputusan admin:', reviewError);
}

// Ambil data eskalasi Jalur A
const { data: escalationRows, error: escalationError } = await supabase
    .from('report_escalations')
    .select('*')
    .in('report_id', reportIds);

if (escalationError) {
    console.error('Gagal mengambil data eskalasi:', escalationError);
}

// Ambil timeline eskalasi
const escalationIds = (escalationRows || [])
    .map(item => item.escalation_id);

const { data: escalationLogs, error: escalationLogsError } =
    escalationIds.length
        ? await supabase
            .from('report_escalation_logs')
            .select('*')
            .in('escalation_id', escalationIds)
            .order('created_at', { ascending: true })
        : { data: [], error: null };

if (escalationLogsError) {
    console.error('Gagal mengambil timeline eskalasi:', escalationLogsError);
}

if (!isActive) return;

// Pemetaan keputusan admin
const reviewsByReport = new Map(
    (reviewRows || []).map(review => [
        String(review.report_id),
        review,
    ])
);

// Pemetaan data eskalasi
const escalationsByReport = new Map(
    (escalationRows || []).map(item => [
        String(item.report_id),
        item,
    ])
);

// Pemetaan timeline eskalasi
const logsByEscalation = new Map();

(escalationLogs || []).forEach(log => {
    const key = String(log.escalation_id);

    if (!logsByEscalation.has(key)) {
        logsByEscalation.set(key, []);
    }

    logsByEscalation.get(key).push({
        id: log.log_id,
        type: log.activity_type,
        label: log.activity_type,
        description: log.activity_description || '',
        timestamp: log.created_at,
    });
});

const mappedReports = rows.map(row => {
    const profile = profiles.find(p => p.user_id === row.user_id);
    const region = regions.find(r => r.region_id === row.region_id);
    const category = categories.find(
        c => c.category_code === row.report_category
    );

    const report = mapDatabaseReport(row, profile, region, category);
    const review = reviewsByReport.get(String(row.report_id));
    const escalation = escalationsByReport.get(String(row.report_id));

    const escalationTimeline = escalation
        ? logsByEscalation.get(String(escalation.escalation_id)) || []
        : [];

    return {
        ...report,

        ...(review ? {
            handledBy: review.handling_route === 'jalur_a'
                ? 'bpbd'
                : review.handling_route === 'jalur_b'
                    ? 'community'
                    : 'unassigned',

            dashboardDecision: review.review_decision,
            dashboardRoute: review.handling_route === 'jalur_a'
                ? 'emergency'
                : review.handling_route === 'jalur_b'
                    ? 'community'
                    : null,

            dashboardReviewedAt: review.reviewed_at
                ? new Date(review.reviewed_at).toLocaleString('id-ID')
                : null,

            reviewDecision: review.handling_route === 'jalur_b' &&
                review.review_decision === 'accepted'
                    ? 'accepted'
                    : null,

            rejectionReason: review.review_decision === 'rejected'
                ? review.review_reason
                : null,
        } : {}),

        ...(escalation ? {
            escalationId: escalation.escalation_id,
            emergencyDraft: escalation.draft_message,
            emergencyHotline: escalation.hotline,
            escalationStatus: escalation.escalation_status,
            completionNotes: escalation.completion_notes,
            resolution: escalation.resolution,
            proofPath: escalation.proof_path,
        } : {}),

        timeline: escalationTimeline,
    };
});

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
console.log('MAPPED REPORTS:', mappedReports);
console.log('FINAL REPORTS:', reportsWithMedia);
        }

        fetchReports();

        return () => {
            isActive = false;
        };
    }, [source, regionId]);

    // Persetujuan untuk memulai proses penanganan laporan.
    const approveReport = async (id) => {
    const supabase = createClient();

    const report = reports.find(item => item.id === id);

    if (!report?.databaseId) {
        console.error('ID laporan tidak ditemukan:', id);
        return false;
    }

    const { data: escalation, error: escalationError } = await supabase
        .from('report_escalations')
        .upsert({
            report_id: report.databaseId,
            draft_message: report.emergencyDraft || null,
            hotline: report.emergencyHotline || null,
            escalation_status: 'in_progress',
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'report_id',
        })
        .select()
        .single();

    if (escalationError) {
        console.error('Gagal memperbarui status eskalasi:', escalationError);
        return false;
    }

    const { error: reportError } = await supabase
        .from('reports')
        .update({
            report_status: 'in_progress',
            updated_at: new Date().toISOString(),
        })
        .eq('report_id', report.databaseId);

    if (reportError) {
        console.error('Gagal memperbarui status laporan:', reportError);
        return false;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error: statusLogError } = await supabase
        .from('report_status_logs')
        .insert({
            report_id: report.databaseId,
            log_status: 'in_progress',
            log_notes: 'Laporan mulai ditangani melalui Jalur A.',
            created_by: user?.id,
        });

    if (statusLogError) {
        console.error('Gagal menyimpan riwayat status:', statusLogError);
    }

    const { error: activityLogError } = await supabase
        .from('report_escalation_logs')
        .insert({
            escalation_id: escalation.escalation_id,
            activity_type: 'handling_started',
            activity_description: 'Ketua PKK memulai penanganan laporan Jalur A.',
            created_by: user?.id,
        });

    if (activityLogError) {
        console.error('Gagal menyimpan aktivitas eskalasi:', activityLogError);
    }

    setReports(prev => prev.map(item =>
        item.id === id
            ? {
                ...item,
                status: 'in_progress',
                escalationId: escalation.escalation_id,
                escalationStatus: 'in_progress',
                timeline: [
                    ...(item.timeline || []),
                    {
                        type: 'handling_started',
                        label: 'Penanganan dimulai',
                        description: 'Laporan mulai ditangani melalui Jalur A.',
                        timestamp: new Date().toISOString(),
                    },
                ],
            }
            : item
    ));

    return true;
};

    const saveEmergencyDraft = async (id, message, hotline) => {
    const supabase = createClient();

    const report = reports.find(item => item.id === id);

    if (!report?.databaseId) {
        console.error('ID laporan tidak ditemukan:', id);
        return false;
    }

    const { data: escalation, error: escalationError } = await supabase
        .from('report_escalations')
        .upsert({
            report_id: report.databaseId,
            draft_message: message,
            hotline,
            escalation_status: report.escalationStatus || 'draft',
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'report_id',
        })
        .select()
        .single();

    if (escalationError) {
        console.error('Gagal menyimpan draft eskalasi:', escalationError);
        return false;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error: logError } = await supabase
        .from('report_escalation_logs')
        .insert({
            escalation_id: escalation.escalation_id,
            activity_type: 'draft_saved',
            activity_description: 'Draft pesan eskalasi dan hotline disimpan.',
            created_by: user?.id,
        });

    if (logError) {
        console.error('Gagal menyimpan log eskalasi:', logError);
    }

    setReports(prev => prev.map(item =>
        item.id === id
            ? {
                ...item,
                escalationId: escalation.escalation_id,
                emergencyDraft: message,
                emergencyHotline: hotline,
                escalationStatus: escalation.escalation_status,
            }
            : item
    ));

    return true;
};

    const finalizeReport = async (id, publicMessage, resolution = {}) => {
    const supabase = createClient();

    const report = reports.find(item => item.id === id);

    if (!report?.databaseId) {
        console.error('ID laporan tidak ditemukan:', id);
        return false;
    }

    if (!report.escalationId) {
        console.error('Data eskalasi belum tersedia untuk laporan:', id);
        return false;
    }

    const completionNotes = resolution.completionNotes || '';
    const resolutionText = resolution.resolution || publicMessage || '';
    let proofPath = report.proofPath || null;

if (resolution.proofFile) {
    const file = resolution.proofFile;

    const extension = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExtension = /^[a-z0-9]+$/.test(extension)
        ? extension
        : 'jpg';

    const filePath = `jalur-a/${report.databaseId}/bukti-penyelesaian.${safeExtension}`;

    const { data: uploadedFile, error: uploadError } = await supabase
        .storage
        .from('bukti-laporan')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'image/jpeg',
        });

    if (uploadError) {
        console.error('Gagal mengunggah foto bukti:', uploadError);
        return false;
    }

    proofPath = uploadedFile.path;
}

    const { error: escalationError } = await supabase
        .from('report_escalations')
        .update({
            escalation_status: 'resolved',
            completion_notes: completionNotes,
            resolution: resolutionText,
            proof_path: proofPath,
            updated_at: new Date().toISOString(),
        })
        .eq('escalation_id', report.escalationId);

    if (escalationError) {
        console.error('Gagal menyimpan penyelesaian eskalasi:', escalationError);
        return false;
    }

    const { error: reportError } = await supabase
        .from('reports')
        .update({
            report_status: 'resolved',
            updated_at: new Date().toISOString(),
        })
        .eq('report_id', report.databaseId);

    if (reportError) {
        console.error('Gagal memperbarui status laporan:', reportError);
        return false;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error: statusLogError } = await supabase
        .from('report_status_logs')
        .insert({
            report_id: report.databaseId,
            log_status: 'resolved',
            log_notes: completionNotes || 'Laporan Jalur A telah diselesaikan.',
            created_by: user?.id,
        });

    if (statusLogError) {
        console.error('Gagal menyimpan riwayat status:', statusLogError);
    }

    const { error: activityLogError } = await supabase
        .from('report_escalation_logs')
        .insert({
            escalation_id: report.escalationId,
            activity_type: 'resolved',
            activity_description: completionNotes || 'Penanganan laporan Jalur A selesai.',
            created_by: user?.id,
        });

    if (activityLogError) {
        console.error('Gagal menyimpan aktivitas penyelesaian:', activityLogError);
    }

    setReports(prev => prev.map(item =>
        item.id === id
            ? {
                ...item,
                status: 'handled',
                escalationStatus: 'resolved',
                completionNotes,
                resolution: resolutionText,
                publicMessage,
                completedAt: new Date().toISOString(),
                timeline: [
                    ...(item.timeline || []),
                    {
                        type: 'resolved',
                        label: 'Penanganan selesai',
                        description: completionNotes || 'Penanganan laporan Jalur A selesai.',
                        timestamp: new Date().toISOString(),
                    },
                ],
            }
            : item
    ));

    return true;
};

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