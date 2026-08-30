import { ArrowRight } from "lucide-react"
import { LessonLink } from "@shared/components/lesson-loading"
import { bienvenida } from "@shared/lib/content/bienvenida"
import { HomeHero } from "@/lib/features/student/components/home-hero"
import { TopicGrid } from "@/lib/features/student/components/topic-grid"
import { getTopicLessons, getTopicPreviews } from "@shared/lib/content/lessons"

/**
 * El panel del estudiante: la cabecera y el temario entero con su progreso.
 *
 * Sin el recorrido de la plataforma ni el pie, que se fueron a la portada
 * publica. Aqui sobraban: a quien ya entro no hay que contarle que hay una
 * terminal, la tiene a un clic en la barra de arriba.
 */
export function StudentDashboard() {
  return (
    <div className="min-h-full">
      <HomeHero />
      <section className="mx-auto max-w-7xl px-6 pb-20">
        {/* Entrar por el mapa y no por una tarjeta suelta: las tarjetas llevan
            directo a un tema y se saltan la guia, que es donde se explica como
            funciona el laboratorio. */}
        <div className="mb-8 flex justify-center">
          <LessonLink
            href={`/curso?tema=${bienvenida.slug}&sub=roadmap`}
            className="neon-glow hover:neon-glow-strong group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-300 hover:bg-primary/90"
          >
            Ir al curso
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </LessonLink>
        </div>
        <TopicGrid topicLessons={getTopicLessons()} previews={getTopicPreviews()} />
      </section>
    </div>
  )
}
