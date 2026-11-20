"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    BellOff,
    Check,
    CheckCheck,
    FileWarning,
    Leaf,
    Siren,
    Trash2,
    UserPlus,
    X,
    XCircle,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAdmin } from '@/context/AdminContext';
import { useReportContext } from '@/context/ReportContext';
import { formatSubmitted } from '@/lib/memberStore';
import { useAdminAksi } from '@/lib/adminAksi';
import { createClient } from '@/lib/supabase/client';

const meta = {
    emergency: {
        Icon: Siren,
        cls: 'bg-red-50 text-red-600',
    },
    report: {
        Icon: FileWarning,
        cls: 'bg-amber-50 text-amber-700',
    },
    rejected: {
        Icon: XCircle,
        cls: 'bg-red-50 text-red-700',
    },
    approval: {
        Icon: UserPlus,
        cls: 'bg-pink-xlight text-pink-dark',
    },
    action: {
        Icon: Leaf,
        cls: 'bg-brand-light text-brand',
    },
};

function toMillis(value) {
    if (!value) return Date.now();
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? Date.now() : parsed;
}

function reportNotifications(reports, currentTime) {
    return reports.flatMap((report) => {
        const time = currentTime ? formatSubmitted(toMillis(report.createdAt), currentTime) : '';
        const baseId = `n-report-${report.databaseId || report.id}`;
        const title = report.title || 'Laporan warga';
        const area = report.area || report.regionLabel || 'Wilayah tidak diketahui';

        if (!report.dashboardDecision) {
            return [{
                id: `${baseId}-submitted`,
                type: 'report',
                sortAt: toMillis(report.createdAt),
                title: 'Laporan baru menunggu keputusan',
                body: `${title} · ${area}. Tentukan Jalur A, Jalur B, atau tolak.`,
                time,
                to: '/admin',
            }];
        }

        const reviewedAt = toMillis(report.dashboardReviewedAt || report.createdAt);

        if (report.dashboardDecision === 'rejected') {
            return [{
                id: `${baseId}-rejected`,
                type: 'rejected',
                sortAt: reviewedAt,
                title: 'Laporan ditolak',
                body: `${title} · ${report.rejectionReason || 'Alasan tidak tersedia.'}`,
                time: currentTime ? formatSubmitted(reviewedAt, currentTime) : '',
                to: '/admin/ai-assistant/archive/report-history',
            }];
        }

        if (report.dashboardRoute === 'emergency') {
            return [{
                id: `${baseId}-accepted-a`,
                type: 'emergency',
                sortAt: reviewedAt,
                title: 'Laporan diterima ke Jalur A',
                body: `${title} masuk antrean darurat Asisten AI untuk diteruskan ke BPBD.`,
                time: currentTime ? formatSubmitted(reviewedAt, currentTime) : '',
                to: '/admin/ai-assistant?queue=emergency',
            }];
        }

        if (report.dashboardRoute === 'community') {
            return [{
                id: `${baseId}-accepted-b`,
                type: 'action',
                sortAt: reviewedAt,
                title: 'Laporan masuk Tabungan Aksi',
                body: `${title} dikelompokkan ke klaster ${report.aiCategory || 'kategori laporan'} di ${area}.`,
                time: currentTime ? formatSubmitted(reviewedAt, currentTime) : '',
                to: '/admin/actions/savings',
            }];
        }

        return [];
    });
}

