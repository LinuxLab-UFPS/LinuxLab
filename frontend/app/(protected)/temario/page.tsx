import { MapaTemario } from "@/lib/features/student/components/course-roadmap"
import { getTopicLessons } from "@shared/lib/content/lessons"
import { requireServerRole } from "@/lib/features/auth/session"

/**
 * El temario visto por el docente.
 *
 * Es el mismo mapa que el estudiante abre en su ruta de aprendizaje, montado sin
 * progreso: ni porcentajes, ni barras, ni burbujas verdes. Un docente no cursa
 * el laboratorio, asi que esas cifras serian todas cero y se leerian como si no
 * hubiera hecho nada, en vez de como lo que son —que la pregunta no aplica.
 *
 * De aqui se entra a leer cualquier leccion (`/curso`) y a jugar cualquier
 * simulador. Las actividades no: se resuelven contra la matricula de un grupo,
 * asi que el mapa remite a revisarlas en el grupo donde esten asignadas.
 */
export default async function TemarioDocentePage() {
  await requireServerRole(["teacher", "admin"])

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Contenidos del curso
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El temario tal como lo recorren tus estudiantes. Abre un tema para ver sus lecciones
          y sus simuladores.
        </p>
      </header>

      <MapaTemario topicLessons={getTopicLessons()} progreso={null} />
    </div>
  )
}
