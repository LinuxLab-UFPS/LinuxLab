"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useCwd, useProgramaAPantallaCompleta } from "@/lib/features/student/use-cwd"
import { lessonActivityQuery } from "@/lib/features/student/use-activity-check"
import { HOME, confirmarDirectorio, irA } from "@/lib/features/student/directorio-terminal"

/**
 * La terminal entra sola en el directorio de la actividad abierta.
 *
 * Este era el tropiezo mas repetido de la primera clase: la actividad se
 * resuelve dentro de `~/actividades/<workdir>` y se comprueba ahi, pero nada
 * llevaba al estudiante hasta el directorio salvo un boton que hay que ver y
 * pulsar. Quien no lo pulsaba trabajaba entero en su home y la comprobacion no
 * encontraba nada.
 *
 * Va aqui, un solo efecto para la pantalla entera, y no en cada panel a
 * proposito. Con un efecto por panel el salto de una actividad a otra (el enlace
 * "siguiente tema") cruzaria dos ordenes: el `cd ~` de la que se desmonta y el
 * `cd` de la que se monta, en un orden que no controlamos. Aqui solo hay un
 * destino a la vez y las transiciones salen solas.
 *
 * La vuelta al home cuando no hay actividad NO esta aqui: la hace
 * `DirectorioAutomatico` desde la raiz, porque salir de una actividad hacia el
 * curso desmonta esta pantalla y su efecto ya no llegaria a correr.
 */
export function useDirectorioAutomatico({
  activo,
  slug,
  workdirDeGrupo,
}: {
  /** Solo los estudiantes tienen actividades; el docente entra a la consola pelada. */
  activo: boolean
  /** La actividad del temario que este abierta, si hay alguna. */
  slug: string | null
  /** La del curso, que si trae su directorio en las propiedades. */
  workdirDeGrupo: string | null
}) {
  /* Las del temario no traen el directorio en la URL, hay que preguntarlo. Es la
     misma consulta que hace el panel, con la misma clave, asi que react-query la
     atiende una vez: no hay peticion de mas. */
  const { data } = useQuery({
    ...lessonActivityQuery(slug ?? ""),
    enabled: activo && Boolean(slug) && !workdirDeGrupo,
  })

  /* Con `vi` o `top` abiertos lo que se manda no se ejecuta: se teclea dentro
     del programa. Se espera a que cierre. */
  const aPantallaCompleta = useProgramaAPantallaCompleta()
  const ruta = useCwd()

  /* `universidad-facultades` no declara directorio: monta su arbol en el home a
     proposito, asi que ahi el home es el destino correcto. */
  const workdir = workdirDeGrupo ?? (slug ? (data?.workdir ?? null) : null)
  const esperandoDatos = activo && Boolean(slug) && !workdirDeGrupo && !data

  const destino: string | null =
    !activo || esperandoDatos ? null : workdir ? `~/actividades/${workdir}` : HOME

  useEffect(() => {
    if (aPantallaCompleta) return
    irA(destino, workdir)
  }, [destino, workdir, aPantallaCompleta])

  /* La shell dice donde esta en cada prompt. Cuando lo que dice coincide con el
     destino, el viaje termino y el panel deja de esperar. */
  useEffect(() => {
    if (!workdir || ruta === null) return
    if (ruta.endsWith(`/actividades/${workdir}`) || ruta.includes(`/actividades/${workdir}/`)) {
      confirmarDirectorio(workdir)
    }
  }, [ruta, workdir])
}