export default function AdminNotifications() {
    const router = useRouter();
    const admin = useAdmin();
    const areaLabel = admin?.areaLabel || '';
    const { reports } = useReportContext();
    const { aksi } = useAdminAksi();
    const [open, setOpen] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const [currentTime, setCurrentTime] = useState(null);
    const [readIds, setReadIds] = useState(() => new Set());
    const [removedIds, setRemovedIds] = useState(() => new Set());
    const [backendRegistrations, setBackendRegistrations] = useState([]);

    const registrations = backendRegistrations;
    const panelRef = useRef(null);

    useEffect(() => {
        setCurrentTime(Date.now());
    }, []);

    // Status baca/hapus notifikasi disimpan di backend, bukan hanya state lokal.
    useEffect(() => {
        if (!admin?.userId) return;

        let active = true;
        const supabase = createClient();

        async function loadState() {
            const { data, error } = await supabase
                .from('admin_notification_states')
                .select('notif_key, read_at, removed_at')
                .eq('admin_user_id', admin.userId);

            if (!active) return;
            if (error) {
                console.error('Gagal memuat state notifikasi admin:', error);
                return;
            }

            const read = new Set();
            const removed = new Set();
            (data || []).forEach((row) => {
                if (row.read_at) read.add(row.notif_key);
                if (row.removed_at) removed.add(row.notif_key);
            });

            setReadIds(read);
            setRemovedIds(removed);
        }

        loadState();
        return () => {
            active = false;
        };
    }, [admin?.userId]);

    // Pendaftaran yang menunggu persetujuan diambil dari backend.
    useEffect(() => {
        if (!admin?.userId || !admin?.regionId) return;

        let active = true;
        const supabase = createClient();

        async function loadRegistrations() {
            const { data, error } = await supabase.rpc('get_admin_pending_registrations');

            if (!active) return;
            if (error) {
                console.error('Gagal memuat pendaftar pending:', error);
                return;
            }

            setBackendRegistrations(
                (data || []).map((item) => ({
                    id: String(item.registration_id),
                    name: item.full_name || 'Pendaftar',
                    type: item.account_category === 'anggota_pkk' ? 'pkk' : 'general',
                    kelurahan: areaLabel,
                    submittedAt: new Date(item.created_at).getTime(),
                    status: 'pending',
                }))
            );
        }

        loadRegistrations();
        return () => {
            active = false;
        };
    }, [admin?.userId, admin?.regionId, areaLabel]);

    // Notifikasi pendaftaran anggota yang menunggu persetujuan.
    const approvals = registrations
        .filter((item) => item.status === 'pending' && item.kelurahan === areaLabel)
        .map((item) => ({
            id: `n-reg-${item.id}`,
            type: 'approval',
            sortAt: toMillis(item.submittedAt),
            title: `Pendaftar ${item.type === 'pkk' ? 'Anggota PKK' : 'Warga Umum'} menunggu persetujuan`,
            body: `${item.name} mendaftar dari ${item.kelurahan}. Setujui dalam 1x24 jam.`,
            time: currentTime ? formatSubmitted(toMillis(item.submittedAt), currentTime) : '',
            to: '/admin/manajemen-pengguna',
        }));

    const evidenceNotifications = aksi.flatMap((action) =>
        (action.evidences || [])
            .filter((evidence) => evidence.status === 'menunggu')
            .map((evidence) => ({
                id: `n-evidence-${evidence.id}`,
                type: 'action',
                sortAt: toMillis(evidence.submittedAt),
                title: 'Bukti aksi menunggu verifikasi',
                body: `${evidence.participantName} mengirim bukti untuk aksi ${action.title}.`,
                time: currentTime ? formatSubmitted(toMillis(evidence.submittedAt), currentTime) : '',
                to: '/admin/actions',
            }))
    );

    const notifications = [
        ...reportNotifications(reports, currentTime),
        ...evidenceNotifications,
        ...approvals,
    ]
        .filter((item) => !removedIds.has(item.id))
        .sort((a, b) => b.sortAt - a.sortAt)
        .map((item) => ({
            ...item,
            read: readIds.has(item.id),
        }));

    const unread = notifications.filter((item) => !item.read).length;

    const persistState = useCallback(async (notifKey, patch) => {
        if (!admin?.userId || !notifKey) return;

        const supabase = createClient();
        const { error } = await supabase
            .from('admin_notification_states')
            .upsert(
                {
                    admin_user_id: admin.userId,
                    notif_key: notifKey,
                    ...patch,
                },
                { onConflict: 'admin_user_id,notif_key' }
            );

        if (error) console.error('Gagal menyimpan state notifikasi admin:', error);
    }, [admin?.userId]);

    const markRead = (id) => {
        setReadIds((current) => new Set(current).add(id));
        void persistState(id, { read_at: new Date().toISOString() });
    };

    const markAllRead = () => {
        setReadIds((current) => {
            const next = new Set(current);
            notifications.forEach((item) => next.add(item.id));
            return next;
        });

        notifications.forEach((item) => {
            void persistState(item.id, { read_at: new Date().toISOString() });
        });
    };

    const remove = (id) => {
        setRemovedIds((current) => new Set(current).add(id));
        void persistState(id, { removed_at: new Date().toISOString() });
    };

    const clearAll = () => {
        setRemovedIds((current) => {
            const next = new Set(current);
            notifications.forEach((item) => next.add(item.id));
            return next;
        });

        const rows = notifications.map((item) => ({
            admin_user_id: admin.userId,
            notif_key: item.id,
            removed_at: new Date().toISOString(),
        }));

        if (rows.length > 0) {
            const supabase = createClient();
            supabase
                .from('admin_notification_states')
                .upsert(rows, { onConflict: 'admin_user_id,notif_key' })
                .then(({ error }) => {
                    if (error) console.error('Gagal menghapus semua notifikasi admin:', error);
                });
        }

        setConfirmClear(false);
    };

    function openNotification(item) {
        markRead(item.id);
        setOpen(false);
        router.push(item.to);
    }

    useEffect(() => {
        if (!open) return;

        const close = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setOpen(false);
                setConfirmClear(false);
            }
        };

        const onKey = (event) => {
            if (event.key === 'Escape') {
                setOpen(false);
                setConfirmClear(false);
            }
        };

        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', onKey);

        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="relative" ref={panelRef}>
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className={cn(
                    'relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                    open ? 'bg-slate-100' : 'hover:bg-slate-100'
                )}
                aria-label={
                    unread
                        ? `Buka notifikasi, ${unread} belum dibaca`
                        : 'Buka notifikasi'
                }
                aria-expanded={open}
            >
                <Bell className="w-4.5 h-4.5 text-slate-500" />

                {unread > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black leading-none text-white">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-11 z-50 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-900">Notifikasi</p>
                            {unread > 0 && (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-black text-red-700">
                                    {unread} belum dibaca
                                </span>
                            )}
                        </div>

                        {unread > 0 && (
                            <button
                                type="button"
                                onClick={markAllRead}
                                className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold text-brand hover:bg-brand-xlight"
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Tandai dibaca
                            </button>
                        )}
                    </div>

                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center px-4 py-10 text-center">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                                <BellOff className="h-5 w-5 text-slate-400" />
                            </span>
                            <p className="mt-3 text-sm font-bold text-slate-800">
                                Tidak ada notifikasi
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Laporan masuk dan pendaftar baru akan muncul di sini.
                            </p>
                        </div>
                    ) : (
                        <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                            {notifications.map((item) => {
                                const m = meta[item.type] || meta.report;

                                return (
                                    <li
                                        key={item.id}
                                        className={cn(
                                            'relative flex gap-2 px-4 py-3 transition-colors hover:bg-slate-50',
                                            !item.read && 'bg-brand-xlight/50'
                                        )}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => openNotification(item)}
                                            className="flex min-w-0 flex-1 gap-3 text-left"
                                            aria-label={`${item.title}${item.read ? '' : ', belum dibaca'}`}
                                        >
                                            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', m.cls)}>
                                                <m.Icon className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className={cn('block text-xs text-slate-900', item.read ? 'font-semibold' : 'font-black')}>
                                                    {item.title}
                                                </span>
                                                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                                                    {item.body}
                                                </span>
                                                <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                                                    {item.time}
                                                </span>
                                            </span>
                                        </button>

                                        <div className="flex shrink-0 items-start gap-1">
                                            {!item.read && (
                                                <button
                                                    type="button"
                                                    onClick={() => markRead(item.id)}
                                                    className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50"
                                                    aria-label={`Tandai dibaca: ${item.title}`}
                                                    title="Tandai dibaca"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => remove(item.id)}
                                                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-600"
                                                aria-label={`Hapus notifikasi: ${item.title}`}
                                                title="Hapus notifikasi"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {!item.read && (
                                            <span className="absolute left-2 top-4 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {notifications.length > 0 && (
                        <div className="border-t border-slate-100 px-4 py-2.5">
                            <button
                                type="button"
                                onClick={() => setConfirmClear(true)}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-red-600"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Hapus semua
                            </button>
                        </div>
                    )}

                    {confirmClear && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/30 p-4">
                            <div
                                className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl"
                                role="alertdialog"
                                aria-modal="true"
                                aria-labelledby="clear-notifications-title"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                                    <Trash2 className="h-5 w-5 text-red-600" />
                                </div>
                                <h3 id="clear-notifications-title" className="mt-3 text-sm font-black text-slate-900">
                                    Hapus semua notifikasi?
                                </h3>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                    Semua notifikasi akan dihapus dari daftar. Data laporan dan aksi tidak akan terpengaruh.
                                </p>
                                <div className="mt-5 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmClear(false)}
                                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAll}
                                        className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700"
                                    >
                                        Hapus semua
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
