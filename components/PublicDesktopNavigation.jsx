"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, CheckCheck, CloudSun, FileText, Trash2, X } from "lucide-react";
import { cn } from "../lib/utils";
const desktopNavItems = [
    { name: "Beranda", path: "/home" },
    { name: "Info Cuaca dan Bencana", path: "/info" },
    { name: "Aksi", path: "/aksi" },
    { name: "Pantau Lapor", path: "/reports" },
    { name: "Profil", path: "/profile" },
];
const notificationMeta = {
    report: { Icon: FileText, cls: "bg-pink-xlight text-pink-dark" },
    weather: { Icon: CloudSun, cls: "bg-brand-light text-brand" },
};
// Notifications are informational only; report details live in the separate Pantau Laporan feature.
const initialNotifications = [
    { id: "n1", type: "report", title: "Laporan Anda sudah ditangani oleh BPBD", body: "Terima kasih, laporan genangan air Anda telah selesai ditindaklanjuti.", time: "10 menit lalu", read: false },
    { id: "n2", type: "weather", title: "Info cuaca diperbarui", body: "Prakiraan cuaca wilayah Anda telah tersedia.", time: "1 jam lalu", read: false },
    { id: "n3", type: "report", title: "Laporan sedang ditinjau", body: "Laporan terbaru Anda telah diterima oleh tim PARAS.", time: "Kemarin", read: false },
];
export default function PublicDesktopNavigation({ isMainPage, pathname, }) {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState(initialNotifications);
    const panelRef = useRef(null);
    const unread = notifications.filter((n) => !n.read).length;
    const markRead = (id) => setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const markAllRead = () => setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    const clearOne = (id) => setNotifications((list) => list.filter((n) => n.id !== id));
    useEffect(() => {
        if (!notificationsOpen)
            return;
        const close = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target))
                setNotificationsOpen(false);
        };
        const onKey = (e) => e.key === "Escape" && setNotificationsOpen(false);
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", onKey);
        };
    }, [notificationsOpen]);
    return (<div className={cn("items-center gap-2 lg:flex", pathname === "/home" ? "flex" : "hidden")}>
      {isMainPage && (<nav className="hidden items-center justify-end gap-0.5 lg:flex" aria-label="Navigasi utama">
          {desktopNavItems.map((item) => {
                const active = pathname === item.path || pathname.startsWith(item.path + "/");
                return (<Link key={item.name} href={item.path} className={cn("rounded-full px-3 py-2 text-xs font-bold transition-colors xl:px-4 xl:text-sm", active
                        ? "bg-brand text-white"
                        : "text-muted-foreground hover:bg-brand-xlight hover:text-brand")}>
                {item.name}
              </Link>);
            })}
        </nav>)}
      <div className="relative" ref={panelRef}>
        <button type="button" onClick={() => setNotificationsOpen((open) => !open)} className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-white text-foreground transition-colors hover:border-brand/30 hover:bg-brand-xlight hover:text-brand" aria-label={unread ? `Buka notifikasi, ${unread} belum dibaca` : "Buka notifikasi"} aria-expanded={notificationsOpen}>
          <Bell className="h-4.5 w-4.5"/>
          {unread > 0 && (<span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-pink px-1 text-[10px] font-black leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>)}
        </button>
        {notificationsOpen && (<div className="absolute right-0 top-12 z-50 w-[calc(100vw-2rem)] max-w-80 overflow-hidden rounded-2xl border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-foreground">Notifikasi</p>
                {unread > 0 && (<span className="rounded-full bg-pink-xlight px-2 py-0.5 text-[10px] font-black text-pink-dark">
                    {unread} belum dibaca
                  </span>)}
              </div>
              {unread > 0 && (<button type="button" onClick={markAllRead} className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold text-brand hover:bg-brand-xlight">
                  <CheckCheck className="h-3.5 w-3.5"/> Tandai dibaca
                </button>)}
            </div>
            {notifications.length === 0 ? (<div className="flex flex-col items-center px-4 py-10 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted"><BellOff className="h-5 w-5 text-muted-foreground"/></span>
                <p className="mt-3 text-sm font-bold text-foreground">Tidak ada notifikasi</p>
                <p className="mt-1 text-xs text-muted-foreground">Notifikasi baru akan muncul di sini.</p>
              </div>) : (<ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {notifications.map((n) => {
                    const meta = notificationMeta[n.type];
                    return (<li key={n.id} className={cn("group relative flex gap-3 px-4 py-3 transition-colors", n.read ? "bg-white" : "bg-brand-xlight/50")}>
                      <button type="button" onClick={() => markRead(n.id)} className="flex min-w-0 flex-1 gap-3 text-left" aria-label={`${n.title}${n.read ? "" : ", belum dibaca"}`}>
                        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.cls)}><meta.Icon className="h-4 w-4"/></span>
                        <span className="min-w-0 flex-1 pr-5">
                          <span className={cn("block text-xs text-foreground", n.read ? "font-semibold" : "font-black")}>{n.title}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{n.body}</span>
                          <span className="mt-1 block text-[10px] font-semibold text-muted-foreground/80">{n.time}</span>
                        </span>
                      </button>
                      {!n.read && <span className="absolute right-10 top-4 h-2 w-2 rounded-full bg-pink" aria-hidden/>}
                      <button type="button" onClick={() => clearOne(n.id)} className="absolute right-3 top-2.5 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Hapus notifikasi: ${n.title}`}>
                        <X className="h-3.5 w-3.5"/>
                      </button>
                    </li>);
                })}
              </ul>)}
            {notifications.length > 0 && (<div className="border-t border-border px-4 py-2.5">
                <button type="button" onClick={() => setNotifications([])} className="flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5"/> Hapus semua
                </button>
              </div>)}
          </div>)}
      </div>
    </div>);
}
