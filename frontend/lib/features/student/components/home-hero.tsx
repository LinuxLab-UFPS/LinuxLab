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
    <section className="relative overflow-hidden px-6 pt-20 pb-16 text-center sm:pt-28 sm:pb-14">
      {fondo}
      <div className="relative mx-auto max-w-3xl">
        {/* `leading-[1.05]` es interlineado de titular y a 60px esta bien, pero a
            36px, con el titulo partido en varias lineas, dejaba las lineas casi
            pegadas. En pantalla estrecha se afloja. */}
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl sm:leading-[1.05]">
          Bienvenido al{" "}
          <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
            Linux
          </span>
          <span className="text-foreground">Lab</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:mt-6 sm:text-lg">
          La forma moderna de aprender Linux: teoría al grano, una{" "}
          <span className="font-semibold text-foreground">terminal real</span> en el
          navegador con{" "}
          <span className="font-semibold text-foreground">actividades y simuladores</span>{" "}
          interactivos para practicar de verdad.
        </p>
        {accion && <div className="mt-10 flex justify-center">{accion}</div>}
      </div>
      {pie && <div className="relative mt-16 flex justify-center sm:mt-32">{pie}</div>}
    </section>
  )
}
