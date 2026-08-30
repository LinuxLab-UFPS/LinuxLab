/**
 * La cabecera grande, con el degradado rojo sobre «Linux».
 *
 * La usan las dos portadas. La publica le pasa el fondo de comandos y la flecha
 * que baja al bloque siguiente; el panel del estudiante la deja pelada, porque
 * a quien ya entro no se le invita a entrar.
 */
export function HomeHero({
  accion,
  fondo,
  pie,
}: {
  accion?: React.ReactNode
  /** Lo que se pinta detras, por debajo de todo. */
  fondo?: React.ReactNode
  /** Debajo del boton: en la portada, la flecha que baja al bloque siguiente. */
  pie?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-14 text-center sm:pt-28">
      {fondo}
      <div className="relative mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          Bienvenido al{" "}
          <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
            Linux
          </span>
          <span className="text-foreground">Lab</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          La forma moderna de aprender Linux: teoría al grano, una{" "}
          <span className="font-semibold text-foreground">terminal real</span> en el
          navegador con{" "}
          <span className="font-semibold text-foreground">actividades y simuladores</span>{" "}
          interactivos para practicar de verdad.
        </p>
        {accion && <div className="mt-8 flex justify-center">{accion}</div>}
      </div>
      {pie && <div className="relative mt-24 flex justify-center sm:mt-32">{pie}</div>}
    </section>
  )
}
