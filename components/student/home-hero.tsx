/**
 * Landing hero for the student home. Big title with a neon-red gradient on
 * "Linux" (AlgoMaster style) over a soft red glow.
 */
export function HomeHero() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-14 text-center sm:pt-28">
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
          La forma moderna de aprender Linux: teoría al grano, una{" "}
          <span className="font-semibold text-foreground">terminal real</span> en el
          navegador con{" "}
          <span className="font-semibold text-foreground">actividades y simuladores</span>{" "}
          interactivos para practicar de verdad.
        </p>
      </div>
    </section>
  )
}
