"use client"

import { useReveal, claseRevelado } from "@shared/hooks/use-reveal"
import { cn } from "@shared/lib/utils"
import {
  RutaDeTemas,
  TEMAS,
  LECCIONES,
  enLetra,
  conMayuscula,
} from "@/lib/features/student/components/platform-showcase"

/** Donde va la captura. Mientras el archivo no exista, sale el marco vacio. */
const CAPTURA = "/landing/plataforma.webp"

/**
 * Qué es el laboratorio, en la portada pública.
 *
 * El texto va en tercera persona y sin dirigirse a nadie: lo leen docentes que
 * evalúan si adoptarlo y gente que llega de fuera, no solo quien va a cursarlo.
 * Por eso describe la herramienta y su propósito, y no lo que «vas a hacer».
 */
export function AcercaDe() {
  const { ref, visible } = useReveal<HTMLDivElement>()

  return (
    <section
      className="mx-auto w-full max-w-7xl px-6 py-16"
      aria-label="Acerca de LinuxLab"
    >
      <div
        ref={ref}
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
          claseRevelado(visible),
        )}
      >
        <div className="order-2 lg:order-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CAPTURA}
            alt="La plataforma con una lección abierta y la terminal al lado"
            className="w-full rounded-xl border border-border shadow-[var(--neon-glow)]"
          />
        </div>

        <div className="order-1 lg:order-2">
          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Un laboratorio de Linux que corre en el navegador
          </h3>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            LinuxLab es una plataforma de aprendizaje interactivo desarrollada en
            la Universidad Francisco de Paula Santander, diseñada para la
            enseñanza de la terminal y los fundamentos de sistemas operativos a
            través de un entorno virtual con{" "}
            <span className="font-semibold text-foreground">
              actividades prácticas, lecciones, videos y simuladores
            </span>
            .
          </p>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Cada usuario recibe una cuenta real en un contenedor Linux por SSH.
            Su sesión sigue viva mientras navega, y la terminal lo acompaña,
            siendo accesible sobre cualquier lección.
          </p>
        </div>
      </div>

      {/* El recorrido del temario, debajo y a lo ancho: cierra la seccion
          diciendo cuanto hay, despues de haber dicho que es. */}
      <div className="mt-16 grid items-center gap-10 border-t border-border pt-16 lg:grid-cols-2 lg:gap-16">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {conMayuscula(enLetra(TEMAS))} temas.{" "}
            {conMayuscula(enLetra(LECCIONES, "f"))} lecciones.
          </h3>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Teoría, video y práctica en una sola ruta, de la arquitectura del
            Kernel a la gestión de permisos.
          </p>
        </div>
        <RutaDeTemas />
      </div>
    </section>
  )
}
