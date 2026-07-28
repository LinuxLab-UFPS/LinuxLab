"use client"

import { ClipboardList } from "lucide-react"
import { Navbar } from "@/components/shared/navbar"
import { TerminalEmulator } from "@/components/shared/terminal-emulator"

export default function ActivityPage() {
  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-[40%] flex-shrink-0 bg-card border-r border-border flex items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-lg bg-secondary/60 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-muted-foreground" />
            </div>
            <h1 className="text-base font-medium text-foreground mb-1">
              No hay actividad seleccionada
            </h1>
            <p className="text-sm text-muted-foreground">
              Abre una actividad desde un tema del curso. Las instrucciones, los pasos
              y la validación se cargarán aquí.
            </p>
          </div>
        </div>

        <div className="flex-1 p-4">
          <TerminalEmulator />
        </div>
      </div>
    </div>
  )
}
