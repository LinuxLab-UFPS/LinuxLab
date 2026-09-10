"use client"

import { FolderOpen } from "lucide-react"
import { ActionButton } from "@shared/components/action-button"

/**
 * La red de seguridad de que la actividad se resuelve en su directorio.
 *
 * Al abrir una actividad la terminal entra sola en su directorio, asi que en el
 * caso normal esto no se ve nunca. Pero si el `cd` no llega (la actividad se
 * abrio antes de que conectara la consola, o el estudiante hizo `cd ..` sin
 * darse cuenta) lo que pasaba era lo peor posible: resolvia todo en su home, la
 * comprobacion no encontraba nada y el aviso que lo explicaba era una linea
 * pequeña arriba del enunciado que nadie leia.
 *
 * Asi que tapa el enunciado y los botones enteros. No se puede seguir sin
 * volver al directorio, que es justo lo que hay que hacer: cualquier trabajo
 * hecho fuera de ahi no cuenta.
 */
export function AvisoDirectorio({
  workdir,
  onIr,
  deshabilitado,
}: {
  workdir: string
  onIr: () => void
  /** Con `vi` abierto el `cd` no se ejecutaria: se teclearia dentro del archivo. */
  deshabilitado?: boolean
}) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/95 px-6 text-center backdrop-blur-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
        <FolderOpen className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-foreground">
          No estás en el directorio de la actividad
        </p>
        <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
          Esta actividad se resuelve dentro de{" "}
          <span className="font-mono text-[11px] text-foreground">~/actividades/{workdir}</span> y
          solo ahí se puede comprobar. Lo que hagas fuera no se tiene en cuenta.
        </p>
      </div>
      {deshabilitado ? (
        <p className="text-xs text-muted-foreground">
          Cierra el editor en la terminal para poder volver al directorio.
        </p>
      ) : (
        <ActionButton tone="amber" onClick={onIr}>
          <FolderOpen className="h-4 w-4" />
          Ir al directorio
        </ActionButton>
      )}
    </div>
  )
}
