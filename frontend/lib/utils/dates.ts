export const BOGOTA_TIME_ZONE = "America/Bogota"

const twoDigits = (value: number) => String(value).padStart(2, "0")

/** Mes abreviado en español: ICU es-CO da "sept" y aqui la casa quiere "sep". */
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

/** Separa una fecha en sus partes numericas (hora Bogota), sin depender del locale. */
function partsDe(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: BOGOTA_TIME_ZONE,
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ""
  return {
    day: Number(get("day")),
    month: Number(get("month")),
    year: get("year"),
    hour: get("hour"),
    minute: get("minute"),
  }
}

/** "03 sep 2026, 00:00" — el formato de toda fecha con hora de la app. */
export function formatBogotaDateTime(value: string | Date): string {
  const p = partsDe(value)
  return `${twoDigits(p.day)} ${MESES[p.month - 1]} ${p.year}, ${p.hour}:${p.minute}`
}

/** "03 sep 2026" — el mismo formato, para fechas que no muestran hora. */
export function formatBogotaDate(value: string | Date): string {
  const p = partsDe(value)
  return `${twoDigits(p.day)} ${MESES[p.month - 1]} ${p.year}`
}

/** "00:00" — solo la hora, para acompañar a `formatBogotaDate` en dos líneas. */
export function formatBogotaTime(value: string | Date): string {
  const p = partsDe(value)
  return `${p.hour}:${p.minute}`
}

export function toBogotaInputValue(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: BOGOTA_TIME_ZONE,
  }).formatToParts(new Date(value))
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

export function parseBogotaInput(value: string): Date {
  const [date, time] = value.split("T")
  return new Date(`${date}T${time}:00-05:00`)
}

export function currentBogotaInputValue(): string {
  return toBogotaInputValue(new Date().toISOString())
}
/**
 * Tiempo relativo en español, estilo "Hace 5 minutos". Usado para la ultima
 * conexion. Devuelve "Hace un momento" para menos de un minuto.
 */
export function timeAgo(value: string | Date): string {
  const diffMs = Date.now() - new Date(value).getTime()
  if (diffMs < 60_000) return "Hace un momento"

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const months = Math.floor(days / 30)
  const years = Math.floor(days / 365)

  const unit = (count: number, singular: string, plural: string) =>
    `${count} ${count === 1 ? singular : plural}`

  if (years > 0) return `Hace ${unit(years, "año", "años")}`
  if (months > 0) return `Hace ${unit(months, "mes", "meses")}`
  if (days > 0) return `Hace ${unit(days, "día", "días")}`
  if (hours > 0) return `Hace ${unit(hours, "hora", "horas")}`
  return `Hace ${unit(minutes, "minuto", "minutos")}`
}
