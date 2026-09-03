"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { cn } from "@shared/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select"
import { TablePagination } from "@shared/components/data-table"
import { EmptyState } from "@shared/components/empty-state"
import { CONTROL_SURFACE } from "@shared/components/control-surface"
import { SearchBar } from "@shared/components/search-bar"
import { ActivityCard } from "@/lib/features/student/components/activity-card"
import { usePassedActivities } from "@/lib/features/student/activity-status"
import { DIFFICULTY_LABEL } from "@shared/lib/content/activities"
import { syllabus } from "@shared/lib/content/temario"
import { conOrigen } from "@shared/lib/next-url"
import type {
  ActivityListing,
  Difficulty,
  GroupActivitySummary,
} from "@/lib/models/activities"

const TODOS = "all"
const COMPLETADAS = "completadas"
const PENDIENTES = "pendientes"
const DEL_DOCENTE = "docente"
const DEL_SISTEMA = "sistema"
/** Dos filas de la grid (4 columnas en escritorio): lo que se ve sin cansar. */
const POR_PAGINA = 8

const DIFICULTADES: Difficulty[] = ["basic", "intermediate", "advanced"]

/** El foco del desplegable sigue el rojo de la página, como el violeta sigue al
 *  panel de administración. */
const SELECT_ITEM = "focus:bg-primary/10 focus:text-primary"

const normaliza = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

/**
 * Una actividad del catálogo unificado. Hay una sola lista: las del temario y
 * las que publica el docente conviven, ordenadas por tema. El `source` decide
 * la tarjeta y los filtros que le aplican.
 */
type Item =
  | { source: "bank"; activity: ActivityListing }
  | { source: "teacher"; activity: GroupActivitySummary }

const claveDe = (item: Item) =>
  item.source === "bank" ? item.activity.slug : item.activity.id

const tituloDe = (item: Item) => item.activity.title

const descripcionDe = (item: Item) => item.activity.description

const temaDe = (item: Item): number | null => item.activity.topicNumber

const tituloTemaDe = (item: Item): string =>
  item.source === "bank"
    ? item.activity.topicTitle
    : // Las del docente no viajan con el título del tema: se resuelve desde el
      // temario por su número, para que la búsqueda también las encuentre.
      (syllabus.find((t) => t.number === item.activity.topicNumber)?.title ?? "Sin tema")

/** Solo las del temario declaran dificultad; las del docente no la traen, así
 *  que un filtro de dificultad concreto las deja fuera. */
const dificultadDe = (item: Item): Difficulty | undefined =>
  item.source === "bank" ? item.activity.difficulty : undefined

/** La escala de calificación es fija: 0 a 100. */
const NOTA_MAXIMA = 100

/** Cómo va la calificación de una actividad del docente: la nota del último
 *  intento en las automáticas; la que puso el revisor en las manuales. Mientras
 *  no haya número (sin intentos, o entrega esperando revisión) es "Pendiente". */
const estadoDelDocente = (
  a: GroupActivitySummary,
): { score: number | null; maxScore: number } => {
  if (a.evaluationType === "manual") {
    return { score: a.submission?.score ?? null, maxScore: NOTA_MAXIMA }
  }
  return a.attemptsCount > 0
    ? { score: a.finalScore, maxScore: NOTA_MAXIMA }
    : { score: null, maxScore: NOTA_MAXIMA }
}

/** El texto del trigger de cada filtro: la pista de qué filtra mientras no hay
 *  elección concreta, y la opción elegida después. Siempre un string — alternar
 *  entre texto y nada rompe la reconciliación dentro del trigger de Radix
 *  (NotFoundError: removeChild) y deja el filtro en blanco. */
const etiquetaTema = (valor: string): string => {
  if (valor === TODOS) return "Tema"
  const tema = syllabus.find((t) => String(t.number) === valor)
  return tema ? `${tema.number}. ${tema.title}` : "Tema"
}

const etiquetaDificultad = (valor: string): string =>
  valor === TODOS ? "Dificultad" : (DIFFICULTY_LABEL[valor as Difficulty] ?? "Dificultad")

const etiquetaEstado = (valor: string): string =>
  valor === COMPLETADAS ? "Completadas" : valor === PENDIENTES ? "Pendientes" : "Estado"

