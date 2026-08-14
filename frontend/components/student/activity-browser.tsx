"use client"

import { useMemo, useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ActivityGrid } from "@/components/student/activity-grid"
import { DIFFICULTY_LABEL } from "@/lib/features/shared/activities"
import type { ActivityListing, Difficulty } from "@/lib/models/activities"

const TODOS = "all"

/** El foco del desplegable sigue el ámbar de la página, como el violeta sigue
 *  al panel de administración. */
const SELECT_ITEM = "focus:bg-amber-500/10 focus:text-amber-400"

const normaliza = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

/**
 * El catálogo con su buscador y sus dos filtros. El estado vive aquí y no en la
 * página para que ésta siga siendo un componente de servidor.
 *
 * Los temas del desplegable salen de las actividades que hay, no del temario
 * completo: ofrecer un tema sin actividades sólo lleva a una lista vacía.
 */
export function ActivityBrowser({
  activities,
  children,
}: {
  activities: ActivityListing[]
  /** Lo que se pinta entre los filtros y el catálogo (las del curso). */
  children?: React.ReactNode
}) {
  const [busqueda, setBusqueda] = useState("")
  const [tema, setTema] = useState(TODOS)
  const [dificultad, setDificultad] = useState(TODOS)

  const temas = useMemo(() => {
    const vistos = new Map<number, string>()
    for (const a of activities) vistos.set(a.topicNumber, a.topicTitle)
    return [...vistos].sort((a, b) => a[0] - b[0])
  }, [activities])

  const dificultades = useMemo(() => {
    const orden: Difficulty[] = ["basic", "intermediate", "advanced"]
    return orden.filter((d) => activities.some((a) => a.difficulty === d))
  }, [activities])

  const visibles = useMemo(() => {
    const texto = normaliza(busqueda.trim())
    return activities.filter((a) => {
      if (tema !== TODOS && String(a.topicNumber) !== tema) return false
      if (dificultad !== TODOS && a.difficulty !== dificultad) return false
      if (!texto) return true
      return normaliza(`${a.title} ${a.description} ${a.topicTitle}`).includes(texto)
    })
  }, [activities, busqueda, tema, dificultad])

  const filtrando = busqueda.trim() !== "" || tema !== TODOS || dificultad !== TODOS

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar actividad por nombre o descripción..."
              className="border-table-line pl-9 pr-8"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Select value={tema} onValueChange={setTema}>
            <SelectTrigger className="w-full border-table-line sm:w-52">
              <SelectValue placeholder="Tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS} className={SELECT_ITEM}>
                Todos los temas
              </SelectItem>
              {temas.map(([numero, titulo]) => (
                <SelectItem key={numero} value={String(numero)} className={SELECT_ITEM}>
                  {numero}. {titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dificultad} onValueChange={setDificultad}>
            <SelectTrigger className="w-full border-table-line sm:w-40">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS} className={SELECT_ITEM}>
                Todas
              </SelectItem>
              {dificultades.map((d) => (
                <SelectItem key={d} value={d} className={SELECT_ITEM}>
                  {DIFFICULTY_LABEL[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtrando && (
          <p className="shrink-0 text-sm text-muted-foreground">
            {visibles.length} de {activities.length}
          </p>
        )}
      </div>

      {children}

      {visibles.length === 0 && filtrando ? (
        <p className="text-muted-foreground">
          Ninguna actividad coincide con la búsqueda.
        </p>
      ) : (
        <ActivityGrid activities={visibles} />
      )}
    </>
  )
}
