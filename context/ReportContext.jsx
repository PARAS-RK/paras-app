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

        aiCategory: category?.label || row.report_category,

        // Jalur belum dapat ditentukan dari kolom reports saat ini.
        handledBy: 'unassigned',

        clusterId: row.cluster_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,

        timeline: [],
    };
}

// Data contoh untuk mode bypass. Status "pending" diubah ke "submitted"
// agar sama dengan status laporan baru dari Supabase.
function createDemoReports() {
    return INITIAL_REPORTS.map((report) => ({
        ...report,
        status: report.status === 'pending' ? 'submitted' : report.status,
        regionLabel: report.area || 'Wilayah tidak diketahui',
        demo: true,
    }));
}

export function ReportProvider({ children, source = 'local', regionId=null}) {
    const [reports, setReports] = useState(
        source === 'admin' ? [] : source === 'demo' ? createDemoReports() : INITIAL_REPORTS
    );
    const [communityDrafts, setCommunityDrafts] = useState({});
    const [communityDraftsLoaded, setCommunityDraftsLoaded] = useState(false);

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

    if (reviewError) {
    console.error('Gagal mengambil data penting laporan:', reviewError);
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

        ...(review ? (() => {
            const isRejected = review.review_decision === 'rejected';
            const routeFromReview = review.handling_route === 'jalur_a'
                ? 'emergency'
                : review.handling_route === 'jalur_b'
                    ? 'community'
                    : null;

            return {
                // Jalur final ditentukan Ketua PKK, bukan hasil klasifikasi AI.
                ...(!isRejected && routeFromReview === 'emergency'
                    ? { handledBy: 'bpbd' }
                    : !isRejected && routeFromReview === 'community'
                        ? { handledBy: 'community' }
                        : {}),

                dashboardDecision: review.review_decision,
                dashboardRoute: isRejected ? null : routeFromReview,

                // Diperbaruan lama masih dibaca untuk riwayat, tetapi tidak
                // lagi dihasilkan oleh alur keputusan Dashboard yang baru.
                overrideFrom: review.override_from === 'jalur_a'
                    ? 'bpbd'
                    : review.override_from === 'jalur_b'
                        ? 'community'
                        : null,

                dashboardReviewedAt: review.reviewed_at || null,
                reviewDecision: review.review_decision,

                rejectionReason: isRejected
                    ? review.review_reason
                    : null,
            };
        })() : {}),

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

let draftsByCluster = {};

if (source === 'admin') {
  const { data: draftRows, error: draftError } = await supabase
    .from('community_action_drafts')
    .select('*')
    .eq('region_id', regionId);

  if (draftError) {
    console.error('Gagal mengambil draf aksi komunitas:', draftError);
  } else {
    draftsByCluster = (draftRows || []).reduce((acc, row) => {
      acc[row.cluster_key] = {
        name: row.title,
        description: row.description || '',
        steps: row.steps || '',
        participantTarget: String(row.participant_target ?? ''),
        duration: row.duration || '',
        registrationRange: row.registration_range || '',
        implementationRange: row.implementation_range || '',
        location: row.location || '',
        category: row.category || '',
        savedAt: row.updated_at,
        sourceReportIds: row.source_report_ids || [],
      };
      return acc;
    }, {});
  }
}

setCommunityDrafts(draftsByCluster);
setCommunityDraftsLoaded(true);
setReports(reportsWithMedia);
        }

        fetchReports();

        return () => {
            isActive = false;
        };
    }, [source, regionId]);

    const approveReport = async (id) => {
    const report = reports.find(item => item.id === id);

    if (
        !report ||
        report.status !== 'in_review' ||
        report.handledBy !== 'bpbd' ||
        !['accepted', 'overridden'].includes(report.reviewDecision)
    ) {
        return false;
    }

    if (source === 'demo') {
        setReports(prev => prev.map(item => item.id === id
            ? addTimelineEntry({
                ...item,
                status: 'in_progress',
                escalationId: item.escalationId || `demo-esc-${id}`,
                escalationStatus: 'in_progress',
            }, 'handling_started', 'Penanganan dimulai', 'Laporan mulai ditangani melalui Jalur A (mode demo).')
            : item
        ));
        return true;
    }

    if (!report.databaseId) return false;

    const supabase = createClient();

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
    const supabase = createClient();

    const report = reports.find(item => item.id === id);

    if (!report) return false;

    if (source === 'demo') {
        setReports(prev => prev.map(item => item.id === id
            ? addTimelineEntry({
                ...item,
                emergencyDraft: message,
                emergencyHotline: hotline,
                escalationStatus: item.escalationStatus || 'draft',
                escalationId: item.escalationId || `demo-esc-${id}`,
            }, 'draft_saved', 'Draft eskalasi disimpan', 'Draft pesan dan hotline disimpan di browser (mode demo).')
            : item
        ));
        return true;
    }

    if (!report.databaseId) {
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
    const report = reports.find(item => item.id === id);

    // Memastikan laporan sedang ditangani melalui Jalur A.
    if (
        !report ||
        report.status !== 'in_progress' ||
        report.handledBy !== 'bpbd'
    ) {
        return false;
    }

    if (source === 'demo') {
        const notes = resolution.completionNotes || publicMessage || '';
        setReports(prev => prev.map(item => item.id === id
            ? addTimelineEntry({
                ...item,
                status: 'resolved',
                escalationStatus: 'resolved',
                completionNotes: notes,
                resolution: notes,
                proofName: resolution.proofName || null,
                proofPath: resolution.proofFile ? `demo/${id}` : null,
                resolutionPhoto: resolution.resolutionPhoto || null,
                publicMessage,
                completedAt: new Date().toISOString(),
            }, 'resolved', 'Penanganan selesai', notes || 'Penanganan laporan Jalur A selesai (mode demo).')
            : item
        ));
        return true;
    }

    if (!report.databaseId) {
        console.error('ID laporan tidak ditemukan:', id);
        return false;
    }

    if (!report.escalationId) {
        console.error('Data eskalasi belum tersedia untuk laporan:', id);
        return false;
    }

    const supabase = createClient();

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
                proofName: resolution.proofName || null,
                proofPath,
                resolutionPhoto: resolution.resolutionPhoto || null,
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

    /**
     * Satu-satunya titik keputusan Ketua PKK di Dashboard.
     *
     * decision:
     *  - 'accept_a' → Jalur A (darurat), lanjut ke antrean Asisten AI.
     *  - 'accept_b' → Jalur B (komunitas), lanjut ke klaster Tabungan Aksi.
     *  - 'reject'   → ditolak, alasan tampil di Pantau Lapor (zona publik).
     */
    async function decideReport(id, decision, reason = '') {
        const decisionMap = {
            accept_a: {
                dbDecision: 'accepted',
                route: 'jalur_a',
                dashboardRoute: 'emergency',
                handledBy: 'bpbd',
                label: 'Diterima melalui Jalur A (darurat)',
                description: 'Laporan diteruskan ke antrean Asisten AI Jalur A.',
            },
            accept_b: {
                dbDecision: 'accepted',
                route: 'jalur_b',
                dashboardRoute: 'community',
                handledBy: 'community',
                label: 'Diterima melalui Jalur B (komunitas)',
                description: 'Laporan masuk ke klaster Tabungan Aksi sesuai kategorinya.',
            },
            reject: {
                dbDecision: 'rejected',
                // Rute AI tetap disimpan sebagai konteks, tetapi tidak menentukan penanganan.
                route: null,
                dashboardRoute: null,
                handledBy: null,
                label: 'Laporan ditolak',
                description: reason,
            },
        };

        const config = decisionMap[decision];

        if (!config) {
            return { success: false, message: 'Keputusan tidak dikenal.' };
        }

        const target = reports.find(report => report.id === id);

        if (!target) {
            return { success: false, message: 'Laporan tidak ditemukan.' };
        }

        if (target.status !== 'submitted' || target.dashboardDecision) {
            return {
                success: false,
                message: 'Laporan sudah diproses atau tidak berada dalam status yang dapat ditinjau.',
            };
        }

        if (decision === 'reject' && !String(reason).trim()) {
            return {
                success: false,
                message: 'Alasan penolakan wajib diisi.',
            };
        }

        const route = config.route;
        const cleanReason = decision === 'reject' ? String(reason).trim() : null;

        // Mode bypass: keputusan hanya disimpan di memori browser untuk pratinjau UI.
        if (source === 'demo') {
            setReports(prev => prev.map(report => {
                if (report.id !== id) return report;

                return addTimelineEntry({
                    ...report,
                    status: decision === 'reject' ? 'rejected' : 'in_review',
                    handledBy: config.handledBy,
                    dashboardDecision: config.dbDecision,
                    dashboardRoute: config.dashboardRoute,
                    handlingRoute: route,
                    reviewDecision: config.dbDecision,
                    rejectionReason: cleanReason,
                    dashboardReviewedAt: getTimestamp(),
                    recommendationDecision: null,
                    recommendationRejectionReason: null,
                    demoDecision: true,
                }, 'decision', config.label, config.description);
            }));

            return { success: true, decision, demo: true };
        }

        if (!target.databaseId) {
            return {
                success: false,
                message: 'ID database laporan tidak ditemukan.',
            };
        }

        // save_admin_review menyimpan keputusan, status, dan log publik (lihat sql/002).
        const result = await saveAdminReview(
            target,
            config.dbDecision,
            route,
            cleanReason,
            null
        );

        if (!result.success) return result;

        setReports(prev => prev.map(report => {
            if (report.id !== id) return report;

            return addTimelineEntry({
                ...report,
                status: decision === 'reject' ? 'rejected' : 'in_review',
                handledBy: config.handledBy,
                dashboardDecision: config.dbDecision,
                dashboardRoute: config.dashboardRoute,
                reviewDecision: config.dbDecision,
                rejectionReason: cleanReason,
                dashboardReviewedAt: getTimestamp(),
                recommendationDecision: null,
                recommendationRejectionReason: null,
            }, 'decision', config.label, config.description);
        }));

        return { success: true, decision };
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
        !report ||
        report.status !== 'in_review' ||
        report.handledBy !== 'community' ||
        !['accepted', 'overridden'].includes(report.reviewDecision)
    ) {
        return false;
    }

    if (source === 'demo') {
        setReports((prev) => prev.map((item) => item.id === id
            ? addTimelineEntry({
                ...item,
                status: 'in_progress',
                communityActionId: actionId,
            }, 'handling', 'Penanganan dimulai', `Laporan mulai ditangani melalui aksi "${actionTitle}" (ID: ${actionId}) dalam mode demo.`)
            : item
        ));
        return true;
    }

    if (!report.databaseId) return false;

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
            (report) => report.status !== 'in_progress'
        )
    ) {
        console.error(
            'Penyelesaian dibatalkan: laporan tidak lengkap atau bukan berstatus in_progress.'
        );
        return false;
    }

    if (source === 'demo') {
        setReports((prev) => prev.map((report) => reportIds.includes(report.id)
            ? addTimelineEntry({
                ...report,
                status: 'resolved',
                completedAt: getTimestamp(),
                communityActionId: actionId,
            }, 'completed', 'Penanganan selesai', `Aksi komunitas "${actionTitle}" (ID: ${actionId}) telah diselesaikan dalam mode demo.`)
            : report
        ));
        return true;
    }

    if (targetReports.some((report) => !report.databaseId)) {
        console.error('Penyelesaian dibatalkan: ID database laporan tidak ditemukan.');
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

    async function saveCommunityDraft(payload) {
    const { clusterKey, regionId, reportIds, draft } = payload || {};

    if (!clusterKey || !Array.isArray(reportIds) || !reportIds.length) {
        return false;
    }

    if (source === 'demo') {
        setCommunityDrafts((prev) => ({
            ...prev,
            [clusterKey]: { ...draft, savedAt: getTimestamp(), sourceReportIds: reportIds },
        }));
        return true;
    }

    const supabase = createClient();

    const { error } = await supabase.rpc('save_community_action_draft', {
        p_cluster_key: clusterKey,
        p_region_id: Number(regionId) || null,
        p_report_ids: reportIds.map(Number),
        p_draft: draft,
    });

    if (error) {
        console.error('Gagal menyimpan draf aksi komunitas:', error);
        return false;
    }

    setCommunityDrafts((prev) => ({
        ...prev,
        [clusterKey]: { ...draft, savedAt: getTimestamp(), sourceReportIds: reportIds },
    }));

    return true;
}

    async function publishCommunityAction(payload) {
    const { clusterKey, regionId, reportIds, draft } = payload || {};

    if (!clusterKey || !Array.isArray(reportIds) || !reportIds.length) {
        return null;
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc('publish_community_action', {
        p_cluster_key: clusterKey,
        p_region_id: Number(regionId) || null,
        p_report_ids: reportIds.map(Number),
        p_draft: draft,
    });

    if (error || !data) {
        console.error('Gagal menerbitkan aksi komunitas:', JSON.stringify(error));
        console.error('publish error details:', error?.message, error?.details, error?.hint, error?.code);
        return null;
    }

    setCommunityDrafts((prev) => {
        const next = { ...prev };
        delete next[clusterKey];
        return next;
    });

    return String(data);
}

    async function verifyActionProof(proofId, status, reason = '') {
    if (!proofId || !['verified', 'rejected'].includes(status)) return false;

    if (source === 'demo') return true;

    const supabase = createClient();
    const { error } = await supabase.rpc('set_action_proof_status', {
        p_proof_id: Number(proofId),
        p_status: status,
        p_reason: reason || null,
    });

    if (error) {
        console.error('Gagal memverifikasi bukti aksi:', error);
        return false;
    }

    return true;
}

    async function completeCommunityAction(actionId) {
    if (!actionId) return false;

    if (source === 'demo') return true;

    const supabase = createClient();
    const { error } = await supabase.rpc('complete_community_action', {
        p_action_id: Number(actionId),
    });

    if (error) {
        console.error('Gagal menyelesaikan aksi komunitas:', error);
        return false;
    }

    return true;
}

    function getReport(id) {
        return reports.find((r) => r.id === id);
    }

    return (
        <ReportContext.Provider
            value={{
                reports,
                communityDrafts,
                communityDraftsLoaded,
                approveReport,
                saveEmergencyDraft,
                finalizeReport,
                decideReport,
                recordTimelineActivity,
                startCommunityHandling,
                completeCommunityReports,
                saveCommunityDraft,
                publishCommunityAction,
                verifyActionProof,
                completeCommunityAction,
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