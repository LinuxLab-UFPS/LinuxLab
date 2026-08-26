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
        <TopicGrid topicLessons={getTopicLessons()} previews={getTopicPreviews()} />
      </section>
    </div>
  )
}
