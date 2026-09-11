import fs from "node:fs"
import path from "node:path"
import { chromium } from "@playwright/test"
import { buildAuth, storageStateFor, ROOT } from "./auth.mjs"
import { buildViews } from "./views.mjs"

const BASE_URL = process.env.CAPTURE_BASE_URL || "http://localhost:3001"
const OUT_DIR = path.join(ROOT, "docs", "annex-images")
const onlyIteration = process.env.CAPTURE_ITERATION ? Number(process.env.CAPTURE_ITERATION) : null

async function main() {
  const auth = buildAuth()
  const views = buildViews(auth).filter((v) => !onlyIteration || v.iteration === onlyIteration)

  const browser = await chromium.launch()
  const index = []

  for (const view of views) {
    const dir = path.join(OUT_DIR, `it${view.iteration}`)
    fs.mkdirSync(dir, { recursive: true })
    const file = path.join(dir, `${view.name}.png`)

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      storageState: view.role ? storageStateFor(auth, view.role, BASE_URL) : undefined,
    })
    const page = await context.newPage()

    let status = "ok"
    try {
      await page.goto(BASE_URL + view.path, { waitUntil: "networkidle", timeout: 60000 })
      // Deja asentar transiciones/anuncios de la UI.
      await page.waitForTimeout(1200)
      await page.screenshot({ path: file, fullPage: false })
    } catch (err) {
      status = `error: ${err.message}`
      try {
        await page.screenshot({ path: file, fullPage: false })
      } catch {}
    } finally {
      await context.close()
    }

    index.push({ iteration: view.iteration, name: view.name, role: view.role ?? "publico", path: view.path, status })
    console.log(`it${view.iteration}/${view.name}.png  ${status === "ok" ? "✓" : status}`)
  }

  await browser.close()
  fs.writeFileSync(path.join(OUT_DIR, "index.json"), JSON.stringify(index, null, 2))
  const ok = index.filter((i) => i.status === "ok").length
  console.log(`\n${ok}/${index.length} capturas guardadas en docs/annex-images/`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
