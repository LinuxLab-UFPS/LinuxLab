"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

/**
 * Las graficas de calificaciones, una sola vez.
 *
 * Estaban duplicadas palabra por palabra entre el panel del estudiante y el del
 * docente, asi que cualquier retoque dejaba una de las dos desalineada. Aqui
 * viven juntas y las dos vistas se ven igual por construccion.
 *
 * El rojo de la marca (#C41E3A) con su rosa de remate (#ff5470) es el mismo par
 * que usan los titulos en degradado de la plataforma.
 */

const ROJO = "#C41E3A"
const ROSA = "#ff5470"

/** El tooltip de recharts sin estilizar ignora el tema y en oscuro canta. */
function CajaTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number | null; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          {p.name}:{" "}
          <span className="font-mono font-medium text-foreground">
            {p.value == null ? "—" : `${p.value}/100`}
          </span>
        </p>
      ))}
    </div>
  )
}

export interface PuntoNota {
  name: string
  /** La nota de quien mira, o null si no ha hecho la actividad. */
  propio: number | null
  /** El promedio del grupo en esa misma actividad. */
  grupo: number | null
}

/**
 * Nota por actividad: area para la propia, linea punteada para el grupo.
 *
 * Area y no linea porque el degradado da el peso visual que la marca ya usa en
 * los titulos, y porque una linea suelta con muchos huecos (actividades sin
 * hacer) se lee peor que una superficie.
 */
export function GraficaNotas({
  datos,
  etiquetaPropia = "Mi calificación",
  className = "h-64",
}: {
  datos: PuntoNota[]
  etiquetaPropia?: string
  className?: string
}) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={datos} margin={{ top: 8, right: 16, bottom: 4, left: -12 }}>
          <defs>
            <linearGradient id="degradadoNota" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ROSA} stopOpacity={0.55} />
              <stop offset="100%" stopColor={ROJO} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--table-line)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10 }}
            stroke="var(--muted-foreground)"
            minTickGap={8}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 11 }}
            stroke="var(--muted-foreground)"
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CajaTooltip />} cursor={{ stroke: "var(--table-line)" }} />
          <Area
            type="monotone"
            dataKey="propio"
            name={etiquetaPropia}
            stroke={ROSA}
            strokeWidth={2}
            fill="url(#degradadoNota)"
            connectNulls={false}
            dot={{ r: 3, fill: ROJO, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: ROSA, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="grupo"
            name="Promedio del grupo"
            stroke="var(--muted-foreground)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export interface PuntoTema {
  topic: string
  promedio: number
}

/** Rendimiento por tema, en el mismo rojo que el resto. */
export function GraficaTemas({
  datos,
  className = "h-64",
}: {
  datos: PuntoTema[]
  className?: string
}) {
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={datos} outerRadius="70%">
          <defs>
            <linearGradient id="degradadoTema" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ROSA} stopOpacity={0.6} />
              <stop offset="100%" stopColor={ROJO} stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <PolarGrid stroke="var(--table-line)" />
          <PolarAngleAxis
            dataKey="topic"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip content={<CajaTooltip />} />
          <Radar
            name="Promedio"
            dataKey="promedio"
            stroke={ROSA}
            strokeWidth={2}
            fill="url(#degradadoTema)"
            fillOpacity={1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
