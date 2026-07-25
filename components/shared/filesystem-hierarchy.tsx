interface Node {
  name: string
  detail: string
  color: string
  child?: { name: string; detail: string }
}

const CHILDREN: Node[] = [
  { name: "etc/", detail: "configuración del sistema", color: "text-orange-500 border-orange-500/60" },
  {
    name: "home/",
    detail: "carpetas de usuario",
    color: "text-emerald-500 border-emerald-500/60",
    child: { name: "usuario/", detail: "tu espacio personal" },
  },
  { name: "lib/", detail: "bibliotecas del sistema", color: "text-foreground border-border" },
  {
    name: "usr/",
    detail: "programas instalados",
    color: "text-sky-500 border-sky-500/60",
    child: { name: "bin/", detail: "ejecutables" },
  },
  {
    name: "var/",
    detail: "logs y datos variables",
    color: "text-violet-500 border-violet-500/60",
    child: { name: "log/", detail: "registros" },
  },
]

const LEGEND = [
  { label: "configuración", color: "bg-orange-500" },
  { label: "usuarios", color: "bg-emerald-500" },
  { label: "programas", color: "bg-sky-500" },
  { label: "datos", color: "bg-violet-500" },
]

function Box({ name, className }: { name: string; className: string }) {
  return (
    <span
      className={`rounded-md border-2 bg-card px-3 py-1.5 font-mono text-sm font-bold ${className}`}
    >
      {name}
    </span>
  )
}

/**
 * The Linux filesystem hierarchy, rendered as a real (theme-aware) element
 * instead of a static screenshot, so it stays sharp and matches light/dark mode.
 */
export function FilesystemHierarchy() {
  return (
    <div className="my-8 rounded-xl border border-border bg-secondary/30 px-6 py-10">
      <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Jerarquía del sistema de archivos
      </p>

      <div className="flex flex-col items-center">
        <Box name="/" className="border-primary text-primary" />
        <p className="mt-1.5 text-xs text-muted-foreground">raíz del sistema</p>

        <div className="h-6 w-px bg-border" />

        <div className="flex w-full max-w-3xl justify-between border-t border-border">
          {CHILDREN.map((node) => (
            <div key={node.name} className="flex flex-col items-center px-2 pt-6">
              <div className="-mt-6 h-6 w-px bg-border" />
              <Box name={node.name} className={node.color} />
              <p className="mt-1.5 max-w-24 text-center text-xs leading-tight text-muted-foreground">
                {node.detail}
              </p>

              {node.child && (
                <>
                  <div className="h-5 w-px bg-border" />
                  <Box name={node.child.name} className={node.color} />
                  <p className="mt-1.5 text-center text-xs leading-tight text-muted-foreground">
                    {node.child.detail}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-5">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
