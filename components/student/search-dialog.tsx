"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MonitorPlay, FileText, SquareTerminal, Target, BookOpen } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import type { SearchItem } from "@/lib/features/shared/lessons"

const MAX_RESULTS = 5

const KIND = {
  modulo: { icon: BookOpen, className: "text-primary" },
  subtema: { icon: FileText, className: "text-sky-500" },
  simulador: { icon: MonitorPlay, className: "text-emerald-500" },
} as const

/**
 * Header search: a centered modal that lists up to 5 matching simulators and
 * subtopics as you type, and quick links when the field is empty. Filtering is
 * ours (cmdk's own filter is off) so we can cap the results.
 */
export function SearchDialog({
  items,
  open,
  onOpenChange,
}: {
  items: SearchItem[]
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const results =
    q === ""
      ? []
      : items
          .filter(
            (i) =>
              i.title.toLowerCase().includes(q) ||
              i.context.toLowerCase().includes(q),
          )
          .slice(0, MAX_RESULTS)

  const go = (href: string) => {
    onOpenChange(false)
    setQuery("")
    router.push(href)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) setQuery("")
      }}
    >
      <DialogContent className="max-w-xl overflow-hidden p-0">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar simuladores, subtemas..."
          />
          <CommandList className="max-h-80">
            {q === "" ? (
              <CommandGroup heading="Ir a">
                <CommandItem value="go-terminal" onSelect={() => go("/terminal")}>
                  <SquareTerminal className="text-primary" />
                  Terminal
                </CommandItem>
                <CommandItem value="go-simulators" onSelect={() => go("/simulators")}>
                  <MonitorPlay className="text-emerald-500" />
                  Simuladores
                </CommandItem>
                <CommandItem value="go-activities" onSelect={() => go("/activities")}>
                  <Target className="text-amber-500" />
                  Actividades
                </CommandItem>
              </CommandGroup>
            ) : results.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Sin resultados para &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <CommandGroup heading="Resultados">
                {results.map((item) => {
                  const k = KIND[item.kind]
                  return (
                    <CommandItem
                      key={item.href}
                      value={item.href}
                      onSelect={() => go(item.href)}
                    >
                      <k.icon className={cn(k.className)} />
                      <span className="truncate">{item.title}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {item.context}
                      </span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
