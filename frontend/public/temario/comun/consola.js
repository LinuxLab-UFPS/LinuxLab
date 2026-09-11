/* La linea de comandos de los simuladores.
 *
 * Los cinco simuladores con consola leian las teclas de `document` y pintaban
 * lo tecleado en un <span>, imitando un cursor. Funcionaba con teclado fisico y
 * no funcionaba en ningun telefono: sin un campo enfocable no hay forma de que
 * el sistema abra su teclado. La solucion de la primera vuelta fue inyectar una
 * barra flotante abajo, que traia sus propios problemas: se ponia por encima de
 * la portada, dejaba dos sitios donde escribir en un computador con la ventana
 * pequena, y hacia que el simulador del tema 3 —el unico con campo propio— se
 * viera distinto de los demas.
 *
 * Aqui la consola lleva un <input> de verdad, como el del tema 3. El teclado del
 * telefono sale solo, pegar y borrar los resuelve el navegador, y no hay nada
 * flotando por encima de nada.
 *
 * Solo Retos de vi se queda fuera: ese se juega con teclas sueltas (h, j, k, l,
 * dd, yy, p), no escribiendo ordenes, y un campo de texto no le sirve de nada.
 */
(function (global) {
  "use strict"

  /**
   * @param {object} cfg
   * @param {string} cfg.campo      id del <input> de la consola
   * @param {object} cfg.historial  el de `Barra.historial()`
   * @param {function} cfg.ocupado  si ahora mismo no se admiten ordenes
   * @param {function} cfg.ejecutar que hacer con la linea al pulsar Enter
   */
  function montar(cfg) {
    var campo = document.getElementById(cfg.campo)
    if (!campo) return null
    var historial = cfg.historial
    var ocupado = cfg.ocupado || function () { return false }

    campo.addEventListener("keydown", function (ev) {
      if (ocupado()) { ev.preventDefault(); return }

      if (ev.key === "Enter") {
        ev.preventDefault()
        var linea = campo.value
        campo.value = ""
        if (historial) historial.recordar(linea)
        cfg.ejecutar(linea)
        return
      }

      // Flecha arriba y abajo, el historial de la shell: repetir un comando
      // largo obligaba a escribirlo entero otra vez.
      if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
        ev.preventDefault()
        if (!historial) return
        var previa = historial.mover(ev.key === "ArrowUp" ? 1 : -1)
        if (previa === null) return
        campo.value = previa
        // El cursor al final, que si no queda donde estuviera antes.
        campo.setSelectionRange(previa.length, previa.length)
      }
    })

    /* Tocar cualquier parte del escritorio devuelve el foco a la consola, que
       es lo que hace una terminal de verdad. Se respetan los otros campos y los
       botones: el chat de Laura es un <input> y el dock son botones. */
    document.addEventListener("click", function (ev) {
      if (ocupado()) return
      var d = ev.target
      if (d && d.closest && d.closest("input, textarea, button, select, a")) return
      campo.focus({ preventScroll: true })
    })

    return {
      enfocar: function () { campo.focus({ preventScroll: true }) },
      limpiar: function () { campo.value = "" },
      valor: function () { return campo.value },
    }
  }

  global.Consola = { montar: montar }
})(window)
