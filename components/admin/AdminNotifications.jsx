"use client";

import { useEffect, useRef, useState } from 'react';
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
    X
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { areaLabel } from '@/lib/currentUser';
import { formatSubmitted, useRegistrations } from '@/lib/memberStore';
import { useAksiState } from '@/lib/aksiStore';

const meta = {
    emergency: {
        Icon: Siren,
        cls: 'bg-red-50 text-red-600'
    },
    report: {
        Icon: FileWarning,
        cls: 'bg-amber-50 text-amber-700'
    },
    approval: {
        Icon: UserPlus,
        cls: 'bg-pink-xlight text-pink-dark'
    },
    action: {
        Icon: Leaf,
        cls: 'bg-brand-light text-brand'
    },
};

// Data contoh untuk prototipe frontend
const seed = [
    {
        id: 'n-emg-1',
        type: 'emergency',
        title: 'Laporan darurat masuk',
        body: 'Banjir setinggi 50 cm di RT 04 / RW 05 perlu diteruskan ke BPBD.',
        time: '5 menit lalu',
        sortAt: Date.now() - 5 * 60 * 1000,
        to: '/admin/ai-assistant?queue=emergency'
    },
    {
        id: 'n-rep-1',
        type: 'report',
        title: 'Laporan baru diterima',
        body: 'Tumpukan sampah di Jl. Melati RW 03 masuk ke Tabungan Aksi.',
        time: '25 menit lalu',
        sortAt: Date.now() - 25 * 60 * 1000,
        to: '/admin/actions/savings'
    },
    {
        id: 'n-act-1',
        type: 'action',
        title: 'Bukti aksi menunggu verifikasi',
        body: '3 foto bukti baru dari peserta Gotong Royong Saluran Air RT 04.',
        time: '1 jam lalu',
        sortAt: Date.now() - 60 * 60 * 1000,
        to: '/admin/actions'
    },
    {
        id: 'n-act-2',
        type: 'action',
        title: 'Draf aksi komunitas siap terbit',
        body: 'Asisten AI menyusun draf aksi dari 2 laporan pada klaster drainase.',
        time: 'Kemarin',
        sortAt: Date.now() - 24 * 60 * 60 * 1000,
        read: true,
        to: '/admin/ai-assistant'
    },
];

