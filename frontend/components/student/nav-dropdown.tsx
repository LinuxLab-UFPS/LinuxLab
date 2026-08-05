"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const TONE = {
  emerald: {
    active: "bg-emerald-500/15 text-emerald-400",
    hover: "text-white/60 hover:bg-emerald-500/15 hover:text-emerald-400",
    item: "hover:bg-emerald-500/15 hover:text-emerald-400",
  },
  amber: {
    active: "bg-amber-500/15 text-amber-400",
    hover: "text-white/60 hover:bg-amber-500/15 hover:text-amber-400",
    item: "hover:bg-amber-500/15 hover:text-amber-400",
  },
} as const

export interface NavEntry {
  key: string
  title: string
  href: string
}

/**
 * A nav item that is also a shortcut: the label goes to the section, and hovering
 * it drops a short list of what is inside. The list is capped — once it fills up
 * there is a "Ver más" instead, because the point is a shortcut, not a catalog.
 */
export function NavDropdown({
  href,
  label,
  icon: Icon,
  itemIcon: ItemIcon,
  tone,
  entries,
  max = 4,
  pathname,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  itemIcon: React.ComponentType<{ className?: string }>
  tone: keyof typeof TONE
  entries: NavEntry[]
  max?: number
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const active = pathname === href || pathname.startsWith(href + "/")
  const shown = entries.slice(0, max)
  const t = TONE[tone]

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          active ? t.active : t.hover,
        )}
      >
        <Icon className="h-4 w-4" />
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
        />
      </Link>

      {open && shown.length > 0 && (
        <div className="absolute left-0 top-full z-50 pt-2">
          <div className="w-64 animate-in fade-in-0 slide-in-from-top-1 rounded-xl border border-white/10 bg-[#0f0f11] p-1.5 shadow-2xl shadow-black/60 duration-150">
            {shown.map((entry) => (
              <Link
                key={entry.key}
                href={entry.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-white/90 transition-colors",
                  t.item,
                )}
              >
                <ItemIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{entry.title}</span>
              </Link>
            ))}
            {entries.length >= max && (
              <Link
                href={href}
                className="mt-1 flex items-center justify-center rounded-lg px-3 py-2 text-xs font-medium text-white/50 transition-colors hover:bg-white/5 hover:text-white/80"
              >
                Ver más
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
