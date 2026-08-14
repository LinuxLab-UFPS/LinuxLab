export interface CsvStudentRow {
  name: string
  email: string
  code: string
}

export function parseStudentCsv(text: string): CsvStudentRow[] {
  if (!text?.trim()) return []

  const lines = text.split(/\r?\n/)
  if (lines.length < 2) return []

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const nameIdx = header.indexOf("nombre")
  const emailIdx = header.indexOf("email")
  const codeIdx = header.indexOf("codigo")

  if (emailIdx === -1) return []

  const rows: CsvStudentRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(",")
    const email = cols[emailIdx]?.trim() ?? ""
    if (!email) continue
    rows.push({
      name: nameIdx >= 0 ? cols[nameIdx]?.trim() ?? "" : "",
      email,
      code: codeIdx >= 0 ? cols[codeIdx]?.trim() ?? "" : "",
    })
  }
  return rows
}
