import { ShieldCheck } from "lucide-react"
import { ActionButton } from "@shared/components/action-button"

/**
 * Una comprobación de mentira, solo para enseñar la forma.
 *
 * Va en la guía del laboratorio, donde hace falta que el estudiante vea cómo es
 * una comprobación antes de encontrarse la primera de verdad. No evalúa nada y
 * no puede: pedirle ahí que cree un archivo sería pedirle algo que todavía no
 * sabe hacer, porque la guía va antes del primer tema.
 *
 * Es una copia del marco de `ExerciseCheck` y no el componente mismo: aquel
 * necesita un slug, pide la actividad al servidor y guarda intentos. Todo eso
 * sobra aquí, y montar una actividad falsa en la base de datos para sostenerlo
 * seria mas frágil que estas veinte líneas.
 */
export function ExampleCheck() {
  return (
    <section className="my-8 rounded-xl border border-amber-500/30 transition-colors">
      <header className="flex items-center gap-2.5 border-b border-amber-500/30 px-5 py-3.5">
        <ShieldCheck className="h-4 w-4 text-amber-500" />
        <h3 className="text-sm font-semibold text-foreground">
          Comprobación: Crea tu primer directorio
        </h3>
      </header>

      <div className="space-y-4 px-5 py-4">
        <p className="text-sm leading-relaxed text-foreground">
          Abre la terminal y crea un directorio llamado practicas dentro de tu carpeta
          personal y, dentro de él, otro llamado tema-03.
        </p>

        <ul className="space-y-2">
          {[
            "Crea el directorio practicas en tu carpeta personal",
            "Crea, dentro de él, el directorio tema-03",
          ].map((texto, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-muted-foreground/40" />
                <span className="text-foreground">
                  {i + 1}. {texto}
                </span>
              </li>
            ),
          )}
        </ul>

        <div className="flex items-center gap-3">
          <ActionButton tone="amber" disabled>
            <ShieldCheck className="h-4 w-4" />
            Comprobar
          </ActionButton>
          <p className="text-xs text-muted-foreground">
            Aquí no hace nada: la de verdad revisa tu carpeta dentro del laboratorio.
          </p>
        </div>
      </div>
    </section>
  )
}
