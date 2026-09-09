/**
 * El titulo grande de una pantalla, con su degradado y su barrita.
 *
 * Estaba copiado letra por letra en cinco paginas, y en dos de ellas el
 * degradado se habia ido por su cuenta —la bitacora en azul, el entorno en
 * verde—, asi que la aplicacion se leia como tres productos distintos. El color
 * de la marca vive aqui y no en cada pagina.
 *
 * `prefijo` es la parte que va en el color normal del texto, para los saludos
 * del tipo «Bienvenido, Mauricio»: solo el nombre lleva el degradado.
 */
export function TituloDeSeccion({
  prefijo,
  children,
}: {
  prefijo?: string
  children: React.ReactNode
}) {
  return (
    <>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
        {prefijo ? <span className="text-foreground">{prefijo}</span> : null}
        <span className="bg-gradient-to-r from-[#ff5470] via-[#f43f5e] to-[#C41E3A] bg-clip-text text-transparent">
          {children}
        </span>
      </h1>
      <span className="mt-3 block h-1 w-24 rounded-full bg-gradient-to-r from-[#ff5470] to-[#C41E3A]" />
    </>
  )
}
