"use client"

import { cn } from "@/lib/utils"

type Status = "completed" | "in-progress" | "not-started" | "overdue"

interface StatusIndicatorProps {
  status: Status
  size?: "sm" | "md"
}

export function StatusIndicator({ status, size = "md" }: StatusIndicatorProps) {
  const sizeClasses = size === "sm" ? "w-3 h-3" : "w-4 h-4"
  
  return (
    <div className="flex items-center justify-center">
      {status === "completed" && (
        <div className={cn(sizeClasses, "bg-success rounded-full")} />
      )}
      {status === "in-progress" && (
        <div className={cn(sizeClasses, "rounded-full border-2 border-warning relative overflow-hidden")}>
          <div className="absolute inset-0 bg-warning w-1/2" />
        </div>
      )}
      {status === "not-started" && (
        <div className={cn(sizeClasses, "rounded-full border-2 border-muted-foreground")} />
      )}
      {status === "overdue" && (
        <div className={cn(sizeClasses, "bg-danger rounded-full")} />
      )}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  className?: string
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const getColor = (val: number) => {
    if (val >= 80) return "bg-success"
    if (val >= 50) return "bg-warning"
    return "bg-danger"
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-1.5 bg-secondary/50 overflow-hidden">
        <div 
          className={cn("h-full transition-all duration-300", getColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-10 text-right">{value}%</span>
    </div>
  )
}

interface CircularProgressProps {
  value: number
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
}

export function CircularProgress({ value, size = "lg", showLabel = true }: CircularProgressProps) {
  const sizeConfig = {
    sm: { width: 60, strokeWidth: 4, fontSize: "text-sm" },
    md: { width: 80, strokeWidth: 5, fontSize: "text-lg" },
    lg: { width: 120, strokeWidth: 6, fontSize: "text-3xl" },
  }
  
  const config = sizeConfig[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (value / 100) * circumference
  
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={config.width}
        height={config.width}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          className="text-secondary"
        />
        {/* Progress circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold font-mono", config.fontSize)}>
            {value}%
          </span>
        </div>
      )}
    </div>
  )
}
