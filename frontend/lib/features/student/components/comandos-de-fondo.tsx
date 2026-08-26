"use client"

import { useEffect, useState } from "react"

/**
 * Comandos del curso escribiendose solos por el fondo de la portada.
 *
 * La idea es que el fondo diga lo que la plataforma es, sin explicarlo: quien
 * llega ve una pantalla llena de terminal antes de leer una sola linea.
 *
 * Lo importante del efecto es que NADA vaya sincronizado. Cada ranura tiene su
 * propio ciclo —elige un comando, lo teclea letra a letra, lo deja puesto, se
 * apaga y vuelve a empezar con otro— y cada vuelta dura distinto. Asi una esta
 * escribiendo mientras otra ya se apaga, que es lo que hace que parezca vivo en
 * vez de una animacion en bucle.
 */

/** Comandos que salen de verdad en el temario. */
const COMANDOS = [
  "ls -l /home",
  "cd Documentos",
  "pwd",
  "mkdir -p practicas/tema-03",
  "touch notas.txt",
  "cat materia.txt",
  "chmod 755 script.sh",
  "chmod u+x arranque.sh",
  "umask 022",
  "grep -r 'error' logs/",
  "grep -c AVISO registros/",
  "find . -name '*.log'",
  "sort -t, -k2 -n -r datos.csv",
  "tar -czf entrega.tar.gz informe/",
  "gzip bitacora.txt",
  "ps -o pid,stat,cmd",
  "pkill worker",
  "kill -l 9",
  "id",
  "getent group grp_curso",
  "ls /etc | head -n 20 | tail -n 5",
  "echo 'Hello World!'",
  "wc -l materia.txt",
  "vi 1152186.txt",
]

/**
 * Donde vive cada comando, en porcentajes.
 *
 * A mano y no en rejilla: repartidos por los margenes y esquivando la franja
 * central, que es donde van el titulo y el boton. Con posiciones al azar unas
 * se pisaban y otras dejaban medio fondo vacio.
 */
const RANURAS = [
  { top: "12%", left: "6%" },
  { top: "22%", left: "68%" },
  { top: "30%", left: "18%" },
  { top: "16%", left: "44%" },
  { top: "38%", left: "78%" },
  { top: "46%", left: "4%" },
  { top: "58%", left: "62%" },
  { top: "66%", left: "14%" },
  { top: "72%", left: "82%" },
  { top: "80%", left: "34%" },
  { top: "88%", left: "70%" },
  { top: "54%", left: "88%" },
]

/** Milisegundos por caracter al teclear. */
const MS_POR_LETRA = 55
/** Lo que dura una vuelta completa, sorteado en cada ciclo. */
const CICLO_MIN_MS = 4000
const CICLO_MAX_MS = 11000

const alAzar = <T,>(lista: readonly T[]) => lista[Math.floor(Math.random() * lista.length)]
const entre = (min: number, max: number) => min + Math.random() * (max - min)

interface Estado {
  texto: string
  /** Escribiendo, puesto o apagandose: decide la opacidad y el cursor. */
  fase: "escribiendo" | "puesto" | "saliendo"
}

/**
 * Una ranura, con su ciclo propio.
 *
 * Todo el azar vive dentro del `useEffect` y nunca en el render: si saliera del
 * render, el servidor y el navegador pintarian textos distintos y React se
 * quejaria de que el HTML no coincide.
 */
function Ranura({ top, left }: { top: string; left: string }) {
  const [estado, setEstado] = useState<Estado>({ texto: "", fase: "escribiendo" })
  const [quieto, setQuieto] = useState(false)

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setQuieto(true)
      setEstado({ texto: alAzar(COMANDOS), fase: "puesto" })
      return
    }

    // Se guardan todos para poder cortarlos al desmontar: si no, los ciclos
    // seguirian corriendo mientras el estudiante usa el resto de la aplicacion.
    const pendientes = new Set<number>()
    const luego = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        pendientes.delete(id)
        fn()
      }, ms)
      pendientes.add(id)
    }

    const vuelta = () => {
      const comando = alAzar(COMANDOS)
      const tecleado = comando.length * MS_POR_LETRA
      // El ciclo nunca puede ser mas corto que lo que cuesta escribirlo.
      const total = Math.max(entre(CICLO_MIN_MS, CICLO_MAX_MS), tecleado + 1500)

      setEstado({ texto: "", fase: "escribiendo" })

      for (let i = 1; i <= comando.length; i++) {
        luego(() => setEstado({ texto: comando.slice(0, i), fase: "escribiendo" }), i * MS_POR_LETRA)
      }
      luego(() => setEstado({ texto: comando, fase: "puesto" }), tecleado + 120)
      luego(() => setEstado({ texto: comando, fase: "saliendo" }), total - 700)
      // La pausa antes de la siguiente tambien cambia, para que dos ranuras que
      // hayan coincidido una vez no se queden emparejadas.
      luego(vuelta, total + entre(400, 2200))
    }

    // El arranque escalonado: sin esto las doce empezarian a la vez.
    luego(vuelta, entre(0, 3500))

    return () => {
      for (const id of pendientes) window.clearTimeout(id)
      pendientes.clear()
    }
  }, [])

  return (
    <span
      className={[
        "absolute whitespace-nowrap font-mono text-sm font-bold text-primary sm:text-base",
        "transition-opacity duration-700 ease-out",
        estado.fase === "saliendo" ? "opacity-0" : "opacity-25",
      ].join(" ")}
      style={{ top, left }}
    >
      {estado.texto}
      {!quieto && estado.fase === "escribiendo" && estado.texto && (
        <span className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.1em] bg-primary" />
      )}
    </span>
  )
}

export function ComandosDeFondo() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {RANURAS.map((ranura) => (
        <Ranura key={`${ranura.top}-${ranura.left}`} {...ranura} />
      ))}
    </div>
  )
}
