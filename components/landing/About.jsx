import { cn } from "@/lib/utils";
import { aboutBadges } from "./data";

export default function About() {
  return (
    <section id="tentang" className="px-5 pt-10 lg:px-8 lg:pt-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Tentang PARAS</p>
        <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
          Perubahan besar tumbuh dari orang-orang yang peduli pada tempat mereka tinggal.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          PARAS membantu komunitas memahami risiko, membagikan kondisi di lapangan, dan
          mengubah kepedulian menjadi langkah yang relevan bagi lingkungan setempat.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {aboutBadges.map(({ icon: Icon, label, className }) => (
            <span
              key={label}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
                className
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}