import { cn } from "@/lib/utils"

const VARIANT: Record<"docente" | "admin", string> = {
  docente: "border-amber-500/40 bg-amber-500/10 text-amber-500",
  admin: "border-violet-500/40 bg-violet-500/10 text-violet-400",
}

/** Small role badge shown next to the logo in the teacher/admin headers. */
export function RoleTag({ variant }: { variant: "docente" | "admin" }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        VARIANT[variant],
      )}
    >
      {variant}
    </span>
  )
}
