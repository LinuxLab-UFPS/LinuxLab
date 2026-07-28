/**
 * The window chrome shared by every code block in a lesson: traffic-light dots,
 * the red accent line and the dark body.
 *
 * `label` is only set for real terminal sessions ("bash — student@linuxlab").
 * Blocks that are not a shell session (ASCII diagrams, quoted messages) get the
 * same frame but no label, so they look consistent without pretending to be a
 * terminal.
 */
export function CodeWindow({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <div className="my-6 rounded-lg overflow-hidden border border-primary/30">
      <div className="relative flex items-center px-4 py-2 bg-[#161616]">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        {label && (
          <span className="absolute left-1/2 -translate-x-1/2 text-xs font-mono text-zinc-400">
            {label}
          </span>
        )}
      </div>

      <div className="h-px bg-primary/50" />

      <div className="bg-[#0a0a0a] px-4 py-3 font-mono text-sm leading-6 overflow-x-auto">
        {children}
      </div>
    </div>
  )
}
