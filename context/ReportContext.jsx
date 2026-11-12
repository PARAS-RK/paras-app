'use client';

import { useState, useContext, createContext } from 'react';
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

export function ReportProvider({ children }) {
    const [reports, setReports] = useState(INITIAL_REPORTS);

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
    function rejectReport(id, reason) {
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
}

    // Pemeriksaan awal Dashboard: menerima laporan untuk antrean AI.
    function reviewDashboardReport(id) {
    setReports(prev => prev.map(report => {
        if (
            report.id !== id ||
            report.status === 'rejected' ||
            report.dashboardDecision
        ) {
            return report;
        }

        const isCommunity = report.handledBy === 'community';

        return addTimelineEntry({
            ...report,
            dashboardDecision: 'accepted',
            dashboardRoute: isCommunity ? 'community' : 'emergency',
            dashboardReviewedAt: getTimestamp(),
            ...(isCommunity ? { reviewDecision: 'accepted' } : {}),
        }, 'decision', 'Laporan diterima',
        `Diterima melalui ${isCommunity ? 'Jalur B' : 'Jalur A'}`);
    }));
}

    // Override rute hanya dilakukan dari Dashboard.
    function rerouteReport(id, route) {
        if (!['emergency', 'community'].includes(route)) return;

        setReports((prev) =>
            prev.map((report) => {
                if (report.id !== id || report.status === 'rejected') {
                    return report;
                }

                const isEmergency = route === 'emergency';
                const wasEmergency = report.handledBy === 'bpbd';

                return addTimelineEntry({
    ...report,
    handledBy: isEmergency ? 'bpbd' : 'community',
    overrideFrom: report.handledBy,
    ...(isEmergency ? {
        urgency: Math.max(report.urgency, 10),
        priority: 'darurat',
    } : wasEmergency ? { urgency: 10 } : {}),
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
            })
        );
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