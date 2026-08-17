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
