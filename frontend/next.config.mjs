/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Los cursos se llamaban grupos: los enlaces viejos (marcadores, correos ya
  // enviados) siguen llegando a la misma pantalla.
  async redirects() {
    return [
      { source: "/grupos/:path*", destination: "/cursos/:path*", permanent: true },
      { source: "/estudiante/grupo", destination: "/estudiante/curso", permanent: true },
    ]
  },
}

export default nextConfig
