"use client"

import { useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { sendToTerminal } from "@/lib/features/student/terminal-input"
import { useProgramaAPantallaCompleta } from "@/lib/features/student/use-cwd"
import { lessonActivityQuery } from "@/lib/features/student/use-activity-check"

const HOME = "~"

/**
 * La terminal entra sola en el directorio de la actividad, y vuelve al home al
 * salir de ella.
 *
 * Este era el tropiezo mas repetido de la primera clase: la actividad se
 * resuelve dentro de `~/actividades/<workdir>` y se comprueba ahi, pero nada
 * llevaba al estudiante hasta el directorio salvo un boton que hay que ver y
 * pulsar. Quien no lo pulsaba trabajaba entero en su home y la comprobacion no
 * encontraba nada.
 *
 * Va aqui, un solo efecto en el espacio de trabajo, y no en cada panel a
 * proposito. Con un efecto por panel el salto de una actividad a otra (el enlace
 * "siguiente tema") cruzaria dos ordenes: el `cd ~` de la que se desmonta y el
 * `cd` de la que se monta, en un orden que no controlamos. Aqui solo hay un
 * destino a la vez y las transiciones salen solas:
 *
 *   terminal sin actividad → actividad     `cd` al directorio de la actividad
 *   actividad → sugerencias               `cd ~`
 *   actividad A → actividad B             `cd` directo al de B
 *
 * `sendToTerminal` encola hasta que abre el WebSocket, asi que dispararlo al
 * montar es seguro.
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

  /* `null` es "todavia no se sabe", que no es lo mismo que "el home": sin esta
     distincion, abrir una actividad mandaba primero un `cd ~` y despues el de la
     actividad, y la terminal aparecia con dos ordenes que nadie escribio. */
  const destino: string | null = !activo
    ? null
    : workdirDeGrupo
      ? `~/actividades/${workdirDeGrupo}`
      : slug
        ? data
          // `universidad-facultades` no declara directorio: monta su arbol en el
          // home a proposito, asi que ahi el home es el destino correcto.
          ? (data.workdir ? `~/actividades/${data.workdir}` : HOME)
          : null
        : HOME

  /* Arranca en el home porque es donde arranca la shell. Asi una carga directa
     de la terminal sin actividad no escribe un `cd ~` que no hace nada. */
  const ultimo = useRef(HOME)

  useEffect(() => {
    if (destino === null || aPantallaCompleta) return
    if (ultimo.current === destino) return
    ultimo.current = destino
    // Ctrl+U primero: si habia algo escrito a medias, un Enter suelto lo
    // ejecutaria. Y `mkdir -p` antes del `cd` porque el directorio solo lo monta
    // `setup.py` cuando la actividad trae archivos de partida; sin el, el `cd`
    // fallaba en silencio y el estudiante se quedaba en su home creyendo que ya
    // estaba dentro.
    sendToTerminal(
      destino === HOME ? "\x15cd ~\n" : `\x15mkdir -p ${destino} && cd ${destino}\n`,
    )
  }, [destino, aPantallaCompleta])
}
