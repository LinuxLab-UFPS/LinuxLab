import { X } from "lucide-react"
import { cn } from "@shared/lib/utils"

/**
 * The terminal window chrome shared across the app: traffic-light dots and a
 * title bar around whatever's inside (the live xterm.js emulator). onClose is
 * optional — omit it for a permanent terminal view (no way to dismiss it).
 * `toolbar` renders between the title bar and the body, for the terminal
 * settings (font size/family, reset).
 */
export function TerminalFrame({
  title = "student@linuxlab: ~",
  onClose,
  toolbar,
  className,
  children,
}: {
  title?: string
  onClose?: () => void
  toolbar?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#1a1d24] shadow-lg",
        className,
      )}
    >
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 bg-white/5 px-3">
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
          <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
        </span>
        <span className="flex-1 text-center font-mono text-xs text-white/50">{title}</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar terminal"
            className="text-white/40 transition-colors hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {toolbar && (
        <div className="shrink-0 border-b border-white/10 bg-white/[0.02] px-2 py-1.5">
          {toolbar}
        </div>
      )}
      <div className="flex-1 overflow-hidden p-2">{children}</div>
    </div>
  )
}
