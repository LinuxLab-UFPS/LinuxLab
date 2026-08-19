import { cn } from "@shared/lib/utils"

/* Un solo color: el panel de actividades iba en ambar y era el unico sitio
   donde este boton no era rojo. */
const IDLE = "border-primary/60 text-primary hover:border-primary hover:bg-primary/10"
/* Abierto va con relleno pleno y el icono en blanco, como el boton de terminal
   del curso: es un interruptor encendido y tiene que leerse como tal de un
   vistazo. Cerrado se queda perfilado, que es una invitacion, no un estado. */
const ACTIVE = "border-primary bg-primary text-primary-foreground hover:bg-primary/90"

/**
 * The switch for a panel around the terminal: a small square with the icon of
 * whatever is inside it. Two of them stacked come out the height of one command
 * chip, so the row under the terminal lines up. Outlined it means "open this";
 * filled it means the panel is showing and this closes it. Both sides use the
 * same square, so an open panel and a closed one always read the same.
 */
export function CollapsedPanelButton({
  label,
  icon: Icon,
  onClick,
  active = false,
  className,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  active?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
        active ? ACTIVE : IDLE,
        className,
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  )
}
