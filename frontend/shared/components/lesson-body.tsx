import { Image as ImageIcon, Film } from "lucide-react"
import { Markdown } from "@shared/components/markdown"
import { ShellCommand } from "@shared/components/shell-command"
import { SimulatorCard } from "@/lib/features/student/components/simulator-card"
import { TerminalDemoButton } from "@/lib/features/student/components/terminal-demo-button"
import { FilesystemHierarchy } from "@shared/components/filesystem-hierarchy"
import { ExerciseCheck } from "@/lib/features/student/components/exercise-check"
import { ExampleCheck } from "@/lib/features/student/components/example-check"
import { LessonActivity } from "@/lib/features/student/components/lesson-activity"
import { CopySnippet } from "@/lib/features/student/components/copy-snippet"
import { LESSON_ILLUSTRATIONS } from "@shared/components/lesson-illustrations"
import { getSimulator } from "@shared/lib/content/simulators"
import type { LessonBlock } from "@shared/lib/content/lesson-blocks"

const IMG_CLASS = "mx-auto my-8 w-full max-w-full rounded-lg"
// Los logos por tema (imagen de bienvenida) conservan su tamaño original, mas chico.
const LOGO_CLASS = "mx-auto my-8 max-h-80 w-auto max-w-full rounded-lg"

/** Renders a lesson: markdown chunks interleaved with its image/video directives. */
export function LessonBody({ blocks }: { blocks: LessonBlock[] }) {
  const isSimulator = blocks.some((b) => b.kind === "simulator")
  return (
    <div
      className={
        isSimulator
          ? "flex-1 flex flex-col overflow-hidden"
          : "lesson-prose [&>*:first-child]:mt-0"
      }
    >
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "markdown":
            return <Markdown key={i}>{block.content}</Markdown>

          // Rendered separately, after the nav (see ContentArea).
          case "sources":
            return null

          case "terminal":
            return <TerminalBlock key={i} command={block.command} output={block.output} />

          case "image":
            return block.exists ? (
              // eslint-disable-next-line @next/next/no-img-element
              // `lazy` porque una leccion larga puede traer varias imagenes y
              // las de mas abajo no tienen por que retrasar lo que ya se ve.
              <img
                key={i}
                src={block.src}
                alt={block.alt}
                loading="lazy"
                decoding="async"
                className={IMG_CLASS}
              />
            ) : (
              <Pending
                key={i}
                icon={ImageIcon}
                title="Imagen pendiente"
                detail={block.alt}
                paths={[block.expectedPath]}
              />
            )

          case "image-theme":
            return block.exists ? (
              <span key={i} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.lightSrc}
                  alt={block.alt}
                  className={`${LOGO_CLASS} block dark:hidden`}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.darkSrc}
                  alt={block.alt}
                  className={`${LOGO_CLASS} hidden dark:block`}
                />
              </span>
            ) : (
              <Pending
                key={i}
                icon={ImageIcon}
                title="Imagen pendiente (tema claro / oscuro)"
                detail={block.alt}
                paths={block.expectedPaths}
              />
            )

          case "video":
            return block.exists ? (
              <video
                key={i}
                src={block.src}
                controls
                preload="metadata"
                // El fondo va en el color de la tarjeta, no en negro: los videos
                // se renderizan sobre el fondo claro del sitio, y un contenedor
                // negro les pone banda alrededor y da un destello al cargar.
                className="w-full my-8 rounded-lg border border-border bg-card"
              />
            ) : (
              <Pending
                key={i}
                icon={Film}
                title="Video pendiente"
                detail={block.title}
                paths={[block.expectedPath]}
              />
            )

          case "simulator":
            return (
              <iframe
                key={i}
                src={block.src}
                className="flex-1 w-full border-0"
                title="Simulador interactivo del sistema de archivos"
                allow="same-origin"
              />
            )

          case "fs-tree":
            return <FilesystemHierarchy key={i} />

          case "terminal-demo":
            return <TerminalDemoButton key={i} />

          case "exercise":
            return <ExerciseCheck key={i} slug={block.slug} snippet={block.snippet} />

          case "example-check":
            return <ExampleCheck key={i} />

          case "activity":
            return <LessonActivity key={i} slugs={block.slugs} />

          case "snippet":
            return <CopySnippet key={i} id={block.id} />

          case "illustration": {
            // Una directiva con un id que no existe se ve, igual que una imagen
            // que aun no esta puesta, en vez de desaparecer sin dejar rastro.
            const Illustration = LESSON_ILLUSTRATIONS[block.id]
            return Illustration ? (
              <Illustration key={i} />
            ) : (
              <Pending
                key={i}
                icon={ImageIcon}
                title="Ilustración desconocida"
                detail={block.id}
                paths={Object.keys(LESSON_ILLUSTRATIONS)}
              />
            )
          }

          case "simulator-card": {
            const sim = getSimulator(block.id)
            return sim ? (
              <div key={i} className="my-10 max-w-md">
                <h2 className="mb-4 text-left text-2xl font-bold text-foreground">
                  Prueba tus conocimientos con un{" "}
                  <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text font-extrabold text-transparent">
                    Simulador
                  </span>
                </h2>
                <SimulatorCard simulator={sim} />
              </div>
            ) : null
          }
        }
      })}
    </div>
  )
}

/**
 * Una sesion de shell dentro de una leccion, sobre la misma superficie de la
 * terminal real. El corte entre entrada y salida es horizontal, como en una
 * consola: primero el comando y debajo lo que responde. Partirlo en dos
 * columnas repartia mal el ancho — el lado corto quedaba vacio y el largo con
 * scroll — y rompia la lectura de arriba hacia abajo.
 *
 * Cada mitad desborda en horizontal por su cuenta, asi una salida ancha no
 * estira la caja ni obliga a la pagina a moverse de lado.
 */
function TerminalBlock({ command, output }: { command: string; output?: string }) {
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-white/10 bg-terminal-surface font-mono text-sm leading-6">
      <div className="overflow-x-auto px-4 py-3">
        {command.split("\n").map((line, i) => (
          <div key={i} className="flex gap-2 whitespace-pre">
            {/* El mismo rojo del prompt de la terminal del curso. */}
            <span className="shrink-0 select-none text-[#ff5470]">$</span>
            <span className="text-zinc-100">
              <ShellCommand line={line} />
            </span>
          </div>
        ))}
      </div>

      {output && (
        <div className="overflow-x-auto border-t border-white/10 px-4 py-3">
          <pre className="whitespace-pre text-zinc-400">{output}</pre>
        </div>
      )}
    </div>
  )
}

function Pending({
  icon: Icon,
  title,
  detail,
  paths,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  detail: string
  paths: string[]
}) {
  return (
    <div className="my-8 border border-dashed border-border rounded-lg py-10 px-6 text-center">
      <Icon className="w-6 h-6 mx-auto text-muted-foreground mb-3" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {detail && <p className="text-xs text-muted-foreground mt-1">{detail}</p>}
      <div className="mt-3 space-y-0.5">
        {paths.map((p) => (
          <p key={p} className="text-[11px] font-mono text-muted-foreground">
            {p}
          </p>
        ))}
      </div>
    </div>
  )
}
