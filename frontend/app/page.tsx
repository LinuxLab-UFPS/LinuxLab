import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { syllabus } from "@shared/lib/content/temario"
import { getTopicPreviews } from "@shared/lib/content/lessons"
import { getServerSession } from "@/lib/features/auth/session"
import { conNext } from "@shared/lib/next-url"
import { HomeHero } from "@/lib/features/student/components/home-hero"
import { LandingHeader } from "@/lib/features/student/components/landing-header"
import { FlechaSiguiente } from "@/lib/features/student/components/flecha-siguiente"
import { ComandosDeFondo } from "@/lib/features/student/components/comandos-de-fondo"
import { AcercaDe } from "@/lib/features/student/components/acerca-de"
import { ShowcaseSimuladoresYPruebas } from "@/lib/features/student/components/platform-showcase"
import { ContentCard } from "@/lib/features/student/components/content-card"
import { previewTags } from "@/lib/features/student/components/topic-tags"
import { topicIllustration } from "@/lib/features/student/components/topic-illustrations"
import { SiteFooter } from "@shared/components/site-footer"
/** Cuantos temas se enseñan antes del boton. Dos filas de tres. */
const TEMAS_EN_PORTADA = 6
/* El rojo de neon del boton de la terminal del curso, sin la parte que lo
   clava en una esquina (ver shared/components/floating-terminal.tsx). */
const BOTON =
  "inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium " +
  "bg-primary text-primary-foreground hover:bg-primary/90 " +
  "neon-glow hover:neon-glow-strong transition-all duration-300"
/* Cada bloque ocupa la pantalla y centra lo suyo. El `pt-14` deja sitio a la
   barra, que va fija y taparia la primera linea de cada bloque. */
const BLOQUE = "flex min-h-screen flex-col justify-center pt-14"
/**
 * La portada publica.
 *
 * Es lo primero que ve quien llega sin sesion, y tambien lo que ve quien ya la
 * tiene: el middleware ya no rebota `/` a `/home`, porque con la portada aqui
 * eso significaba que nadie logueado podia verla nunca.
 *
 * La unica diferencia entre los dos casos son los enlaces. Sin sesion pasan por
 * el login llevando el destino en `?next=`; con sesion van derechos. Se resuelve
 * en el servidor y por eso la pagina no necesita ser de cliente.
 */
export default async function LandingPage() {
  const session = await getServerSession()
  const previews = getTopicPreviews()
  // Al tablero y no a la primera leccion: `/inicio` aguanta mejor los estados
  // raros. Quien no esta matriculado en ningun grupo lo desvia desde ahi la
  // puerta del middleware, sin que la portada tenga que saber nada de eso.
  const irAlCurso = session ? "/inicio" : conNext("/inicio")
  const irAlTemario = irAlCurso
  /* El temario es del estudiante. Un docente o un admin que pulse una tarjeta
     va a su propio panel: `/curso` los dejaria en una leccion que no les toca,
     y ademas la barra lateral de ahi da por hecho que hay matricula. */
  const soloEstudiante = session?.user.role === "student"
  const portada = syllabus.slice(0, TEMAS_EN_PORTADA)
  return (
    // El color del pie va en el envoltorio para que el rebote del scroll, al
    // pasarse por abajo, vea negro y no el `--background` claro del tema por
    // defecto, que asomaba como una franja blanca bajo el pie.
    <div className="min-h-screen bg-[#0d1117]">
      <div className="bg-background">
        <LandingHeader />
        <div className={`${BLOQUE} relative overflow-hidden`}>
          <HomeHero
            fondo={<ComandosDeFondo />}
            accion={
              <Link href={irAlCurso} className={BOTON}>
                <Play className="h-4 w-4" />
                Comenzar
              </Link>
            }
            pie={<FlechaSiguiente hacia="acerca-de" />}
          />
        </div>
        <div id="acerca-de" className={`${BLOQUE} bg-card`}>
          <AcercaDe />
        </div>
        <div className={BLOQUE}>
          <ShowcaseSimuladoresYPruebas />
        </div>
        <div id="temario" className={`${BLOQUE} bg-card`}>
          <section className="mx-auto w-full max-w-7xl px-6 py-16">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Lo que vas a aprender
            </h2>
            {/* Tres fijas por fila para que las dos filas queden parejas, y sin
                barra de progreso: aqui no hay sesion de la que leerlo. */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {portada.map((topic) => (
                <ContentCard
                  key={topic.slug}
                  href={
                    soloEstudiante
                      ? `/curso?tema=${topic.slug}`
                      : session
                        ? irAlCurso
                        : conNext(`/curso?tema=${topic.slug}`)
                  }
                  title={`${topic.number}. ${topic.title}`}
                  description={topic.description}
                  illustration={topicIllustration(topic.number)}
                  tags={previews[topic.number] ? previewTags(previews[topic.number]) : []}
                />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Link href={irAlTemario} className={BOTON}>
                Ver Temario
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
