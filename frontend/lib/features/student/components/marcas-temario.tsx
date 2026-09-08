"use client"

import { CheckCircle2, Circle, Gamepad2, Target } from "lucide-react"
import { cn } from "@shared/lib/utils"

/**
 * Las marcas del temario, en un solo sitio.
 *
 * La barra lateral y el mapa del curso muestran lo mismo, y hasta ahora cada
 * uno lo dibujaba a su manera: burbujas de 24 y de 36 px, viñetas de icono y de
 * punto, cifras a 12 y a 36 px. Se leían como dos aplicaciones distintas, asi
 * que el tratamiento vive aqui y ambos lo usan.
 *
 * Los tres estados y su lectura:
 *   activo    el rojo de la marca, es donde esta el estudiante
 *   hecho     verde, ya no pide atencion
 *   pendiente neutro, es lo que queda por hacer
 */

/** La burbuja numerada de un tema. */
export function BurbujaTema({
  numero,
  activo,
  hecho,
  grande,
}: {
  numero: number
  activo?: boolean
  hecho?: boolean
  /** El mapa la pinta mas grande porque ahi el tema es la unidad principal. */
  grande?: boolean
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-medium",
        grande ? "h-8 w-8 text-sm" : "h-6 w-6 text-xs",
        activo
          ? "bg-primary text-primary-foreground"
          : hecho
            ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
            : "bg-secondary text-muted-foreground",
      )}
    >
      {hecho && !activo ? <CheckCircle2 className={grande ? "h-4 w-4" : "h-3.5 w-3.5"} /> : numero}
    </span>
  )
}

/** La viñeta de una leccion: circulo hueco, o verde cuando esta leida. */
export function VinetaLeccion({ hecha }: { hecha?: boolean }) {
  return hecha ? (
    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
  ) : (
    <Circle className="h-3.5 w-3.5 shrink-0" />
  )
}

/**
 * La viñeta de una actividad. Cuenta para el progreso, asi que lleva el mismo
 * verde que las lecciones cuando esta aprobada.
 */
export function VinetaActividad({ hecha }: { hecha?: boolean }) {
  return (
    <Target className={cn("h-3.5 w-3.5 shrink-0", hecha && "text-emerald-500")} />
  )
}

/**
 * La viñeta de un simulador. Nunca cambia de estado: los simuladores se juegan
 * las veces que haga falta y no cuentan para el progreso, asi que darles marca
 * de completado prometeria algo que no ocurre.
 */
export function VinetaSimulador() {
  return <Gamepad2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
}

/** La etiqueta que distingue a los hijos que no son lecciones. */
export function EtiquetaTipo({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground/70">
      {children}
    </span>
  )
}

/** El estilo de una fila hija, compartido por lecciones, actividades y simuladores. */
export function filaHija(activa?: boolean, hecha?: boolean) {
  return cn(
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
    activa
      ? "font-medium text-primary"
      : hecha
        ? "text-muted-foreground hover:text-foreground"
        : "text-foreground hover:text-primary",
  )
}
