import Link from "next/link";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function Hero() {
  return (
    <section id="beranda" className="px-4 pt-3 sm:px-6 lg:px-8">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-border bg-primary/5 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/10" />

        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
              <Sparkles className="size-3.5" /> Aksi iklim dimulai dari sekitar kita
            </span>

            <h1 className="text-[2rem] font-black leading-[1.05] tracking-tight sm:text-5xl">
              Perempuan Bergerak.
              <span className="block text-primary">Lingkungan Bertumbuh.</span>
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            PARAS mempertemukan informasi, laporan warga, dan kekuatan komunitas PKK
            untuk membangun lingkungan yang lebih siap menghadapi perubahan iklim.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:gap-3">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full px-5 hover:bg-primary-hover"
                )}
              >
                Masuk <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full border-foreground px-5"
                )}
              >
                Daftar Akun
              </Link>
            </div>
          </div>

          {/* Kartu dekoratif: hanya desktop */}
          <div className="relative hidden min-h-60 flex-col justify-between overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground lg:flex">
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-white/10" />
            <Leaf className="relative size-8" strokeWidth={2.5} />
            <div className="relative">
              <p className="text-5xl font-black tracking-tight">1 aksi</p>
              <p className="mt-2 max-w-xs text-sm font-bold opacity-75">
                dapat menginspirasi satu komunitas untuk ikut bergerak.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}