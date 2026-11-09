import Link from "next/link";

import { cn } from "@/lib/utils";
import { features } from "./data";

export default function Features() {
  return (
    <section id="fitur" className="px-4 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Layanan PARAS</p>
        <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
          Lapor. Pantau. Bertindak
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-3 lg:gap-3">
          {features.map((f, i) => {
            const isLastOdd = i === features.length - 1 && features.length % 2 === 1;
            return (
              <Link
                key={f.title}
                href="/login"
                aria-label={`${f.title}, masuk untuk membuka`}
                className={cn(
                  "block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md",
                  f.highlight
                    ? "border-secondary bg-secondary text-secondary-foreground"
                    : "border-border bg-card text-card-foreground",
                  isLastOdd && "col-span-2 lg:col-span-1"
                )}
              >
                <div className="flex items-center justify-between">
                  <f.icon className={cn("size-6", !f.highlight && "text-primary")} />
                  <span className={cn("text-xs font-black", f.highlight ? "opacity-60" : "text-muted-foreground/50")}>
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-black leading-snug sm:text-base">{f.title}</h3>
                <p
                  className={cn(
                    "mt-1.5 hidden text-xs leading-relaxed sm:block",
                    f.highlight ? "opacity-80" : "text-muted-foreground"
                  )}
                >
                  {f.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}