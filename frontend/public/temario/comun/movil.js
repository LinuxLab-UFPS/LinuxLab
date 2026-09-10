/* El teclado de los simuladores en pantalla tactil.
 *
 * Cinco de los seis leen las teclas con `document.addEventListener("keydown")`
 * y no tienen ningun campo donde escribir: en un movil no hay nada que tocar,
 * asi que el teclado del sistema no se abre nunca y el simulador es injugable
 * por bonito que quede el apilado.
 *
 * Esto inyecta una barra de escritura abajo y reenvia lo que se teclee como
 * eventos `keydown` sobre `document`, que es exactamente lo que esos
 * manejadores ya esperan. No se toca la logica de ningun simulador.
 *
 * Se escucha `input` y no `keydown` del campo a proposito: los teclados
 * virtuales mandan `key: "Unidentified"` en `keydown`, asi que la unica forma
 * fiable de saber que se escribio es comparar el valor antes y despues.
 */
(function () {
  "use strict"

  /* Solo en pantallas tactiles, no por anchura.
   *
   * Con el corte por ancho, un computador con la ventana pequeña se llevaba la
   * barra tambien: se podia escribir en ella y directamente en el simulador, y
   * no habia forma de saber cual de los dos era el sitio. La barra existe porque
   * cinco de los seis simuladores no tienen ningun campo donde tocar y sin ella
   * el teclado del sistema no se abre nunca, o sea que hace falta exactamente
   * donde el teclado es en pantalla y en ningun otro sitio.
   *
   * `pointer: coarse` es el dedo: telefonos y tablets si, raton no, y sigue
   * valiendo en una tablet grande apaisada, que por ancho se habria quedado
   * fuera. */
  function esTactil() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches
    )
  }

  /** Manda una tecla al simulador como si viniera de un teclado de verdad. */
  function enviarTecla(key) {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: key, bubbles: true, cancelable: true }),
    )
  }

  function montar() {
    if (document.getElementById("barra-teclado")) return

    var barra = document.createElement("form")
    barra.id = "barra-teclado"
    barra.setAttribute("autocomplete", "off")

    var campo = document.createElement("input")
    campo.type = "text"
    campo.id = "teclado-movil"
    campo.setAttribute("autocomplete", "off")
    campo.setAttribute("autocapitalize", "none")
    campo.setAttribute("autocorrect", "off")
    campo.setAttribute("spellcheck", "false")
    campo.setAttribute("aria-label", "Escribe un comando")
    campo.placeholder = "Escribe un comando…"

    var enviar = document.createElement("button")
    enviar.type = "submit"
    enviar.setAttribute("aria-label", "Enviar")
    enviar.textContent = "↵"

    barra.appendChild(campo)
    barra.appendChild(enviar)
    document.body.appendChild(barra)

    var anterior = ""

    campo.addEventListener("input", function () {
      var ahora = campo.value
      if (ahora.length < anterior.length) {
        for (var i = 0; i < anterior.length - ahora.length; i++) enviarTecla("Backspace")
      } else {
        var nuevos = ahora.slice(anterior.length)
        for (var j = 0; j < nuevos.length; j++) enviarTecla(nuevos[j])
      }
      anterior = ahora
    })

    // Las flechas del historial, para quien tenga teclado fisico conectado.
    campo.addEventListener("keydown", function (e) {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault()
        enviarTecla(e.key)
      }
    })

    barra.addEventListener("submit", function (e) {
      e.preventDefault()
      enviarTecla("Enter")
      campo.value = ""
      anterior = ""
      // Se mantiene el foco para poder encadenar comandos sin volver a tocar.
      campo.focus()
    })
  }

  function quitar() {
    var barra = document.getElementById("barra-teclado")
    if (barra) barra.remove()
  }

  function revisar() {
    if (esTactil()) montar()
    else quitar()
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", revisar)
  } else {
    revisar()
  }
  window.addEventListener("resize", revisar)
})()
