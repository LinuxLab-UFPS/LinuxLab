/**
 * La cabecera grande, con el degradado rojo sobre «Linux» y su halo.
 *
 * La usan las dos portadas. La publica le pasa el boton de empezar en `accion`
 * y el fondo de comandos en `fondo`; el panel del estudiante la deja sin las
 * dos, porque a quien ya entro no se le invita a entrar.
 */
export function HomeHero({
  accion,
  fondo,
  pie,
}: {
  accion?: React.ReactNode
  /** Lo que se pinta detras del titulo, por debajo del halo. */
  fondo?: React.ReactNode
  /** Debajo del boton: en la portada, la flecha que baja al bloque siguiente. */
  pie?: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-14 text-center sm:pt-28">
      {fondo}
      {/* Neon red halo behind the title */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[440px] bg-[radial-gradient(ellipse_55%_100%_at_50%_0%,rgba(196,30,58,0.28),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          Bienvenido al{" "}
          <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
            Linux
          </span>
          <span className="text-foreground">Lab</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Un laboratorio de Linux en el navegador: cada estudiante recibe su{" "}
          <span className="font-semibold text-foreground">propia máquina</span> y
          aprende usándola, no leyendo sobre ella.
          <br className="hidden sm:block" /> Lo que escribes ocurre de verdad, y lo
          que entregas se corrige mirando tu sistema.
        </p>
        {accion && <div className="mt-8 flex justify-center">{accion}</div>}
      </div>
      {pie && <div className="relative mt-14 flex justify-center">{pie}</div>}
    </section>
  )
}
