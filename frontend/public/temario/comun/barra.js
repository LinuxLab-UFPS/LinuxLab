/*
 * Barra superior comun a los simuladores.
 *
 * Cada simulador tenia su propia copia del mismo marcado y las copias se
 * fueron separando: uno perdio el contador, otro puso el objetivo del paso en
 * el hueco del objetivo general, otro no llevaba puntos. Aqui se genera una
 * sola vez y cada simulador declara que piezas usa.
 *
 *   const barra = Barra.montar({
 *     progreso: true,          // los puntos y el "1 / 5"
 *     puntos:   true,          // la pastilla de la estrella
 *     ayuda:    [ { clave, tono, texto } ],   // la tarjeta del signo de ?
 *     extras:   "<div class='rbadge' id='badge-bonus'>...</div>",
 *     acciones: "<button ...>",               // botones propios antes de los puntos
 *     tema:     true,          // el interruptor de claro/oscuro
 *     onReiniciar: empezar,
 *   });
 *
 *   barra.objetivo("Navega a /var/www", 0, 5);
 *   barra.marcas(["done", "cur", "", "", ""]);
 *   barra.puntos(150);
 *   barra.jugando(false);   // deja solo el logo y la salida
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
      '<div class="help-wrap"><div class="help-btn">?</div>' +
      '<div class="help-card">' + cuerpo + "</div></div>"
    );
  }

  function montar(opc) {
    opc = opc || {};
    const hdr = document.querySelector(".hdr");
    if (!hdr) throw new Error("barra.js: falta el <div class=\"hdr\"> en el HTML");

    hdr.innerHTML =
      '<img class="hdr-logo" src="/icon-dark-32x32.png" alt="" width="32" height="32">' +
      '<span class="hdr-marca">Linux<span class="wh">Lab</span></span>' +
      '<div class="hdr-sep"></div>' +
      (opc.progreso === false
        ? ""
        : '<div class="hdr-dots" id="dots"></div><span class="hdr-n" id="obj-n"></span>') +
      '<div class="hdr-obj">' +
      '<span class="hdr-eyebrow" id="obj-num">Objetivo</span>' +
      '<span class="hdr-goal" id="obj-goal"></span>' +
      "</div>" +
      (opc.extras || "") +
      '<div class="hdr-fill"></div>' +
      (opc.tema ? '<button class="theme-btn" id="hdr-tema"></button>' : "") +
      (opc.ayuda && opc.ayuda.length ? tarjetaAyuda(opc.ayuda) : "") +
      (opc.acciones || "") +
      (opc.puntos === false
        ? ""
        : '<div class="score-pill">&#9733; <span id="score-val">0</span></div>') +
      '<button class="restart-btn" id="hdr-restart">Reiniciar</button>' +
      '<button class="exit-btn" id="hdr-exit">' + ICONO_X + "Salir</button>";

    const $ = (id) => document.getElementById(id);
    const elDots = $("dots");
    const elN = $("obj-n");
    const elNum = $("obj-num");
    const elGoal = $("obj-goal");
    const elScore = $("score-val");

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

    // La portada tapa todo menos la barra, y para eso necesita saber cuanto
    // mide la barra de verdad y no el minimo que dice la hoja de estilos.
    const medir = () =>
      document.documentElement.style.setProperty("--hdr-h", hdr.offsetHeight + "px");
    medir();
    window.addEventListener("resize", medir);

    return {
      el: hdr,

      /** Texto del objetivo. Con indice y total, ademas lo numera. */
      objetivo(texto, indice, total) {
        elGoal.textContent = texto || "";
        if (typeof indice === "number") {
          elNum.textContent = "Objetivo " + (indice + 1);
          if (elN && typeof total === "number") elN.textContent = indice + 1 + " / " + total;
        }
      },

      /** Un estado por objetivo: "done", "done-gold", "cur" o "". */
      marcas(estados) {
        if (!elDots) return;
        elDots.innerHTML = "";
        estados.forEach((e) => {
          const d = document.createElement("div");
          d.className = "dot" + (e ? " " + e : "");
          elDots.appendChild(d);
        });
      },

      puntos(n) {
        if (elScore) elScore.textContent = n;
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
