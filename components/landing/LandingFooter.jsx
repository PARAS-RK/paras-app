import Image from 'next/image';
import Link from 'next/link';
import { Mail, MapPin, Phone } from 'lucide-react';

import logo from '../../public/logo.svg';

const socials = [
  {
    label: 'Instagram',
    d: 'M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.7a5.1 5.1 0 100 10.2 5.1 5.1 0 000-10.2zm0 8.4a3.3 3.3 0 110-6.6 3.3 3.3 0 010 6.6zm5.3-9.8a1.2 1.2 0 100 2.4 1.2 1.2 0 000-2.4z',
  },
  { label: 'Facebook', d: 'M13.5 21.9v-8.1h2.7l.4-3.2h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V4.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v2.4H7.6v3.2h2.8v8.1h3.1z' },
  {
    label: 'YouTube',
    d: 'M23 7.2a3 3 0 00-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 001 7.2C.5 9.1.5 12 .5 12s0 2.9.5 4.8a3 3 0 002.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 002.1-2.1c.5-1.9.5-4.8.5-4.8s0-2.9-.5-4.8zM9.7 15.1V8.9l5.8 3.1-5.8 3.1z',
  },
];

const columns = [
  {
    title: 'Platform',
    links: [
      { label: 'Tentang', href: '/#tentang' },
      { label: 'Fitur', href: '/#fitur' },
      { label: 'Daftar Akun', href: '/register' },
      { label: 'Daftarkan Komunitas PKK', href: '/register-community' },
    ],
  },
  {
    title: 'Akun',
    links: [
      { label: 'Masuk', href: '/login' },
      { label: 'Masuk Admin', href: '/admin/login' },
    ],
  },
];

const legalLinks = ['Kebijakan Privasi', 'Syarat Penggunaan', 'Peta Situs'];

const linkCls = 'text-sm text-muted-foreground transition-colors hover:text-brand';

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-border bg-white">
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-8 px-5 py-8 lg:grid-cols-[1.4fr_0.8fr_0.7fr_1fr] lg:gap-8 lg:px-8 lg:py-12">
        {/* Brand + sosmed */}
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <Image src={logo} alt="PARAS" style={{ width: 'auto' }} className="h-9" />
            <p className="text-xl font-bold text-gray-800">Paras</p>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Platform perempuan untuk aksi iklim dan respons bencana berbasis komunitas.</p>
          <div className="mt-5 flex items-center gap-2">
            {socials.map((s) => (
              <a key={s.label} href="#" aria-label={s.label} className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-brand hover:bg-brand hover:text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                  <path d={s.d} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        {/* Kolom link */}
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-black text-foreground">{col.title}</p>
            <ul className="mt-3 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkCls}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Kontak */}
        <div className="col-span-2 lg:col-span-1">
          <p className="text-sm font-black text-foreground">Hubungi Kami</p>
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              <a href="tel:+622112345678" className="hover:text-brand">
                (021) 1234 5678
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              <a href="mailto:parasapp.company@gmail.com" className="hover:text-brand">
                parasapp.company@gmail.com
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              Jakarta, Indonesia
            </li>
          </ul>
        </div>
      </div>

      {/* Bar bawah */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
          {/* <p>© {new Date().getFullYear()} PARAS. Hak cipta dilindungi.</p> */}
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((label) => (
              <a key={label} href="#" className="hover:text-brand">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
