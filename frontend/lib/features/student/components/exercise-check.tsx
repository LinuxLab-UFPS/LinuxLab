"use client"

import { useState } from "react"
import { Loader2, ShieldCheck } from "lucide-react"
import { cn } from "@shared/lib/utils"
import { ActionButton } from "@shared/components/action-button"
import { CheckList } from "@/lib/features/student/components/check-list"
import { useActivityCheck } from "@/lib/features/student/use-activity-check"
import { useTerminalUI } from "@shared/components/terminal-ui"
import { escribirAviso } from "@shared/lib/terminal-session"

const GRIS = "\x1b[90m"
const NEGRITA = "\x1b[1m"
const FIN = "\x1b[0m"

/**
 * A *comprobación* inside a lesson: the fixed check that measures progress
 * through the course. It is not an activity — activities live outside the
 * syllabus and are solved next to the terminal.
 *
 * Arranca plegada, con el título y un solo botón. Antes se abría con todo a la
 * vista —enunciado, lista de condiciones y botón de comprobar— y la mitad de la
 * gente no entendía qué se esperaba de ella ni dónde hacerlo: leía el enunciado
 * en la página, no encontraba la terminal y se quedaba ahí. «Empezar» la abre,
 * abre la terminal, y escribe el enunciado dentro de ella, de modo que lo que
 * hay que hacer y el sitio donde se hace quedan a la vista a la vez.
 */
export function ExerciseCheck({ slug }: { slug: string }) {
  const { activity, rows, evaluated, passed, loading, checking, check } =
    useActivityCheck(slug)
  const { setOpen } = useTerminalUI()
  const [abierta, setAbierta] = useState(false)

  /* Quien ya la intentó no vuelve a pulsar «Empezar»: la tarjeta sale abierta
     con lo que hizo la última vez. El botón es para la primera. Se deriva y no
     se guarda en un efecto: `evaluated` ya lo dice. */
  const empezada = abierta || evaluated

  if (loading) {
    return (
      <div className="my-8 flex items-center justify-center rounded-xl border border-table-line py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!activity) {
    return <p className="my-8 text-sm text-muted-foreground">Comprobación no disponible.</p>
  }

  const edge = passed ? "border-success/40" : "border-amber-500/30"

  const empezar = () => {
    setAbierta(true)
    setOpen(true)
    /* El enunciado, también dentro de la terminal. Es texto, no un comando: se
       pinta y no se envía a la shell. Sin las condiciones, que son la lista de
       la tarjeta y aquí solo serían ruido. */
    if (activity.instructions) {
      escribirAviso(
        `\r\n${NEGRITA}${activity.title}${FIN}\r\n${GRIS}${activity.instructions}${FIN}\r\n\r\n`,
      )
    }
  }

  return (
    <section className={cn("my-8 rounded-xl border transition-colors", edge)}>
      <header className={cn("flex items-center gap-2.5 border-b px-5 py-3.5", edge)}>
        <ShieldCheck className={cn("h-4 w-4", passed ? "text-success" : "text-amber-500")} />
        <h3 className="text-sm font-semibold text-foreground">Comprobación: {activity.title}</h3>
        {passed && (
          <span className="ml-auto rounded-full border border-success/30 bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            Completada
          </span>
        )}
      </header>

      {!empezada ? (
        <div className="flex justify-center px-5 py-6">
          <ActionButton tone="amber" onClick={empezar}>
            <ShieldCheck className="h-4 w-4" />
            Empezar
          </ActionButton>
        </div>
      ) : (
        <div className="space-y-4 px-5 py-4">
          {activity.instructions && (
            <p className="text-sm leading-relaxed text-foreground">{activity.instructions}</p>
          )}

          <CheckList rows={rows} evaluated={evaluated} />

          <div className="flex items-center gap-3">
            <ActionButton tone={passed ? "emerald" : "amber"} onClick={check} disabled={checking}>
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              {checking ? "Comprobando..." : "Comprobar"}
            </ActionButton>
            <p className="text-xs text-muted-foreground">
              Se revisa tu propio directorio dentro del laboratorio.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
