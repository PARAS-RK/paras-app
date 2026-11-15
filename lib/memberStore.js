import { useSyncExternalStore } from 'react';

/** Member registrations awaiting approval by the PKK admin of the same kelurahan. */
export const APPROVAL_WINDOW_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'paras-member-registrations';
const HOUR = 60 * 60 * 1000;

/* Contact for each kelurahan's PKK admin. */
export const pkkAdminContacts = {
    'Kel. Kebayoran Baru': { name: 'Ibu Ratna Sari', role: 'Ketua PKK Kel. Kebayoran Baru', phone: '0815-4567-8901', wa: '6281545678901' },
};
export const DEFAULT_CONTACT = { name: 'Admin PKK Kelurahan', role: 'Pengurus PKK setempat', phone: '0811-1000-2024', wa: '6281110002024' };
export const contactFor = (kelurahan) => pkkAdminContacts[kelurahan] || DEFAULT_CONTACT;

function seed() {
    const now = Date.now();
    return [
        { id: 'reg-101', name: 'Ibu Lina Marlina', email: 'lina.marlina@gmail.com', phone: '0813-2211-4455', type: 'pkk', province: 'DKI Jakarta', kecamatan: 'Kebayoran Baru', kelurahan: 'Kel. Kebayoran Baru', submittedAt: now - 2 * HOUR, status: 'pending' },
        { id: 'reg-102', name: 'Bapak Andi Saputra', email: 'andi.saputra@yahoo.com', phone: '0857-3321-9087', type: 'general', province: 'DKI Jakarta', kecamatan: 'Kebayoran Baru', kelurahan: 'Kel. Kebayoran Baru', submittedAt: now - 9 * HOUR, status: 'pending' },
        { id: 'reg-103', name: 'Ibu Wati Susanti', email: 'wati.susanti@gmail.com', phone: '0821-7788-1122', type: 'pkk', province: 'DKI Jakarta', kecamatan: 'Kebayoran Baru', kelurahan: 'Kel. Kebayoran Baru', submittedAt: now - 21 * HOUR, status: 'pending' },
        { id: 'reg-104', name: 'Mbak Fitri Handayani', email: 'fitri.h@gmail.com', phone: '0838-5566-7788', type: 'general', province: 'DKI Jakarta', kecamatan: 'Kebayoran Baru', kelurahan: 'Kel. Kebayoran Baru', submittedAt: now - 27 * HOUR, status: 'pending' },
        { id: 'reg-099', name: 'Ibu Nur Hidayah', email: 'nur.hidayah@gmail.com', phone: '0812-4455-6677', type: 'pkk', province: 'DKI Jakarta', kecamatan: 'Kebayoran Baru', kelurahan: 'Kel. Kebayoran Baru', submittedAt: now - 50 * HOUR, status: 'approved', decidedAt: now - 40 * HOUR },
    ];
}

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore malformed storage */ }
    return seed();
}

let state = load();
const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
function set(next) {
    state = next;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
    emit();
}
const subscribe = (l) => {
    listeners.add(l);
    // Keep other tabs (e.g. admin and resident) in sync.
    const onStorage = (e) => { if (e.key === STORAGE_KEY) { state = load(); emit(); } };
    window.addEventListener('storage', onStorage);
    return () => { listeners.delete(l); window.removeEventListener('storage', onStorage); };
};

export const useRegistrations = () => useSyncExternalStore(subscribe, () => state, () => state);
export const useRegistration = (id) => useRegistrations().find((r) => r.id === id);

export function submitRegistration(input) {
    const id = `reg-${Date.now().toString(36)}`;
    set([{ ...input, id, submittedAt: Date.now(), status: 'pending' }, ...state]);
    return id;
}
const decide = (id, patch) => set(state.map((r) => (r.id === id ? { ...r, ...patch, decidedAt: Date.now() } : r)));
export const approveRegistration = (id) => decide(id, { status: 'approved' });
export const rejectRegistration = (id, reason) => decide(id, { status: 'rejected', rejectReason: reason });

export const deadlineOf = (r) => r.submittedAt + APPROVAL_WINDOW_MS;
export function formatRemaining(ms) {
    const abs = Math.abs(ms);
    const h = Math.floor(abs / HOUR);
    const m = Math.floor((abs % HOUR) / 60000);
    return h > 0 ? `${h} jam ${m} menit` : `${m} menit`;
}
export function formatSubmitted(ts, currentTime) {
    if (currentTime == null) return '';

    const diff = currentTime - ts;
    if (diff < HOUR) return `${Math.max(1, Math.floor(diff / 60000))} menit lalu`;
    if (diff < 24 * HOUR) return `${Math.floor(diff / HOUR)} jam lalu`;
    return `${Math.floor(diff / (24 * HOUR))} hari lalu`;
}
