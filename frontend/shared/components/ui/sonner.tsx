'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'color-mix(in srgb, var(--success) 12%, var(--popover))',
          '--success-text': 'var(--success)',
          '--success-border': 'color-mix(in srgb, var(--success) 35%, transparent)',
          '--error-bg': 'color-mix(in srgb, var(--danger) 12%, var(--popover))',
          '--error-text': 'var(--danger)',
          '--error-border': 'color-mix(in srgb, var(--danger) 35%, transparent)',
          '--info-bg': 'color-mix(in srgb, var(--primary) 12%, var(--popover))',
          '--info-text': 'var(--primary)',
          '--info-border': 'color-mix(in srgb, var(--primary) 35%, transparent)',
          '--warning-bg': 'color-mix(in srgb, var(--warning) 12%, var(--popover))',
          '--warning-text': 'var(--warning)',
          '--warning-border': 'color-mix(in srgb, var(--warning) 35%, transparent)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
