"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MonitorPlay, FileText, SquareTerminal, Target, BookOpen } from "lucide-react"
import { Dialog, DialogContent } from "@shared/components/ui/dialog"
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@shared/components/ui/command"
import { cn } from "@shared/lib/utils"
import type { SearchItem } from "@shared/lib/content/lessons"

const MAX_RESULTS = 5

const KIND = {
  modulo: { icon: BookOpen, className: "text-primary" },
  subtema: { icon: FileText, className: "text-primary" },
  simulador: { icon: MonitorPlay, className: "text-primary" },
  actividad: { icon: Target, className: "text-primary" },
} as const

/** Soft neutral highlight for the active row, instead of the solid red accent
 *  (which also hid the red Terminal icon). */
const ITEM_HL = "data-[selected=true]:bg-secondary data-[selected=true]:text-foreground"

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
                <CommandItem
                  value="go-terminal"
                  className={ITEM_HL}
                  onSelect={() => go("/terminal")}
                >
                  <SquareTerminal className="text-primary" />
                  Terminal
                </CommandItem>
                <CommandItem
                  value="go-simulators"
                  className={ITEM_HL}
                  onSelect={() => go("/simulators")}
                >
                  <MonitorPlay className="text-primary" />
                  Simuladores
                </CommandItem>
                <CommandItem
                  value="go-activities"
                  className={ITEM_HL}
                  onSelect={() => go("/activities")}
                >
                  <Target className="text-primary" />
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
                      className={ITEM_HL}
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
