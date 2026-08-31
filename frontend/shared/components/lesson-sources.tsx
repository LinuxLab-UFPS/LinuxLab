import { ChevronRight } from "lucide-react"
import { Markdown } from "@shared/components/markdown"

/**
 * The lesson's bibliography, collapsed by default. It stays attached to the
 * lesson it belongs to (the resources below are topic-wide and repeat across
 * subtopics), but folded away so it does not sit between the reader and the
 * "Siguiente" button.
 *
 * No top border: the nav above it already provides the separation.
 */
export function LessonSources({ content }: { content: string }) {
  return (
    <details className="group mt-6">
      <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-medium text-muted-foreground hover:text-foreground transition-colors [&::-webkit-details-marker]:hidden">
        <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-open:rotate-90" />
        Fuentes
      </summary>
      {/* Sin `pl-6` aqui: la lista de dentro ya trae el suyo, y los dos juntos
          robaban 48px de ancho a las URLs, que son lo mas largo de la pagina. */}
      <div className="mt-2 [&_ul]:my-2 [&_li]:text-xs [&_p]:text-xs">
        <Markdown>{content}</Markdown>
      </div>
    </details>
  )
}
