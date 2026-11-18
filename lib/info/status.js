export const STATUS = {
    normal: { kartu: 'border-border bg-white', lencana: null },
    ada: {
      kartu: 'border-amber-200 bg-amber-50',
      lencana: { teks: 'Perlu perhatian', kelas: 'bg-amber-400 text-slate-900' },
    },
    aman: {
      kartu: 'border-brand-xlight bg-brand-light',
      lencana: { teks: 'Aman', kelas: 'bg-brand text-white' },
    },
    tidak_pasti: {
      kartu: 'border-border bg-muted',
      lencana: { teks: 'Belum bisa dipastikan', kelas: 'bg-slate-600 text-white' },
    },
  };
  
  export const URUTAN = { ada: 0, tidak_pasti: 1, normal: 2, aman: 3 };