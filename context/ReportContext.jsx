'use client';

import { useState, useContext, createContext, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { INITIAL_REPORTS } from '@/lib/reportStore';

export const ReportContext = createContext(null);

function getTimestamp() {
    return new Date().toISOString();
}

function formatTimestamp(value) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    }).format(date) + ' WIB';
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
    return {
        id: row.ticket_code,
        databaseId: row.report_id,
        ticketCode: row.ticket_code,
        status: row.report_status,

        userId: row.user_id,
        regionId: row.region_id,
        regionLabel: region?.subdistrict
        ? `Kel. ${region.subdistrict}`
        : 'Wilayah tidak diketahui',

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

   async function saveAdminReview(
    report,
    decision,
    route = null,
    reason = null,
    overrideFrom = null
) {
    const supabase = createClient();

    if (source !== 'admin') {
        return {
            success: false,
            error: 'Penyimpanan hanya dapat dilakukan dari sumber admin.',
        };
    }

    if (!report.databaseId) {
        return {
            success: false,
            error: 'ID laporan database tidak ditemukan.',
        };
    }

    const { error } = await supabase.rpc('save_admin_review', {
        p_report_id: report.databaseId,
        p_decision: decision,
        p_route: route,
        p_reason: reason,
        p_override_from: overrideFrom,
    });

    if (error) {
        return {
            success: false,
            error: error.message,
        };
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
            // Ambil riwayat perubahan status laporan
            const { data: statusLogRows, error: statusLogError } = await supabase
                .from('report_status_logs')
                .select('*')
                .in('report_id', reportIds)
                .order('created_at', { ascending: true });

            if (statusLogError) {
                console.error('Gagal mengambil riwayat status laporan:', statusLogError);
                return;
            }

// Ambil keputusan admin
const { data: reviewRows, error: reviewError } = await supabase
    .from('report_admin_reviews')
    .select(`
        report_id,
        review_decision,
        handling_route,
        override_from,
        review_reason,
        reviewed_at
    `)
    .in('report_id', reportIds);
console.log('REPORT IDS:', reportIds);
// Ambil hasil penilaian AI
const { data: assessmentRows, error: assessmentError } = await supabase
    .from('report_ai_assessments')
    .select(`
        assessment_id,
        report_id,
        predicted_category,
        urgency_score,
        urgency_level,
        feature_scores,
        model_name,
        prompt_version,
        created_at
    `)
    .in('report_id', reportIds)
    .order('created_at', { ascending: false });
    console.log('ASSESSMENT ERROR:', assessmentError);
    console.log('ASSESSMENT ROWS:', assessmentRows);

    if (reviewError || assessmentError) {
    console.error('Gagal mengambil data penting laporan:', {
        reviewError,
        assessmentError,
    });
    return;
}

// Ambil data eskalasi Jalur A
const { data: escalationRows, error: escalationError } = await supabase
    .from('report_escalations')
    .select('*')
    .in('report_id', reportIds);

if (escalationError) {
    console.error('Gagal mengambil data eskalasi:', escalationError);
    return;
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
    return;
}

if (!isActive) return;

// Pemetaan keputusan admin
const reviewsByReport = new Map(
    (reviewRows || []).map(review => [
        String(review.report_id),
        review,
    ])
);

// Pemetaan hasil penilaian AI terbaru
const assessmentsByReport = new Map();

(assessmentRows || []).forEach(item => {
    const key = String(item.report_id);

    if (!assessmentsByReport.has(key)) {
        assessmentsByReport.set(key, item);
    }
});

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
    const assessment = assessmentsByReport.get(String(row.report_id));
    const escalation = escalationsByReport.get(String(row.report_id));

    const escalationTimeline = escalation
        ? logsByEscalation.get(String(escalation.escalation_id)) || []
        : [];

    return {
        ...report,

        ...(assessment ? {
            aiCategory: assessment.predicted_category,
            urgency: Number(assessment.urgency_score) || 0,
            priority: assessment.urgency_level,
            handledBy: ['tinggi', 'darurat'].includes(
                String(assessment.urgency_level || '').toLowerCase()
            )
                ? 'bpbd'
                : ['sedang', 'rendah'].includes(
                    String(assessment.urgency_level || '').toLowerCase()
                )
                    ? 'community'
                    : 'unassigned',
            featureScores: assessment.feature_scores,
            aiAssessmentId: assessment.assessment_id,
            aiModel: assessment.model_name,
            aiPromptVersion: assessment.prompt_version,
            aiAssessedAt: assessment.created_at,
        } : {}),

        ...(review ? {
            ...(review.handling_route === 'jalur_a'
                ? { handledBy: 'bpbd' }
                : review.handling_route === 'jalur_b'
                    ? { handledBy: 'community' }
                    : {}),

            dashboardDecision: review.review_decision,

            dashboardRoute: review.handling_route === 'jalur_a'
                ? 'emergency'
                : review.handling_route === 'jalur_b'
                    ? 'community'
                    : null,

            overrideFrom: review.override_from === 'jalur_a'
                ? 'bpbd'
                : review.override_from === 'jalur_b'
                    ? 'community'
                    : null,

            dashboardReviewedAt: review.reviewed_at || null,

            reviewDecision:
            review.review_decision,

            rejectionReason:
            review.review_decision === 'rejected'
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

        timeline: [
    ...(statusLogRows || [])
        .filter(log => String(log.report_id) === String(row.report_id))
        .map(log => ({
            id: log.log_id,
            type: 'status',
            label: log.log_status,
            description: log.log_notes || '',
            timestamp: log.created_at,
        })),
    ...escalationTimeline,
].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
),
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

    const approveReport = async (id) => {
    const supabase = createClient();

    const report = reports.find(item => item.id === id);

    if (
        !report?.databaseId ||
        report.status !== 'in_review' ||
        report.handledBy !== 'bpbd' ||
        !['accepted', 'overridden'].includes(report.reviewDecision)
    ) {
        return false;
    }

    const { data: escalationId, error } = await supabase.rpc(
        'approve_report',
        {
            p_report_id: report.databaseId,
            p_draft_message: report.emergencyDraft || null,
            p_hotline: report.emergencyHotline || null,
        }
    );

    if (error) {
        console.error('Gagal memulai penanganan Jalur A:', error);
        return false;
    }

    setReports(prev => prev.map(item =>
        item.id === id
            ? {
                ...item,
                status: 'in_progress',
                escalationId,
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
        console.log('SAVE EMERGENCY DIPANGGIL:', {
            id,
            message,
            hotline,
        });
    const supabase = createClient();

    const report = reports.find(item => item.id === id);

    if (!report?.databaseId) {
        console.error('ID laporan tidak ditemukan:', id);
        return false;
    }

    console.log('[DEBUG SAVE EMERGENCY]', {
    id,
    databaseId: report.databaseId,
    hotline,
    message,
});
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
console.log('[DEBUG HASIL UPSERT]', escalation);
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

    // Memastikan laporan sedang ditangani melalui Jalur A.
    if (
        report.status !== 'in_progress' ||
        report.handledBy !== 'bpbd'
    ) {
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

    const { error: finalizeError } = await supabase.rpc('finalize_report', {
    p_report_id: report.databaseId,
    p_escalation_id: report.escalationId,
    p_completion_notes: completionNotes,
    p_resolution: resolutionText,
    p_proof_path: proofPath,
});

    if (finalizeError) {
        console.error('Gagal menyelesaikan laporan:', finalizeError);
        return false;
    }

    setReports(prev => prev.map(item =>
        item.id === id
            ? {
                ...item,
                status: 'resolved',
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
    if (!target.databaseId) {
    return {
        success: false,
        message: 'ID database laporan tidak ditemukan.',
    };
    }

    if (target.status !== 'submitted') {
        return {
            success: false,
            message: 'Laporan tidak berada dalam status yang dapat ditinjau.',
        };
    }

    if (target.dashboardDecision) {
        return {
            success: false,
            message: 'Laporan sudah memiliki keputusan Dashboard.',
        };
    }

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

    if (!target) {
    return {
        success: false,
        message: 'Laporan tidak ditemukan.',
    };
}

    if (!target.databaseId) {
        return {
            success: false,
            message: 'ID database laporan tidak ditemukan.',
        };
    }

    if (target.status !== 'submitted' || target.dashboardDecision) {
        return {
            success: false,
            message: 'Laporan sudah diproses atau tidak berada dalam status yang dapat ditinjau.',
        };
    }

    const route = target.handledBy === 'bpbd'
        ? 'jalur_a'
        : target.handledBy === 'community'
            ? 'jalur_b'
            : null;

    if (!route) {
        return {
            success: false,
            message: 'Jalur laporan belum ditentukan dari hasil penilaian AI.',
        };
    }

    const result = await saveAdminReview(target, 'accepted', route);

    if (!result.success) return result;

    const isCommunity = route === 'jalur_b';

    setReports(prev => prev.map(report => {
        if (
            report.id !== id ||
            report.status === 'rejected' ||
            report.dashboardDecision
        ) {
            return report;
        }

        return addTimelineEntry({
            ...report,
            status: 'in_review',
            dashboardDecision: 'accepted',
            dashboardRoute: isCommunity ? 'community' : 'emergency',
            reviewDecision: 'accepted',
            dashboardReviewedAt: getTimestamp(),
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

    if (!target) {
        return {
            success: false,
            message: 'Laporan tidak ditemukan.',
        };
    }

    if (!target.databaseId) {
        return {
            success: false,
            message: 'ID database laporan tidak ditemukan.',
        };
    }

    if (target.status !== 'in_review') {
        return {
            success: false,
            message: 'Override hanya dapat dilakukan sebelum penanganan dimulai.',
        };
    }

    const isEmergency = route === 'emergency';
    const wasEmergency = target.handledBy === 'bpbd';
    if (!['bpbd', 'community'].includes(target.handledBy)) {
    return {
        success: false,
        message: 'Rekomendasi jalur laporan belum tersedia.',
    };
}
    if (
    (target.handledBy === 'bpbd' && route === 'emergency') ||
    (target.handledBy === 'community' && route === 'community')
) {
    return {
        success: false,
        message: 'Laporan sudah berada di jalur tersebut.',
    };
}

    const result = await saveAdminReview(
        target,
        'overridden',
        isEmergency ? 'jalur_a' : 'jalur_b',
        null,
        wasEmergency ? 'jalur_a' : 'jalur_b'
    );
    if (!result.success) return result;

    setReports(prev => prev.map(report => {
        if (report.id !== id || report.status === 'rejected') return report;

        return addTimelineEntry({
            ...report,
            handledBy: isEmergency ? 'bpbd' : 'community',
            overrideFrom: report.handledBy,
        
            status: 'in_review',
            dashboardDecision: 'overridden',
            dashboardRoute: route,
            dashboardReviewedAt: getTimestamp(),
            reviewDecision: 'overridden',
            reviewedAt: getTimestamp(),
            recommendationDecision: null,
            recommendationRejectionReason: null,
        }, 'decision', 'Jalur laporan diubah',
        `Override dari ${wasEmergency ? 'Jalur A' : 'Jalur B'} ke ${isEmergency ? 'Jalur A' : 'Jalur B'}`);
    }));

    return { success: true };
}

    // Mencatat aktivitas dari modul penanganan laporan.
function recordTimelineActivity(id, type, label, description = '') {
    setReports(prev => prev.map(report => {
        if (report.id !== id) return report;

        return addTimelineEntry(report, type, label, description);
    }));
}

    async function startCommunityHandling(id, actionId, actionTitle) {
    const report = reports.find((item) => item.id === id);

    if (
        !report?.databaseId ||
        report.status !== 'in_review' ||
        report.handledBy !== 'community' ||
        !['accepted', 'overridden'].includes(report.reviewDecision)
    ) {
        return false;
    }

    const supabase = createClient();

    const { data, error } = await supabase
        .from('reports')
        .update({
            report_status: 'in_progress',
            updated_at: new Date().toISOString(),
        })
        .eq('report_id', report.databaseId)
        .eq('report_status', 'in_review')
        .select('report_id')
        .maybeSingle();

    if (error || !data) {
        console.error('Gagal memulai penanganan Jalur B:', error);
        return false;
    }

    // Simpan riwayat perubahan status.
    const { data: { user } } = await supabase.auth.getUser();

    const { error: logError } = await supabase
        .from('report_status_logs')
        .insert({
            report_id: report.databaseId,
            log_status: 'in_progress',
            log_notes: `Laporan mulai ditangani melalui aksi "${actionTitle}" (ID: ${actionId}).`,
            is_public: false,
            created_by: user?.id,
        });

    if (logError) {
        console.error('Gagal menyimpan riwayat status Jalur B:', logError);
    }

    // Perbarui state lokal.
    setReports((prev) =>
        prev.map((item) => {
            if (item.id !== id) return item;

            return addTimelineEntry(
                {
                    ...item,
                    status: 'in_progress',
                    communityActionId: actionId,
                },
                'handling',
                'Penanganan dimulai',
                `Laporan mulai ditangani melalui aksi "${actionTitle}" (ID: ${actionId}).`
            );
        })
    );

    return true;
}

    async function completeCommunityReports(reportIds, actionId, actionTitle) {
    if (!Array.isArray(reportIds) || reportIds.length === 0) {
        return false;
    }

    // Pastikan semua laporan tersedia dan sedang diproses.
    const targetReports = reports.filter(
        (report) => reportIds.includes(report.id)
    );

    if (
        targetReports.length !== reportIds.length ||
        targetReports.some(
            (report) =>
                !report.databaseId ||
                report.status !== 'in_progress'
        )
    ) {
        console.error(
            'Penyelesaian dibatalkan: laporan tidak lengkap atau bukan berstatus in_progress.'
        );
        return false;
    }

    const databaseIds = targetReports.map(
        (report) => report.databaseId
    );

    const supabase = createClient();

    // Jalankan RPC untuk update status dan pencatatan log.
    const { error } = await supabase.rpc(
        'complete_community_reports',
        {
            p_report_ids: databaseIds,
            p_action_title: actionTitle,
        }
    );

    if (error) {
        console.error(
            'Gagal menyelesaikan laporan Jalur B:',
            error
        );
        return false;
    }

    // Perbarui state lokal setelah RPC berhasil.
    setReports((prev) =>
        prev.map((report) => {
            if (!databaseIds.includes(report.databaseId)) {
                return report;
            }

            return addTimelineEntry(
                {
                    ...report,
                    status: 'resolved',
                    completedAt: getTimestamp(),
                    communityActionId: actionId,
                },
                'completed',
                'Penanganan selesai',
                `Aksi komunitas "${actionTitle}" (ID: ${actionId}) telah diselesaikan.`
            );
        })
    );

    return true;
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
                recordTimelineActivity,
                startCommunityHandling,
                completeCommunityReports,
                rerouteReport,
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