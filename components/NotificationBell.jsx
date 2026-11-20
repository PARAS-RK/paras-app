'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ClipboardCheck, CloudSun, Info, Leaf, ThumbsUp, Trash2, X } from 'lucide-react';

const POLL_MS = 60 * 1000;

const TYPE_META = {
  report_status: { title: 'Status laporan diperbarui', icon: ClipboardCheck, tone: 'bg-pink-100 text-[#E6008A]' },
  report_support: { title: 'Laporan Anda mendapat dukungan', icon: ThumbsUp, tone: 'bg-pink-100 text-[#E6008A]' },
  action: { title: 'Info aksi komunitas', icon: Leaf, tone: 'bg-[#159038]/10 text-[#159038]' },
  weather_alert: { title: 'Peringatan cuaca', icon: CloudSun, tone: 'bg-[#159038]/10 text-[#159038]' },
  system: { title: 'Info sistem', icon: Info, tone: 'bg-gray-100 text-gray-600' },
};

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Kemarin';
  if (d < 7) return `${d} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function NotificationBell() {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch (e) {
      console.error('Gagal memuat notifikasi:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Kirim perubahan ke server; kalau gagal, muat ulang agar tampilan kembali sesuai data
  const send = async (method, body) => {
    try {
      const res = await fetch('/api/notifications', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      console.error('Gagal memperbarui notifikasi:', e);
      load();
    }
  };

  // Klik notifikasi
  const markRead = (n) => {
    if (n.read_at) return;
    setItems((prev) => prev.map((x) => (x.notif_id === n.notif_id ? { ...x, read_at: new Date().toISOString() } : x)));
    setUnread((c) => Math.max(0, c - 1));
    send('PATCH', { id: n.notif_id });
  };

  const markAllRead = () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((x) => (x.read_at ? x : { ...x, read_at: now })));
    setUnread(0);
    send('PATCH', { all: true });
  };

  const remove = (n) => {
    setItems((prev) => prev.filter((x) => x.notif_id !== n.notif_id));
    if (!n.read_at) setUnread((c) => Math.max(0, c - 1));
    send('DELETE', { id: n.notif_id });
  };

  const clearAll = () => {
    setItems([]);
    setUnread(0);
    send('DELETE', { all: true });
  };

  return (
    <div ref={wrapRef} className="relative ml-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : 'Notifikasi'}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-[#E6008A] px-0.5 text-[9px] font-bold leading-none text-white">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold text-gray-900">Notifikasi</p>
              {unread > 0 && <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-semibold text-[#E6008A]">{unread} belum dibaca</span>}
            </div>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-left text-xs font-semibold leading-tight text-[#159038] hover:underline">
                <CheckCheck className="h-4 w-4 shrink-0" aria-hidden />
                <span>
                  Tandai
                  <br />
                  dibaca
                </span>
              </button>
            )}
          </div>

          {/* Daftar */}
          <div className="max-h-[60vh] overflow-y-auto border-t border-gray-100">
            {!loaded ? (
              <p className="px-4 py-10 text-center text-sm text-gray-500">Memuat…</p>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-gray-500">
                <Bell className="h-8 w-8 text-gray-300" aria-hidden />
                <p className="text-sm">Belum ada notifikasi</p>
              </div>
            ) : (
              <ul>
                {items.map((n) => {
                  const meta = TYPE_META[n.notif_type] ?? TYPE_META.system;
                  const Icon = meta.icon;
                  const isUnread = !n.read_at;
                  return (
                    <li key={n.notif_id} className={`flex items-start gap-1 border-b border-gray-100 last:border-b-0 ${isUnread ? 'bg-emerald-50/70' : 'bg-white'}`}>
                      <button type="button" onClick={() => markRead(n)} className={`flex min-w-0 flex-1 gap-3 py-3.5 pl-4 text-left ${isUnread ? 'cursor-pointer' : 'cursor-default'}`}>
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${meta.tone}`}>
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-gray-900">{meta.title}</span>
                          <span className="mt-0.5 block text-sm leading-snug text-gray-600">{n.notif_content}</span>
                          <span className="mt-1.5 block text-xs text-gray-500">{timeAgo(n.created_at)}</span>
                        </span>
                      </button>

                      <div className="flex shrink-0 items-center gap-1 pr-3 pt-3.5">
                        {isUnread && <span className="h-2 w-2 rounded-full bg-[#E6008A]" aria-label="Belum dibaca" />}
                        <button
                          type="button"
                          onClick={() => remove(n)}
                          aria-label="Hapus notifikasi"
                          className="flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200/70 hover:text-gray-700"
                        >
                          <X className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <button type="button" onClick={clearAll} className="flex w-full items-center justify-center gap-2 border-t border-gray-100 py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50">
              <Trash2 className="h-4 w-4" aria-hidden />
              Hapus semua
            </button>
          )}
        </div>
      )}
    </div>
  );
}
