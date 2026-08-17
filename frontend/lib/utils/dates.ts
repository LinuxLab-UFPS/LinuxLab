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
