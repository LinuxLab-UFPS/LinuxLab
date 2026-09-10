import type { Metadata, Viewport } from 'next'
import { Onest, Geist_Mono, Fira_Code, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@shared/components/theme-provider'
import { AuthProvider } from '@/lib/features/auth/context'
import { QueryProvider } from '@/lib/api/query-provider'
import { Toaster } from '@shared/components/ui/sonner'
import { TooltipProvider } from '@shared/components/ui/tooltip'
import { DirectorioAutomatico } from '@/lib/features/student/components/directorio-automatico'
import './globals.css'

// Onest para el cuerpo (look tipo AlgoMaster) y Geist Mono para terminal/codigo.
const onest = Onest({ subsets: ["latin"], variable: "--font-onest", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

/* Las dos que puede elegir el estudiante para su terminal. Hasta ahora el
   selector ofrecia cinco fuentes de las que no se cargaba ninguna, asi que
   todas menos la primera caian en la monoespaciada generica y se veian
   identicas: de ahi que "solo funcionaran las dos primeras". Solo peso 400, que
   es lo unico que una terminal usa. */
const firaCode = Fira_Code({
  subsets: ["latin"], weight: "400", variable: "--font-fira-code", display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"], weight: "400", variable: "--font-jetbrains-mono", display: "swap",
});

/* Sin esto el telefono simula una pantalla ancha y encoge la pagina entera, que
   es justo lo contrario de lo que hacen las vistas de movil. `width=device-width`
   le dice que use su ancho real.

   Ojo: no impide el "solicitar sitio de escritorio" del navegador, que reporta
   un ancho falso de ~1024px. Eso es del navegador y ninguna pagina lo puede
   desactivar. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
}

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
    <html lang="es" className={`${onest.variable} ${geistMono.variable} ${firaCode.variable} ${jetbrainsMono.variable} bg-background`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {/* `disableTransitionOnChange`: el cambio de tema es instantaneo. Habia
            un crossfade de 0.28s sobre todos los colores y se notaba como un
            barrido lento; ademas obligaba a cada elemento de la pagina a animar
            sus colores tambien al pasar el raton. Los componentes que quieren
            transicion la declaran ellos con `transition-colors`. */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {/* QueryProvider va por fuera: al cerrar sesion, AuthProvider vacia la
              cache de React Query para que la siguiente cuenta no herede las
              respuestas de la anterior, y para eso necesita el cliente. */}
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider delayDuration={150}>
                {/* Vigila la ruta para devolver la shell al home al salir de una
                    actividad. No pinta nada; va aqui porque tiene que seguir
                    vivo entre paginas, igual que la sesion de terminal. */}
                <DirectorioAutomatico />
                {children}
                <Toaster richColors position="top-right" />
              </TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
