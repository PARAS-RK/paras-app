import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-5 overflow-hidden rounded-3xl bg-secondary p-6 text-secondary-foreground sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="absolute -right-20 -top-20 size-56 rounded-full border-2 border-white/15" />

        <div className="relative max-w-xl">
          <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">Mulai dari satu langkah kecil untuk lingkungan terdekat.</h2>
          <p className="mt-2 text-sm opacity-80">Buat akun gratis dan temukan aksi pertama Anda.</p>
        </div>

        <Link href="/pkk/community" className="relative inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-secondary transition-colors hover:bg-white/90">
          Daftarkan Komunitas PKK <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