export default function AdminNotifications() {
    const router = useRouter();
    const registrations = useRegistrations();
    const { aksi } = useAksiState();
    const [open, setOpen] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    const [readIds, setReadIds] = useState(
        () => new Set(seed.filter((n) => n.read).map((n) => n.id))
    );

    const [removedIds, setRemovedIds] = useState(() => new Set());

    const panelRef = useRef(null);

    // Notifikasi pendaftaran anggota yang menunggu persetujuan
    const approvals = registrations
        .filter(
            (r) =>
                r.status === 'pending' &&
                r.kelurahan === areaLabel
        )
        .map((r) => ({
            id: `n-reg-${r.id}`,
            type: 'approval',
            sortAt: r.submittedAt,
            title: `Pendaftar ${r.type === 'pkk' ? 'Anggota PKK' : 'Warga Umum'} menunggu persetujuan`,
            body: `${r.name} mendaftar dari ${r.kelurahan}. Setujui dalam 1x24 jam.`,
            time: formatSubmitted(r.submittedAt),
            to: '/admin/manajemen-pengguna',
        }));

    const evidenceNotifications = aksi.flatMap((action) =>
    (action.evidences || [])
        .filter((e) => e.status === 'menunggu')
        .map((e) => ({
            id: `n-evidence-${e.id}`,
            type: 'action',
            sortAt: e.submittedAt,
            title: 'Bukti aksi menunggu verifikasi',
            body: `${e.participantName} mengirim bukti untuk aksi ${action.title}.`,
            time: new Date(e.submittedAt).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
}),
            to: '/admin/actions',
        }))
);
    // Gabungkan dan urutkan seluruh notifikasi terbaru
    const notifications = [
    ...seed.filter((n) => n.id !== 'n-act-1'),
    ...evidenceNotifications,
    ...approvals,
]
        .filter((n) => !removedIds.has(n.id))
        .sort((a, b) => new Date(b.sortAt) - new Date(a.sortAt))
        .map((n) => ({
            ...n,
            read: readIds.has(n.id)
        }));

    const unread = notifications.filter((n) => !n.read).length;

    // Tandai satu notifikasi sebagai dibaca
    const markRead = (id) => {
        setReadIds((current) => {
            const next = new Set(current);
            next.add(id);
            return next;
        });
    };

    // Tandai semua notifikasi sebagai dibaca
    const markAllRead = () => {
        setReadIds((current) => {
            const next = new Set(current);

            notifications.forEach((n) => {
                next.add(n.id);
            });

            return next;
        });
    };

    // Hapus satu notifikasi
    const remove = (id) => {
        setRemovedIds((current) => {
            const next = new Set(current);
            next.add(id);
            return next;
        });
    };

    // Hapus seluruh notifikasi setelah konfirmasi
    const clearAll = () => {
        setRemovedIds((current) => {
            const next = new Set(current);

            notifications.forEach((n) => {
                next.add(n.id);
            });

            return next;
        });

        setConfirmClear(false);
    };

    // Buka halaman yang berkaitan dengan notifikasi
    function openNotification(n) {
        markRead(n.id);
        setOpen(false);
        router.push(n.to);
    }

    // Menutup dropdown ketika klik di luar atau tekan Escape
    useEffect(() => {
        if (!open) return;

        const close = (e) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target)
            ) {
                setOpen(false);
                setConfirmClear(false);
            }
        };

        const onKey = (e) => {
            if (e.key === 'Escape') {
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
            {/* Tombol lonceng */}
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

            {/* Dropdown */}
            {open && (
                <div className="absolute right-0 top-11 z-50 w-[calc(100vw-2rem)] max-w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-900">
                                Notifikasi
                            </p>

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

                    {/* Daftar notifikasi */}
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
                            {notifications.map((n) => {
                                const m = meta[n.type];

                                return (
                                    <li
                                        key={n.id}
                                        className={cn(
                                            'relative flex gap-2 px-4 py-3 transition-colors hover:bg-slate-50',
                                            !n.read && 'bg-brand-xlight/50'
                                        )}
                                    >
                                        {/* Isi notifikasi */}
                                        <button
                                            type="button"
                                            onClick={() => openNotification(n)}
                                            className="flex min-w-0 flex-1 gap-3 text-left"
                                            aria-label={`${n.title}${n.read ? '' : ', belum dibaca'}`}
                                        >
                                            <span
                                                className={cn(
                                                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                                                    m.cls
                                                )}
                                            >
                                                <m.Icon className="h-4 w-4" />
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={cn(
                                                        'block text-xs text-slate-900',
                                                        n.read
                                                            ? 'font-semibold'
                                                            : 'font-black'
                                                    )}
                                                >
                                                    {n.title}
                                                </span>

                                                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                                                    {n.body}
                                                </span>

                                                <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                                                    {n.time}
                                                </span>
                                            </span>
                                        </button>

                                        {/* Tombol aksi notifikasi */}
                                        <div className="flex shrink-0 items-start gap-1">
                                            {!n.read && (
                                                <button
                                                    type="button"
                                                    onClick={() => markRead(n.id)}
                                                    className="flex h-6 w-6 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50"
                                                    aria-label={`Tandai dibaca: ${n.title}`}
                                                    title="Tandai dibaca"
                                                >
                                                    <Check className="h-3.5 w-3.5" />
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => remove(n.id)}
                                                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-red-600"
                                                aria-label={`Hapus notifikasi: ${n.title}`}
                                                title="Hapus notifikasi"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>

                                        {!n.read && (
                                            <span
                                                className="absolute left-2 top-4 h-2 w-2 rounded-full bg-red-500"
                                                aria-hidden="true"
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {/* Footer */}
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

                    {/* Konfirmasi hapus semua */}
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

                                <h3
                                    id="clear-notifications-title"
                                    className="mt-3 text-sm font-black text-slate-900"
                                >
                                    Hapus semua notifikasi?
                                </h3>

                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                    Semua notifikasi akan dihapus dari daftar.
                                    Data laporan dan aksi tidak akan terpengaruh.
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