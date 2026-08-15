import { readFileSync } from "fs"
import { join } from "path"

/**
 * The statement of an activity, in markdown. It lives in `content/actividades/`
 * and NOT under `content/temario/`, because an activity is not a lesson: it
 * never shows up in the course outline and is solved next to the terminal.
 */
const ROOT = join(process.cwd(), "content", "actividades")

const SLUG = /^[a-z0-9-]+$/

export function getActivityStatement(slug: string): string | null {
  if (!SLUG.test(slug)) return null
  try {
    return readFileSync(join(ROOT, `${slug}.md`), "utf8")
  } catch {
    return null
  }
}
