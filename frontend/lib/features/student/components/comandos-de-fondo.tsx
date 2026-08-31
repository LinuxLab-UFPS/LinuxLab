"use client"

import { useEffect, useRef, useState } from "react"

/**
 * Comandos del curso escribiendose solos por el fondo de la portada.
 *
 * La idea es que el fondo diga lo que la plataforma es, sin explicarlo: quien
 * llega ve una pantalla llena de terminal antes de leer una sola linea.
 *
 * Lo importante del efecto es que NADA vaya sincronizado. Cada ranura tiene su
 * propio ciclo —aparece, quiza se teclea, se queda y se apaga— y cada vuelta
 * dura distinto. Asi una esta escribiendo mientras otra ya se apaga.
 *
 * Sin libreria de animacion a proposito. Una como framer-motion pesa mas que
 * todo este archivo y aqui no aportaria: lo unico que se anima es opacidad y
 * desplazamiento, que el navegador ya compone en la GPU con CSS. Lo que si
 * costaba era React repintando por cada letra, y eso se arregla con un solo
 * temporizador por ranura en vez de uno por caracter.
 */

/** Comandos que salen de verdad en el temario. */
const COMANDOS = [
  "ls -l /home",
  "cd Documentos",
  "pwd",
  "mkdir -p practicas/tema-03",
  "touch notas.txt",
  "cat materia.txt",
  "cp -r proyectos respaldo",
  "mv informe.txt entregas/",
  "rm -r borradores",
  "chmod 755 script.sh",
  "chmod u+x arranque.sh",
  "chmod g+s compartido",
  "umask 022",
  "stat -c '%A %a %n' notas.txt",
  "grep -r 'error' logs/",
  "grep -c AVISO registros/",
  "grep -rh 'Causa raiz' incidencias/",
  "find . -name '*.log'",
  "find . -type d -name '.*'",
  "sort -t, -k2 -n -r datos.csv",
  "wc -l materia.txt",
  "head -n 20 app.log | tail -n 5",
  "tar -czf entrega.tar.gz informe/",
  "tar -tzf paquete.tar.gz",
  "gzip bitacora.txt",
  "ps -o pid,stat,cmd",
  "pkill worker",
  "kill -l 9",
  "jobs",
  "sleep 300 &",
  "id",
  "groups",
  "getent passwd $USER",
  "echo 'Hello World!'",
  "vi 1152186.txt",
  "./reporte.sh > reporte.txt",
]

/**
 * Donde vive cada comando, en porcentajes.
 *
 * A mano y no en rejilla. Se acercan bastante al texto por los dos costados,
 * pero ninguna entra en la columna central: ahi van el titulo y el subtitulo, y
 * un comando cruzando por detras se lee como suciedad y no como fondo. El texto
 * vive en un `max-w-3xl` centrado, asi que el pasillo prohibido es mas o menos
 * del 22% al 66% del ancho. Con posiciones al azar unas se pisaban y otras
 * dejaban medio bloque vacio.
 *
 * Ese pasillo solo existe con sitio de sobra. `max-w-3xl` son 768px FIJOS, asi
 * que en un escritorio de 1440px el texto ocupa el 23%-77% y los costados
 * quedan libres; en un movil de 375px ocupa el 6%-94% y no queda costado
 * ninguno. Por eso cada ranura dice en que zona vive: las de `lado` se esconden
 * en pantalla estrecha (`hidden sm:block`) y quedan solo las `franja`, que van
 * por encima y por debajo del texto y ahi no estorban a ningun ancho.
 */
const RANURAS = [
  // Columna izquierda
  { top: "5%", left: "4%", zona: "lado" },
  { top: "13%", left: "14%", zona: "lado" },
  { top: "22%", left: "3%", zona: "lado" },
  { top: "30%", left: "16%", zona: "lado" },
  { top: "39%", left: "5%", zona: "lado" },
  { top: "48%", left: "17%", zona: "lado" },
  { top: "57%", left: "3%", zona: "lado" },
  { top: "66%", left: "15%", zona: "lado" },
  { top: "75%", left: "6%", zona: "lado" },
  { top: "84%", left: "18%", zona: "lado" },
  { top: "92%", left: "8%", zona: "lado" },
  // Columna derecha
  { top: "6%", left: "70%", zona: "lado" },
  { top: "15%", left: "82%", zona: "lado" },
  { top: "24%", left: "68%", zona: "lado" },
  { top: "32%", left: "84%", zona: "lado" },
  { top: "41%", left: "71%", zona: "lado" },
  { top: "50%", left: "86%", zona: "lado" },
  { top: "59%", left: "69%", zona: "lado" },
  { top: "68%", left: "83%", zona: "lado" },
  { top: "77%", left: "72%", zona: "lado" },
  { top: "86%", left: "88%", zona: "lado" },
  { top: "94%", left: "74%", zona: "lado" },
  // Franjas de arriba y de abajo, por encima y por debajo del texto. Son las
  // unicas que quedan en movil, donde el texto se estira hasta ocupar del 12%
  // al 61% del alto, asi que se pegan a los extremos para no rozarlo.
  { top: "2%", left: "38%", zona: "franja" },
  { top: "6%", left: "56%", zona: "franja" },
  { top: "88%", left: "36%", zona: "franja" },
  { top: "94%", left: "58%", zona: "franja" },
]

