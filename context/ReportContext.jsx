'use client';

import { useState, useContext, createContext } from 'react';
import { INITIAL_REPORTS } from '@/lib/reportStore';

export const ReportContext = createContext(null);

export function ReportProvider({ children }) {
    const [reports, setReports] = useState(INITIAL_REPORTS);

    function approveReport(id) {
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'in_progress' } : r));
    }

    function finalizeReport(id, publicMessage, resolution = {}) {
        const completedAt = `${new Intl.DateTimeFormat('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta',
        }).format(new Date())} WIB`;
        
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'handled', publicMessage, completedAt, ...resolution } : r));
    }

    function rejectReport(id, reason) {
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: 'rejected', rejectionReason: reason } : r));
    }

    function rerouteReport(id, route) {
        setReports((prev) => prev.map((report) => {
            if (report.id !== id) return report;
            return route === 'emergency'
                ? {
                    ...report,
                    urgency: report.urgency >= 7 ? report.urgency : 10,
                    priority: 'darurat',
                    handledBy: 'bpbd',
                    status: report.urgency >= 7 ? report.status : 'pending',
                }
                : { ...report, handledBy: 'community', status: 'pending' };
        }));
    }

    function getReport(id) {
        return reports.find((r) => r.id === id);
    }

    return (
        <ReportContext.Provider value={{ reports, approveReport, finalizeReport, rejectReport, rerouteReport, getReport }}>
            {children}
        </ReportContext.Provider>
    );
}

export function useReportContext() {
    const ctx = useContext(ReportContext);
    if (!ctx) throw new Error('useReportContext must be used inside ReportProvider');
    return ctx;
}