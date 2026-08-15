import { ArrowDown } from "lucide-react"

/**
 * Las dos zonas en las que Linux parte la memoria, con la frontera de
 * privilegios en medio: la misma figura del video de la leccion.
 */

const USER_LAYERS = ["Código de las aplicaciones", "Bibliotecas del sistema (libc)"]

const KERNEL_LAYERS = [
  { name: "Interfaz de llamadas al sistema", entry: true },
  { name: "Servicios del kernel", entry: false },
  { name: "Controladores de dispositivos", entry: false },
]

export function KernelSpaceDiagram() {
  return (
    <div className="mx-auto my-8 w-full max-w-xl">
      <section className="rounded-xl border-2 border-emerald-500/60 px-5 py-4">
        <h4 className="mb-3 font-mono text-sm font-semibold text-emerald-500">
          Espacio de usuario
        </h4>
        <div className="space-y-2.5">
          {USER_LAYERS.map((layer) => (
            <p
              key={layer}
              className="rounded-lg border border-emerald-500/40 bg-card px-4 py-2.5 text-center text-sm text-foreground"
            >
              {layer}
            </p>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <p className="mb-2 font-mono text-xs font-semibold text-primary">
          Frontera de privilegios
        </p>
        <div className="border-t-2 border-dashed border-primary/70" />
        <ArrowDown className="mx-auto mt-3 h-7 w-7 text-primary" strokeWidth={2.5} aria-hidden />
      </div>

      <section className="mt-3 rounded-xl border-2 border-primary/70 px-5 py-4">
        <h4 className="mb-3 font-mono text-sm font-semibold text-primary">
          Espacio de kernel
        </h4>
        <div className="space-y-2.5">
          {KERNEL_LAYERS.map((layer) => (
            <p
              key={layer.name}
              className={`rounded-lg border px-4 py-2.5 text-center text-sm text-foreground ${
                layer.entry
                  ? "border-primary/60 bg-primary/10"
                  : "border-border bg-card"
              }`}
            >
              {layer.name}
            </p>
          ))}
        </div>
      </section>

      <ArrowDown className="mx-auto my-3 h-7 w-7 text-primary" strokeWidth={2.5} aria-hidden />

      <p className="rounded-xl border-2 border-amber-500/60 px-5 py-3 text-center font-mono text-sm font-semibold text-amber-500">
        Hardware
      </p>
    </div>
  )
}