/** Milisegundos por caracter al teclear. Despacio: es fondo, no un titular. */
const MS_POR_LETRA = 110
/** Lo que dura una vuelta completa, sorteado en cada ciclo. */
const CICLO_MIN_MS = 5000
const CICLO_MAX_MS = 14000
/** Lo que tardan el fundido de entrada y el de salida. */
const FUNDIDO_MS = 1100
/**
 * Cuantas ranuras se teclean. El resto solo aparece y desaparece.
 *
 * Es lo que rompe la sincronia de verdad: si todas escribieran, al cargar se
 * verian veinte cursores arrancando a la vez.
 */
const PROPORCION_QUE_TECLEA = 0.35

const alAzar = <T,>(lista: readonly T[]) => lista[Math.floor(Math.random() * lista.length)]
const entre = (min: number, max: number) => min + Math.random() * (max - min)

interface Estado {
  texto: string
  /** Encendida o apagada: es lo unico que decide la opacidad. */
  visible: boolean
  /** Solo mientras escribe, para pintar el cursor. */
  escribiendo: boolean
}

const APAGADA: Estado = { texto: "", visible: false, escribiendo: false }

/**
 * Una ranura, con su ciclo propio.
 *
 * Todo el azar vive dentro de los efectos y nunca en el render: si saliera del
 * render, el servidor y el navegador pintarian cosas distintas y React se
 * quejaria de que el HTML no coincide.
 */
function Ranura({ top, left, zona }: { top: string; left: string; zona: string }) {
  const [estado, setEstado] = useState<Estado>(APAGADA)
  const [quieto, setQuieto] = useState(false)
  // Cero hasta que monte, por lo mismo que el resto del azar.
  const [deriva, setDeriva] = useState({ duracion: 0, desfase: 0, invertida: false })
  const temporizadores = useRef<Set<number>>(new Set())

  useEffect(() => {
    setDeriva({
      // Muy lento a proposito: tiene que notarse solo si uno se queda mirando.
      duracion: entre(38, 70),
      desfase: entre(0, 70),
      invertida: Math.random() < 0.5,
    })
  }, [])

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setQuieto(true)
      setEstado({ texto: alAzar(COMANDOS), visible: true, escribiendo: false })
      return
    }

    const pendientes = temporizadores.current
    const luego = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        pendientes.delete(id)
        fn()
      }, ms)
      pendientes.add(id)
    }

    // Se decide una vez y para siempre: esta ranura teclea, o solo aparece.
    const teclea = Math.random() < PROPORCION_QUE_TECLEA

    const vuelta = () => {
      const comando = alAzar(COMANDOS)
      const tecleado = teclea ? comando.length * MS_POR_LETRA : 0
      const total = Math.max(entre(CICLO_MIN_MS, CICLO_MAX_MS), tecleado + FUNDIDO_MS * 2)

      if (!teclea) {
        // Ya escrita: entra entera con el fundido. Nunca de golpe.
        setEstado({ texto: comando, visible: true, escribiendo: false })
      } else {
        // Se enciende vacia y va apareciendo mientras escribe la primera letra,
        // asi que tampoco aparece de golpe.
        setEstado({ texto: "", visible: true, escribiendo: true })

        // UN solo intervalo, no un temporizador por letra.
        let n = 0
        const id = window.setInterval(() => {
          n += 1
          const parcial = comando.slice(0, n)
          setEstado({ texto: parcial, visible: true, escribiendo: n < comando.length })
          if (n >= comando.length) {
            window.clearInterval(id)
            pendientes.delete(id)
          }
        }, MS_POR_LETRA)
        pendientes.add(id)
      }

      // El fundido de salida es siempre, escriba o no.
      luego(() => setEstado((e) => ({ ...e, visible: false, escribiendo: false })), total - FUNDIDO_MS)
      // La pausa antes de la siguiente tambien cambia, para que dos ranuras que
      // hayan coincidido una vez no se queden emparejadas.
      luego(vuelta, total + entre(600, 3200))
    }

    // El arranque escalonado. Las que no teclean pueden salir casi de inmediato
    // para que la pagina no cargue vacia; las que teclean esperan mas.
    luego(vuelta, teclea ? entre(800, 6000) : entre(0, 2400))

    return () => {
      for (const id of pendientes) {
        window.clearTimeout(id)
        window.clearInterval(id)
      }
      pendientes.clear()
    }
  }, [])

  return (
    <span
      className={[
        "animate-deriva absolute whitespace-nowrap font-mono text-sm font-bold text-primary sm:text-base",
        // `neon-text` es la clase que ya usa el resto del sitio: en tema oscuro
        // pinta el halo rojo y en el claro vale `none`, asi que el brillo sale
        // donde hace falta y no ensucia el fondo blanco.
        "neon-text",
        // En pantalla estrecha el texto ocupa casi todo el ancho y los costados
        // dejan de existir, asi que las de los lados se retiran.
        zona === "lado" ? "hidden sm:block" : "",
        // El fundido es largo a proposito: lo que se quiere es que las cosas
        // cambien sin que se note el momento exacto en que cambian.
        "transition-opacity ease-in-out",
        estado.visible ? "opacity-40" : "opacity-0",
      ].join(" ")}
      style={{
        top,
        left,
        transitionDuration: `${FUNDIDO_MS}ms`,
        // Cada una deriva a su ritmo y en su sentido, para que el movimiento del
        // conjunto no se lea como una sola cinta corriendo.
        animationDuration: `${deriva.duracion}s`,
        animationDelay: `-${deriva.desfase}s`,
        animationDirection: deriva.invertida ? "alternate-reverse" : "alternate",
      }}
    >
      {estado.texto}
      {!quieto && estado.escribiendo && (
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
