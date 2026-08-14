"use client"

import { LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  isLive?: boolean
}

export function MetricCard({ title, value, icon: Icon, isLive }: MetricCardProps) {
  return (
    <div className="bg-card border border-border p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
      <div className="w-10 h-10 bg-secondary/50 flex items-center justify-center shrink-0">
        {isLive ? (
          <div className="relative">
            <div className="w-3 h-3 bg-success rounded-full pulse-dot" />
            <div className="absolute inset-0 w-3 h-3 bg-success rounded-full opacity-40 animate-ping" />
          </div>
        ) : (
          <Icon className="w-5 h-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{title}</span>
        <span className="text-2xl font-semibold font-mono text-foreground">
          {value}
        </span>
      </div>
    </div>
  )
}
