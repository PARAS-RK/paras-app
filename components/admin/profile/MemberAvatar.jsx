import { cn } from "@/lib/utils";
import { initials } from "./helpers";

export default function MemberAvatar({ name, large = false }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-brand-light font-black text-brand",
        large ? "h-20 w-20 text-2xl" : "h-10 w-10 text-xs"
      )}
    >
      {initials(name)}
    </span>
  );
}