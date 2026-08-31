import { Monitor } from "lucide-react"

/**
 * Lo que se ve en el telefono donde va algo que necesita la terminal.
 *
 * La terminal es una maquina Linux de verdad, con su teclado y sus rutas: en una
 * pantalla de cinco pulgadas no se puede trabajar, asi que en movil el curso se
 * lee y se practica desde un computador.
 *
 * Va un aviso y no un hueco a proposito. Ocho lecciones solo se dan por
 * terminadas cuando pasa su comprobacion (ver `isLessonDone` en
 * course-progress.ts), asi que sin este cartel el tema se quedaria sin cerrar y
 * el estudiante no tendria forma de saber por que.
 */
export function SoloEnEscritorio({ que }: { que: string }) {
  return (
    <div className="my-8 flex items-start gap-3 rounded-xl border border-dashed border-border px-4 py-3.5 md:hidden">
      <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {que} se hace en la terminal, y para eso hace falta un computador. Entra
        desde uno para completar esta parte.
      </p>
    </div>
  )
}
