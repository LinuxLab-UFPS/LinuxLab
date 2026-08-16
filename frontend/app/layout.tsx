import type { Metadata } from 'next'
import { Onest, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@shared/components/theme-provider'
import { AuthProvider } from '@/lib/features/auth/context'
import { QueryProvider } from '@/lib/api/query-provider'
import { Toaster } from '@shared/components/ui/sonner'
import { TooltipProvider } from '@shared/components/ui/tooltip'
import './globals.css'

// Onest para el cuerpo (look tipo AlgoMaster) y Geist Mono para terminal/codigo.
const onest = Onest({ subsets: ["latin"], variable: "--font-onest", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: 'LinuxLab UFPS - Plataforma de Aprendizaje',
  description: 'Plataforma de aprendizaje interactiva para la administración de sistemas Linux',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={`${onest.variable} ${geistMono.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* `disableTransitionOnChange`: el cambio de tema es instantaneo. Habia
            un crossfade de 0.28s sobre todos los colores y se notaba como un
            barrido lento; ademas obligaba a cada elemento de la pagina a animar
            sus colores tambien al pasar el raton. Los componentes que quieren
            transicion la declaran ellos con `transition-colors`. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              <TooltipProvider delayDuration={150}>
                {children}
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
