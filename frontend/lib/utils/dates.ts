export const BOGOTA_TIME_ZONE = "America/Bogota"

const twoDigits = (value: number) => String(value).padStart(2, "0")

export function formatBogotaDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: BOGOTA_TIME_ZONE,
  }).format(new Date(value))
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

export function formatBogotaDateParts(year: number, month: number, day: number, hour: number, minute: number): string {
  return `${year}-${twoDigits(month)}-${twoDigits(day)}T${twoDigits(hour)}:${twoDigits(minute)}`
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
