const TZ = 'Asia/Jakarta';

export const berpotensiTsunami = (p) => Boolean(p) && !/tidak/i.test(p);

/** ISO -> "17 Nov, 14.05 WIB" */
export function fmtWaktu(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return (
    d.toLocaleString('id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ,
    }) + ' WIB'
  );
}

/** Date -> "13.00" */
export function fmtJam(date) {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}

export function susunPesan({ judul, wilayah, ringkasan, baris = [], diambil }) {
  const kepala = wilayah ? `*${judul}, ${wilayah}*` : `*${judul}*`;
  const akhir = [...baris.filter(Boolean), `${diambil ? `Per ${diambil}. ` : ''}Sumber: BMKG`].join('\n');
  return [kepala, ringkasan, akhir].filter(Boolean).join('\n\n');
}

export async function salinTeks(teks) {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = teks;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}