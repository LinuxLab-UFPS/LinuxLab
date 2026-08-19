/*
 * Barra superior comun a los simuladores.
 *
 * Cada simulador tenia su propia copia del mismo marcado y las copias se
 * fueron separando: uno perdio el contador, otro puso el objetivo del paso en
 * el hueco del objetivo general, otro no llevaba puntos. Aqui se genera una
 * sola vez y cada simulador declara que piezas usa.
 *
 *   const barra = Barra.montar({
 *     titulo:   "Retos de vi",  // el nombre del simulador, junto a la marca
 *     ayuda:    [ { clave, tono, texto } ],   // la tarjeta del signo de ?
 *     extras:   "<div class='rbadge' id='badge-bonus'>...</div>",
 *     tema:     true,           // el interruptor de claro/oscuro
 *     onReiniciar: empezar,
 *   });
 *
 *   barra.objetivo("Navega a /var/www", 0);
 *   barra.jugando(false);   // deja solo la marca, el tema y la salida
 *
 * El marcado se inyecta dentro del <div class="hdr"> que el simulador ya
 * tiene en su HTML, asi que la barra existe antes de que corra este script y
 * no hay salto al cargar.
 */
(function () {
  "use strict";

  function salir() {
    window.parent.postMessage({ action: "close-simulator" }, "*");
  }

  /* ── el tema del sitio ───────────────────────────────────────────────────
   * Los simuladores se cargan en un iframe del mismo origen, asi que pueden
   * leer el tema de la pagina de arriba en vez de recibirlo por parametro:
   * next-themes marca <html class="dark"> alli, y aqui se traduce a
   * <html class="claro"> dentro del iframe. Leerlo (en vez de que lo mande el
   * sitio en la URL) es lo que permite cambiar de tema a mitad de partida sin
   * recargar el iframe, que reiniciaria el juego.
   *
   * Los simuladores que no declaran paleta clara ignoran la clase y se ven
   * igual en los dos temas. Si el iframe acaba en otro origen, o si el HTML se
   * abre suelto, no hay nada que leer y se queda el oscuro de siempre.
   */
  function docSitio() {
    try {
      if (!window.parent || window.parent === window) return null;
      return window.parent.document.documentElement ? window.parent.document : null;
    } catch (e) {
      return null;
    }
  }

  function sincronizarTema(sitio) {
    const claro = !sitio.documentElement.classList.contains("dark");
    const html = document.documentElement;
    if (html.classList.contains("claro") === claro) return;
    html.classList.toggle("claro", claro);
    // Los simuladores que pintan en <canvas> o SVG no se enteran por CSS.
    window.dispatchEvent(new CustomEvent("tema-cambiado", { detail: { claro } }));
  }

  const sitio = docSitio();
  if (sitio) {
    sincronizarTema(sitio);
    new MutationObserver(() => sincronizarTema(sitio)).observe(sitio.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  const esClaro = () => document.documentElement.classList.contains("claro");

  /* El cambio no se aplica aqui: se le pide al sitio, que es quien tiene el
     next-themes y quien guarda la preferencia. La clase de este documento
     llega de vuelta por el observador de arriba, igual que si el estudiante
     hubiera pulsado el boton de la cabecera del sitio. A pantalla completa
     aquella cabecera no se ve, y este es el unico camino al tema. */
  function cambiarTema() {
    window.parent.postMessage({ action: "toggle-theme" }, "*");
  }

  const ICONO_SOL =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round"><circle cx="12" cy="12" r="4"/>' +
    '<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41' +
    'M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';

  const ICONO_LUNA =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';

  const ICONO_REINICIAR =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>';

  const ICONO_X =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" ' +
    'stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>';

  function tarjetaAyuda(filas) {
    const cuerpo = filas
      .map((f) =>
        f.separador
          ? '<div class="help-sep"></div>'
          : '<div class="help-row"><span class="help-key' +
            (f.tono ? " hk-" + f.tono : "") +
            '">' +
            f.clave +
            '</span><span class="help-desc">' +
            f.texto +
            "</span></div>"
      )
      .join("");
    return (
      '<div class="help-wrap"><div class="help-btn"><span>?</span></div>' +
      '<div class="help-card">' + cuerpo + "</div></div>"
    );
  }

  function montar(opc) {
    opc = opc || {};
    const hdr = document.querySelector(".hdr");
    if (!hdr) throw new Error("barra.js: falta el <div class=\"hdr\"> en el HTML");

    // El orden es el de la cabecera del sitio: la marca a la izquierda, lo que
    // identifica la pagina justo detras, y las acciones a la derecha. En medio,
    // el objetivo, que es lo unico que cambia durante la partida.
    // Todo va dentro de .hdr-inner: es el equivalente del contenedor centrado
    // que la cabecera del sitio pone con `mx-auto max-w-7xl px-6`, y sin el la
    // barra quedaba a sangre mientras la del sitio iba metida hacia dentro.
    hdr.innerHTML =
      '<div class="hdr-inner">' +
      '<span class="hdr-marca">Linux<span class="wh">Lab</span></span>' +
      (opc.titulo ? '<span class="hdr-sim">' + opc.titulo + "</span>" : "") +
      (opc.ayuda && opc.ayuda.length ? tarjetaAyuda(opc.ayuda) : "") +
      '<div class="hdr-obj">' +
      '<span class="hdr-eyebrow" id="obj-num">Objetivo</span>' +
      '<span class="hdr-goal" id="obj-goal"></span>' +
      "</div>" +
      (opc.extras || "") +
      '<div class="hdr-fill"></div>' +
      (opc.tema ? '<button class="theme-btn" id="hdr-tema"></button>' : "") +
      '<button class="restart-btn" id="hdr-restart">' + ICONO_REINICIAR + "Reiniciar</button>" +
      '<button class="exit-btn" id="hdr-exit">' + ICONO_X + "Salir</button>" +
      "</div>";

    const $ = (id) => document.getElementById(id);
    const elNum = $("obj-num");
    const elGoal = $("obj-goal");

    $("hdr-exit").addEventListener("click", salir);
    if (opc.onReiniciar) $("hdr-restart").addEventListener("click", opc.onReiniciar);

    // El icono dice a que tema se va, no en cual se esta: el mismo criterio que
    // el boton del sitio. Se repinta cuando el tema cambia, venga de este boton
    // o de la cabecera del sitio con el simulador incrustado en la leccion.
    const elTema = $("hdr-tema");
    if (elTema) {
      const pintarTema = () => {
        const claro = esClaro();
        elTema.innerHTML = claro ? ICONO_LUNA : ICONO_SOL;
        elTema.title = claro ? "Activar modo oscuro" : "Activar modo claro";
        elTema.setAttribute("aria-label", elTema.title);
      };
      pintarTema();
      elTema.addEventListener("click", cambiarTema);
      window.addEventListener("tema-cambiado", pintarTema);
    }

    /* El sitio tapa el simulador con un giro mientras carga, y `onLoad` del
       iframe no sirve para quitarlo: espera hasta el ultimo subrecurso y se
       queda puesto un rato largo despues de que el simulador ya se ve. Este
       aviso sale en el fotograma siguiente a montar la barra, y para entonces
       el guion del simulador —que corre justo detras de esta llamada, sin
       cortes— ya ha armado el tablero. Es decir: se manda cuando hay algo que
       enseñar, que es lo que el giro esta esperando. */
    requestAnimationFrame(() => {
      try {
        window.parent.postMessage({ action: "simulator-ready" }, "*");
      } catch (e) {
        /* abierto suelto, sin sitio al que avisar */
      }
    });

    // La portada tapa todo menos la barra, y para eso necesita saber cuanto
    // mide la barra de verdad y no el minimo que dice la hoja de estilos.
    const medir = () =>
      document.documentElement.style.setProperty("--hdr-h", hdr.offsetHeight + "px");
    medir();
    window.addEventListener("resize", medir);

    return {
      el: hdr,

      /** Texto del objetivo. Con indice, ademas lo numera. */
      objetivo(texto, indice) {
        elGoal.textContent = texto || "";
        if (typeof indice === "number") elNum.textContent = "Objetivo " + (indice + 1);
      },

      /** Con la partida parada la barra se queda en el logo y la salida. */
      jugando(si) {
        hdr.classList.toggle("pre", !si);
      },

      salir,
    };
  }

  window.Barra = { montar, salir };
})();