const etiquetaOrigen = (valor: string): string =>
  valor === DEL_DOCENTE ? "Docente" : valor === DEL_SISTEMA ? "Sistema" : "Origen"

/** ¿Está resuelta? Cada origen lo sabe por su lado: el temario con el registro
 *  de aprobadas y las del docente con sus entregas. */
const hecha = (item: Item, passed: Set<string>): boolean =>
  item.source === "bank" ? passed.has(item.activity.slug) : item.activity.completed

/**
 * El catálogo con su buscador, sus filtros y su paginación. El estado vive aquí
 * y no en la página para que ésta siga siendo un componente de servidor.
 *
 * Las del temario y las del docente forman UNA sola lista ordenada por tema:
 * dentro del curso no hay dos catálogos que revisar. Los desplegables traen
 * SIEMPRE todas las opciones — los doce temas del temario y las tres
 * dificultades — aunque el listado no las use: que un filtro desaparezca porque
 * nadie coincide es un menú que cambia sin avisar. Elegir una combinación vacía
 * lleva al estado vacío, que ofrece limpiar los criterios.
 */
export function ActivityBrowser({
  activities,
  groupActivities,
}: {
  /** Las del temario (contenido estático). */
  activities: ActivityListing[]
  /** Las que publicó el docente para el grupo del estudiante. */
  groupActivities: GroupActivitySummary[]
}) {
  const [busqueda, setBusqueda] = useState("")
  const [tema, setTema] = useState(TODOS)
  const [dificultad, setDificultad] = useState(TODOS)
  const [estado, setEstado] = useState(TODOS)
  const [origen, setOrigen] = useState(TODOS)
  const [pagina, setPagina] = useState(1)
  const { passed, scores } = usePassedActivities()

  const temas = useMemo(() => [...syllabus].sort((a, b) => a.number - b.number), [])

  /* La lista única: primero por tema (las sin tema al final) y dentro del
     tema, las del temario — que son el orden del pensum — y después las del
     docente, tal como llegan (creación, de más nueva a más vieja). */
  const lista = useMemo<Item[]>(() => {
    const todas: Item[] = [
      ...activities.map((activity): Item => ({ source: "bank", activity })),
      ...groupActivities.map((activity): Item => ({ source: "teacher", activity })),
    ]
    return todas.sort((a, b) => {
      const temaA = temaDe(a)
      const temaB = temaDe(b)
      if (temaA === null && temaB !== null) return 1
      if (temaB === null && temaA !== null) return -1
      if (temaA !== null && temaB !== null && temaA !== temaB) return temaA - temaB
      if (a.source !== b.source) return a.source === "bank" ? -1 : 1
      return 0
    })
  }, [activities, groupActivities])

  const visibles = useMemo(() => {
    const texto = normaliza(busqueda.trim())
    return lista.filter((item) => {
      if (origen !== TODOS) {
        if (origen === DEL_DOCENTE && item.source !== "teacher") return false
        if (origen === DEL_SISTEMA && item.source !== "bank") return false
      }
      const temaItem = temaDe(item)
      if (tema !== TODOS && String(temaItem) !== tema) return false
      if (dificultad !== TODOS && dificultadDe(item) !== dificultad) return false
      if (estado === COMPLETADAS && !hecha(item, passed)) return false
      if (estado === PENDIENTES && hecha(item, passed)) return false
      if (!texto) return true
      return normaliza(`${tituloDe(item)} ${descripcionDe(item)} ${tituloTemaDe(item)}`).includes(
        texto,
      )
    })
  }, [lista, busqueda, tema, dificultad, estado, origen, passed])

  const filtrando =
    busqueda.trim() !== "" ||
    tema !== TODOS ||
    dificultad !== TODOS ||
    estado !== TODOS ||
    origen !== TODOS

  const limpiar = () => {
    setBusqueda("")
    setTema(TODOS)
    setDificultad(TODOS)
    setEstado(TODOS)
    setOrigen(TODOS)
    setPagina(1)
  }

  /* Cualquier cambio de criterio invalida la página en la que se estaba. */
  const conPagina = (aplicar: () => void) => {
    aplicar()
    setPagina(1)
  }

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const dePagina = visibles.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA,
  )

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 lg:flex-row">
          <SearchBar
            value={busqueda}
            onChange={(valor) => conPagina(() => setBusqueda(valor))}
            placeholder="Buscar actividad por nombre o descripción..."
            className="max-w-sm flex-1"
          />

          <Select value={tema} onValueChange={(v) => conPagina(() => setTema(v))}>
            <SelectTrigger className={cn("w-full lg:w-52", CONTROL_SURFACE)}>
              <SelectValue>{etiquetaTema(tema)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS} className={SELECT_ITEM}>
                Todos los temas
              </SelectItem>
              {temas.map((t) => (
                <SelectItem key={t.number} value={String(t.number)} className={SELECT_ITEM}>
                  {t.number}. {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={dificultad}
            onValueChange={(v) => conPagina(() => setDificultad(v))}
          >
            <SelectTrigger className={cn("w-full lg:w-40", CONTROL_SURFACE)}>
              <SelectValue>{etiquetaDificultad(dificultad)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS} className={SELECT_ITEM}>
                Todas las dificultades
              </SelectItem>
              {DIFICULTADES.map((d) => (
                <SelectItem key={d} value={d} className={SELECT_ITEM}>
                  {DIFFICULTY_LABEL[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={estado} onValueChange={(v) => conPagina(() => setEstado(v))}>
            <SelectTrigger className={cn("w-full lg:w-36", CONTROL_SURFACE)}>
              <SelectValue>{etiquetaEstado(estado)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS} className={SELECT_ITEM}>
                Todas
              </SelectItem>
              <SelectItem value={COMPLETADAS} className={SELECT_ITEM}>
                Completadas
              </SelectItem>
              <SelectItem value={PENDIENTES} className={SELECT_ITEM}>
                Pendientes
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={origen} onValueChange={(v) => conPagina(() => setOrigen(v))}>
            <SelectTrigger className={cn("w-full lg:w-36", CONTROL_SURFACE)}>
              <SelectValue>{etiquetaOrigen(origen)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS} className={SELECT_ITEM}>
                Docente y sistema
              </SelectItem>
              <SelectItem value={DEL_DOCENTE} className={SELECT_ITEM}>
                Docente
              </SelectItem>
              <SelectItem value={DEL_SISTEMA} className={SELECT_ITEM}>
                Sistema
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibles.length === 0 ? (
        filtrando ? (
          <EmptyState
            icon={Search}
            title="Ninguna actividad coincide con la búsqueda"
            description="Prueba con otros términos o quita algún filtro: la combinación actual no trae resultados."
            action={
              <button
                type="button"
                onClick={limpiar}
                className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Limpiar filtros
              </button>
            }
          />
        ) : (
          <EmptyState
            icon={Search}
            title="Aún no hay actividades disponibles"
            description="Cuando el laboratorio publique actividades, aparecerán aquí."
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {dePagina.map((item) =>
              item.source === "bank" ? (
                <ActivityCard
                  key={claveDe(item)}
                  title={item.activity.title}
                  description={item.activity.description}
                  href={conOrigen(item.activity.href, "/actividades")}
                  estado={scores[item.activity.slug] ?? { score: null, maxScore: NOTA_MAXIMA }}
                  dificultad={item.activity.difficulty}
                  topicTitle={item.activity.topicTitle}
                />
              ) : (
                <ActivityCard
                  key={claveDe(item)}
                  title={item.activity.title}
                  description={item.activity.description || "Sin instrucciones."}
                  href={conOrigen(`/terminal?ga=${item.activity.id}`, "/actividades")}
                  estado={estadoDelDocente(item.activity)}
                  topicTitle={tituloTemaDe(item)}
                  tipo={item.activity.activityType === "quiz" ? "quiz" : "taller"}
                />
              ),
            )}
          </div>
          {totalPaginas > 1 && (
            <TablePagination
              page={paginaSegura}
              totalPages={totalPaginas}
              onChange={setPagina}
              total={visibles.length}
              pageSize={POR_PAGINA}
              label="actividades"
            />
          )}
        </>
      )}
    </>
  )
}
