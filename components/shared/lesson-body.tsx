import { Image as ImageIcon, Film } from "lucide-react"
import { Markdown } from "@/components/shared/markdown"
import { CodeWindow } from "@/components/shared/code-window"
import { SimulatorCard } from "@/components/student/simulator-card"
import { FilesystemHierarchy } from "@/components/shared/filesystem-hierarchy"
import { getSimulator } from "@/lib/features/shared/simulators"
import type { LessonBlock } from "@/lib/features/shared/lesson-blocks"

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
              <img key={i} src={block.src} alt={block.alt} className={IMG_CLASS} />
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
                className="w-full my-8 rounded-lg border border-border bg-black"
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

          case "simulator-card": {
            const sim = getSimulator(block.id)
            return sim ? (
              <div key={i} className="mx-auto my-10 max-w-sm">
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
 * A terminal window inside a lesson. Same chrome as the app's live terminal, so
 * a command in the material and a command in the real terminal look alike.
 * Command and its output share one window: they are one session.
 */
function TerminalBlock({ command, output }: { command: string; output?: string }) {
  return (
    <CodeWindow label="bash — student@linuxlab">
      <pre className="text-zinc-100 whitespace-pre">{command}</pre>
      {output && (
        <pre className="text-zinc-400 whitespace-pre mt-2 pt-2 border-t border-zinc-800">
          {output}
        </pre>
      )}
    </CodeWindow>
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
