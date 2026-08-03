import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import type { Components } from "react-markdown"
import { CodeWindow } from "@/components/shared/code-window"

/** Texto plano de un nodo, para poder inspeccionar el contenido de una marca. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  return ""
}

/** Renders lesson markdown with the LinuxLab theme. */
const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-4xl font-bold text-foreground mt-2 mb-5">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-3xl font-bold text-foreground mt-12 mb-5">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-2xl font-semibold text-foreground mt-8 mb-3">{children}</h3>
  ),
  // El cuerpo va en el color de texto pleno. En gris quedaba lavado y hacia
  // ver la leccion como una nota al pie en vez del contenido principal.
  p: ({ children }) => <p className="text-lg text-foreground leading-8 my-5">{children}</p>,
  ul: ({ children }) => (
    <ul className="list-disc pl-6 space-y-2.5 my-5 text-lg leading-8 text-foreground">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-6 space-y-2.5 my-5 text-lg leading-8 text-foreground">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  // La negrita queda reservada a etiquetas del tipo "**Nombre:** descripcion".
  // El enfasis suelto a mitad de frase se pinta como texto normal: repartir
  // palabras resaltadas por el parrafo distrae y le roba peso a las etiquetas,
  // que son las que si marcan estructura.
  strong: ({ children }) => {
    const isLabel = textOf(children).trimEnd().endsWith(":")
    if (!isLabel) return <>{children}</>
    return <strong className="font-semibold text-foreground">{children}</strong>
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-primary hover:underline"
    >
      {children}
    </a>
  ),
  // La cita se lee, no se susurra: el texto va en el color pleno y lo que la
  // separa del cuerpo es la barra de acento y la cursiva, no el gris.
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-2 border-primary/50 pl-5 italic text-foreground [&_p]:my-2 [&_p]:text-base">
      {children}
    </blockquote>
  ),
  // Every fenced block gets the same window frame. Shell commands are pulled out
  // earlier as terminal blocks (see lib/content/lesson-blocks.ts), so what reaches
  // here are diagrams and quoted text: same frame, no "bash" label.
  pre: ({ children }) => <CodeWindow>{children}</CodeWindow>,
  code: ({ className, children }) => {
    const text = String(children)
    const isInline = !className && !text.includes("\n")
    if (isInline) {
      return (
        <code className="bg-secondary px-1.5 py-0.5 rounded text-primary font-mono text-[0.85em]">
          {children}
        </code>
      )
    }
    return <code className="block text-zinc-100 font-mono whitespace-pre">{children}</code>
  },
  hr: () => <hr className="my-6 border-border" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border border-border">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 border border-border bg-card text-foreground font-medium">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 border border-border text-foreground">{children}</td>
  ),
}

/**
 * `rehypeRaw` enables inline HTML authored inside the lesson markdown (e.g.
 * `<span class="text-primary">`). Safe here because lesson content is authored by
 * the team and read from disk, never user input.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={components}
    >
      {children}
    </ReactMarkdown>
  )
}
