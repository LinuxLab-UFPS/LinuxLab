import {
  Terminal,
  SquareTerminal,
  FolderTree,
  FilePlus,
  ShieldCheck,
  Archive,
  Search,
  Users,
  Activity,
  Server,
  Code2,
  Package,
  type LucideIcon,
} from "lucide-react"

/**
 * Presentation-only mapping of temario topic number → icon. Kept out of the
 * temario data so the content stays pure (no React/icon dependency).
 */
const TOPIC_ICONS: Record<number, LucideIcon> = {
  1: Terminal, // Introducción a Linux
  2: SquareTerminal, // La Terminal
  3: FolderTree, // Directorios
  4: FilePlus, // Creación de archivos
  5: ShieldCheck, // Permisos
  6: Archive, // Compresión
  7: Search, // Búsqueda
  8: Users, // Usuarios y grupos
  9: Activity, // Gestión de procesos
  10: Server, // Servicios y demonios
  11: Code2, // Shell scripting
  12: Package, // Instalación de paquetes (complementario)
}

export function topicIcon(topicNumber: number): LucideIcon {
  return TOPIC_ICONS[topicNumber] ?? Terminal
}
