/* ==========================================================================
   NOTAS.JS — Trae las notas desde el Google Sheets publicado como CSV
   y arma las tarjetas destacadas + el listado completo + el modal + compartir.

   👉 LO ÚNICO QUE TENÉS QUE CAMBIAR VOS: la constante SHEET_CSV_URL de acá abajo.
   ========================================================================== */

const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTR0QLns8N4FURG3WuTOUfutaG0cQHbI-0YSHsFN3Ucenhle5LJg32HX9Y1ktwQ6WKtit9FmMv-2kq3/pub?output=csv";

const CLAVES = {
  fecha: ["fecha"],
  titulo: ["titulo", "título"],
  autor: ["autor"],
  resumen: ["resumen"],
  notaCompleta: ["nota completa", "notacompleta", "nota"],
  destacada: ["destacada"],
};

let NOTAS_GLOBAL = [];

document.addEventListener("DOMContentLoaded", inicializar);

async function inicializar() {
  const estadoCargando = document.getElementById("notas-estado-cargando");
  const estadoError = document.getElementById("notas-estado-error");
  const estadoVacio = document.getElementById("notas-estado-vacio");
  const grillaDestacadas = document.getElementById("notas-destacadas-grid");
  const listadoTodas = document.getElementById("notas-listado-items");

  try {
    const csvTexto = await obtenerCSV(SHEET_CSV_URL);
    const filas = Papa.parse(csvTexto, { header: true, skipEmptyLines: true }).data;

    const notas = filas.map(normalizarFila).filter((n) => n.titulo);

    estadoCargando.classList.add("oculto");

    if (notas.length === 0) {
      estadoVacio.classList.remove("oculto");
      return;
    }

    notas.sort((a, b) => (b.fechaObj || 0) - (a.fechaObj || 0));
    asignarSlugsUnicos(notas);
    NOTAS_GLOBAL = notas;

    const destacadas = notas.filter((n) => n.destacada).slice(0, 3);
    const seccionDestacadas = document.getElementById("notas-destacadas-seccion");
    if (destacadas.length === 0) {
      seccionDestacadas.style.display = "none";
    } else {
      grillaDestacadas.innerHTML = destacadas.map((n) => tarjetaHTML(n)).join("");
    }

    listadoTodas.innerHTML = notas.map((n) => filaHTML(n)).join("");

    configurarModal();
    abrirNotaDesdeURL();
  } catch (error) {
    console.error("Error cargando notas:", error);
    estadoCargando.classList.add("oculto");
    estadoError.classList.remove("oculto");
  }
}

async function obtenerCSV(url) {
  const respuesta = await fetch(url, { cache: "no-store" });
  if (!respuesta.ok) throw new Error("No se pudo leer el Google Sheets (" + respuesta.status + ")");
  return respuesta.text();
}

function normalizarClave(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function normalizarFila(filaCruda) {
  const fila = {};
  Object.keys(filaCruda).forEach((k) => { fila[normalizarClave(k)] = (filaCruda[k] || "").trim(); });
  const obtener = (posibles) => {
    for (const c of posibles) if (fila[c] !== undefined) return fila[c];
    return "";
  };
  const fechaTexto = obtener(CLAVES.fecha);
  return {
    fechaTexto,
    fechaObj: parsearFecha(fechaTexto),
    titulo: obtener(CLAVES.titulo),
    autor: obtener(CLAVES.autor),
    resumen: obtener(CLAVES.resumen),
    notaCompleta: obtener(CLAVES.notaCompleta),
    destacada: obtener(CLAVES.destacada).toLowerCase().startsWith("s"),
  };
}

function parsearFecha(texto) {
  if (!texto) return null;
  const conBarras = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (conBarras) {
    const [, dia, mes, anio] = conBarras;
    return new Date(anio.length === 2 ? "20" + anio : anio, mes - 1, dia);
  }
  const conGuiones = texto.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (conGuiones) {
    const [, anio, mes, dia] = conGuiones;
    return new Date(anio, mes - 1, dia);
  }
  const intento = new Date(texto);
  return isNaN(intento) ? null : intento;
}

function formatearFechaLarga(fechaObj, textoOriginal) {
  if (!fechaObj) return textoOriginal;
  return fechaObj.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
}

function formatearFechaCorta(fechaObj, textoOriginal) {
  if (!fechaObj) return textoOriginal;
  return fechaObj.toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
}

// Genera un slug legible ("juicio-abreviado-que-es") y lo desambigua
// si dos notas dan el mismo slug (agrega -2, -3, etc.).
function asignarSlugsUnicos(notas) {
  const usados = {};
  notas.forEach((nota) => {
    let base = normalizarClave(nota.titulo).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!base) base = "nota";
    let slug = base;
    let contador = 2;
    while (usados[slug]) {
      slug = base + "-" + contador;
      contador++;
    }
    usados[slug] = true;
    nota.slug = slug;
  });
}

function urlDeNota(nota) {
  return location.origin + location.pathname + "#nota-" + nota.slug;
}

function tarjetaHTML(nota) {
  return `
    <article class="nota-card" tabindex="0" role="button" data-slug="${nota.slug}" aria-label="Ver nota completa: ${escaparHTML(nota.titulo)}">
      <span class="nota-card__fecha">${formatearFechaCorta(nota.fechaObj, nota.fechaTexto)}</span>
      <h3>${escaparHTML(nota.titulo)}</h3>
      <p class="nota-card__autor">${escaparHTML(nota.autor)}</p>
      <p class="nota-card__resumen">${escaparHTML(nota.resumen)}</p>
      <span class="nota-card__link">Ver nota completa →</span>
    </article>
  `;
}

function filaHTML(nota) {
  return `
    <article class="nota-fila" tabindex="0" role="button" data-slug="${nota.slug}" aria-label="Ver nota completa: ${escaparHTML(nota.titulo)}">
      <div class="nota-fila__fecha">${formatearFechaLarga(nota.fechaObj, nota.fechaTexto)}</div>
      <div>
        <h3 class="nota-fila__titulo">${escaparHTML(nota.titulo)}</h3>
        <p class="nota-fila__autor">${escaparHTML(nota.autor)}</p>
        <p class="nota-fila__resumen">${escaparHTML(nota.resumen)}</p>
      </div>
    </article>
  `;
}

function configurarModal() {
  const modal = document.getElementById("nota-modal");
  const modalTitulo = document.getElementById("nota-modal-titulo");
  const modalMeta = document.getElementById("nota-modal-meta");
  const modalCuerpo = document.getElementById("nota-modal-cuerpo");
  const botonCerrar = document.getElementById("nota-modal-cerrar");
  const botonFacebook = document.getElementById("nota-share-facebook");
  const botonInstagram = document.getElementById("nota-share-instagram");
  const aviso = document.getElementById("nota-share-aviso");

  document.addEventListener("click", (evento) => {
    const el = evento.target.closest("[data-slug]");
    if (!el) return;
    abrirModal(el.dataset.slug);
  });

  document.addEventListener("keydown", (evento) => {
    const el = evento.target.closest("[data-slug]");
    if (el && (evento.key === "Enter" || evento.key === " ")) {
      evento.preventDefault();
      abrirModal(el.dataset.slug);
    }
    if (evento.key === "Escape") cerrarModal();
  });

  botonCerrar.addEventListener("click", cerrarModal);
  modal.addEventListener("click", (evento) => { if (evento.target === modal) cerrarModal(); });
  window.addEventListener("hashchange", abrirNotaDesdeURL);

  function abrirModal(slug) {
    const nota = NOTAS_GLOBAL.find((n) => n.slug === slug);
    if (!nota) return;

    modalTitulo.textContent = nota.titulo;
    modalMeta.innerHTML = `Por <strong>${escaparHTML(nota.autor)}</strong> · ${formatearFechaLarga(nota.fechaObj, nota.fechaTexto)}`;
    modalCuerpo.innerHTML = (nota.notaCompleta || nota.resumen)
      .split(/\n+/).filter((p) => p.trim()).map((p) => `<p>${escaparHTML(p)}</p>`).join("");

    aviso.classList.add("oculto");
    aviso.textContent = "";

    modal.hidden = false;
    document.body.classList.add("nota-modal-abierto");
    botonCerrar.focus();

    if (location.hash !== "#nota-" + slug) {
      history.pushState(null, "", "#nota-" + slug);
    }

    botonFacebook.onclick = () => compartirFacebook(nota);
    botonInstagram.onclick = () => compartirInstagram(nota, aviso);
  }

  function cerrarModal() {
    modal.hidden = true;
    document.body.classList.remove("nota-modal-abierto");
    if (location.hash) history.pushState(null, "", location.pathname);
  }

  window.__cerrarNotaModal = cerrarModal;
  window.__abrirNotaModal = abrirModal;
}

function abrirNotaDesdeURL() {
  const match = location.hash.match(/^#nota-(.+)$/);
  if (match && window.__abrirNotaModal) window.__abrirNotaModal(match[1]);
}

/* ---------- Compartir en Facebook ---------- */
// Método oficial de Meta: no necesita API key ni App ID. Ojo: como esta
// página arma el contenido con JavaScript, el rastreador de Facebook no
// ve el título/resumen de CADA nota — solo los meta tags genéricos de
// notas/index.html. El parámetro "quote" compensa parcialmente mostrando
// el título como texto sugerido en la publicación.
function compartirFacebook(nota) {
  const url = urlDeNota(nota);
  const enlace = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url) + "&quote=" + encodeURIComponent(nota.titulo);
  window.open(enlace, "_blank", "noopener,width=600,height=520");
}

/* ---------- Compartir en Instagram (historia) ---------- */
// Instagram no tiene un link oficial de "compartir en historia" como
// Facebook. Lo que sí existe, y es lo que uso acá: generar una imagen
// de la tarjeta y pasarla al selector nativo para compartir del celular
// (navigator.share con "files"), donde Instagram aparece como opción
// para subir directo a la historia en la mayoría de los celulares.
// Si el navegador no soporta compartir archivos (ej. una computadora),
// descargo la imagen y copio el link para que se suba a mano.
async function compartirInstagram(nota, aviso) {
  aviso.classList.remove("oculto");
  aviso.textContent = "Generando imagen…";

  try {
    const blob = await generarImagenNota(nota);
    const archivo = new File([blob], nota.slug + ".png", { type: "image/png" });
    const url = urlDeNota(nota);

    if (navigator.canShare && navigator.canShare({ files: [archivo] })) {
      await navigator.share({
        files: [archivo],
        title: nota.titulo,
        text: nota.titulo + " — Estudio Jurídico España Cotrone",
      });
      aviso.textContent = "";
      aviso.classList.add("oculto");
      return;
    }

    // Sin soporte para compartir archivos (típico en computadoras):
    // descargamos la imagen y copiamos el link para pegarlo en Instagram.
    descargarBlob(blob, nota.slug + ".png");
    await copiarAlPortapapeles(url);
    aviso.textContent = "Descargamos la imagen y copiamos el link. Abrí Instagram, subila a tu historia y pegá el link como sticker de enlace.";
  } catch (error) {
    if (error && error.name === "AbortError") {
      // El usuario cerró el selector nativo — no es un error real.
      aviso.classList.add("oculto");
      return;
    }
    console.error("Error compartiendo en Instagram:", error);
    aviso.textContent = "No pudimos generar la imagen. Podés copiar el link y compartirlo manualmente: " + urlDeNota(nota);
  }
}

function descargarBlob(blob, nombreArchivo) {
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(blob);
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
}

async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch (error) {
    console.warn("No se pudo copiar al portapapeles automáticamente:", error);
  }
}

// Dibuja una tarjeta 1080x1920 (formato historia) con el título, autor
// y nombre del estudio, en los mismos colores navy/dorado del sitio.
// Dibuja una tarjeta 1080x1920 (formato historia) con el contenido
// agrupado al centro y mostrando el resumen completo + link a la nota.
async function generarImagenNota(nota) {
  const ANCHO = 1080, ALTO = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = ANCHO;
  canvas.height = ALTO;
  const ctx = canvas.getContext("2d");

  await Promise.all([
    cargarFuente("600 1px 'Cormorant Garamond'"),
    cargarFuente("400 1px 'Inter'"),
    cargarFuente("600 1px 'Inter'"),
  ]);

  // Fondo navy
  ctx.fillStyle = "#122740";
  ctx.fillRect(0, 0, ANCHO, ALTO);

  // Línea dorada superior
  ctx.fillStyle = "#A5783C";
  ctx.fillRect(0, 0, ANCHO, 10);

  // --- PREPARACIÓN Y CÁLCULO DE ALTURAS ---
  const paddingX = 90;
  const anchoTexto = ANCHO - (paddingX * 2);

  // 1. Marca
  const txtMarca = "ESTUDIO JURÍDICO ESPAÑA COTRONE";
  const fontMarca = "600 28px Inter, sans-serif";

  // 2. Kicker
  const txtKicker = "Notas y Artículos";
  const fontKicker = "600 32px Inter, sans-serif";

  // 3. Título
  const fontTitulo = "600 68px 'Cormorant Garamond', serif";
  const lineSpacingTitulo = 80;
  ctx.font = fontTitulo;
  const lineasTitulo = obtenerLineasTexto(ctx, nota.titulo || "", anchoTexto);

  // 4. Autor
  const txtAutor = "Por " + (nota.autor || "");
  const fontAutor = "italic 36px 'Cormorant Garamond', serif";

  // 5. Resumen (Hasta ~300 caracteres sin truncar drásticamente)
  const fontResumen = "300 32px Inter, sans-serif";
  const lineSpacingResumen = 48;
  const textoResumen = (nota.resumen || "").slice(0, 320); // Margen holgado para 300 caracteres
  ctx.font = fontResumen;
  const lineasResumen = obtenerLineasTexto(ctx, textoResumen, anchoTexto);

  // 6. Link "Ver nota completa"
  const txtLink = "Ver nota completa:";
  const fontLink = "600 28px Inter, sans-serif";
  const txtUrl = urlDeNota(nota);
  const fontUrl = "400 24px Inter, sans-serif";

  // Estimar altura total del bloque central
  const alturaMarca = 35;
  const alturaKicker = 40;
  const alturaTitulo = lineasTitulo.length * lineSpacingTitulo;
  const alturaAutor = 45;
  const alturaResumen = lineasResumen.length * lineSpacingResumen;
  const alturaLink = 80;

  const espacioSeparador = 30;

  const alturaBloqueTotal = 
    alturaMarca + 20 +
    alturaKicker + 35 +
    alturaTitulo + 25 +
    alturaAutor + 40 +
    alturaResumen + 45 +
    alturaLink;

  // Punto inicial en Y para centrar verticalmente en la pantalla de 1920px
  let yActual = (ALTO - alturaBloqueTotal) / 2;

  // --- RENDERIZADO DEL BLOQUE CENTRADO ---
  ctx.textAlign = "left";

  // 1. Marca
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = fontMarca;
  ctx.fillText(txtMarca, paddingX, yActual);
  yActual += alturaMarca + 20;

  // 2. Kicker
  ctx.fillStyle = "#A5783C";
  ctx.font = fontKicker;
  ctx.fillText(txtKicker, paddingX, yActual);
  yActual += alturaKicker + 35;

  // 3. Título
  ctx.fillStyle = "#ffffff";
  ctx.font = fontTitulo;
  for (const linea of lineasTitulo) {
    ctx.fillText(linea, paddingX, yActual);
    yActual += lineSpacingTitulo;
  }
  yActual += 25;

  // 4. Autor
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = fontAutor;
  ctx.fillText(txtAutor, paddingX, yActual);
  yActual += alturaAutor + 40;

  // 5. Resumen completado
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.font = fontResumen;
  for (const linea of lineasResumen) {
    ctx.fillText(linea, paddingX, yActual);
    yActual += lineSpacingResumen;
  }
  yActual += 45;

  // 6. Link "Ver nota completa"
  ctx.fillStyle = "#A5783C";
  ctx.font = fontLink;
  ctx.fillText(txtLink, paddingX, yActual);
  yActual += 35;

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = fontUrl;
  ctx.fillText(txtUrl, paddingX, yActual);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

// Función auxiliar para dividir el texto en líneas respetando el ancho del canvas
function obtenerLineasTexto(ctx, texto, anchoMax) {
  const palabras = (texto || "").split(" ");
  const lineas = [];
  let lineaActual = "";

  for (let i = 0; i < palabras.length; i++) {
    const pruebaLinea = lineaActual ? lineaActual + " " + palabras[i] : palabras[i];
    if (ctx.measureText(pruebaLinea).width > anchoMax) {
      if (lineaActual) lineas.push(lineaActual);
      lineaActual = palabras[i];
    } else {
      lineaActual = pruebaLinea;
    }
  }
  if (lineaActual) lineas.push(lineaActual);
  return lineas;
}

async function cargarFuente(especificacion) {
  if (!document.fonts || !document.fonts.load) return;
  try { await document.fonts.load(especificacion); } catch (e) { /* seguimos con la fuente de respaldo */ }
}

function dibujarTextoConSaltos(ctx, texto, x, y, anchoMax, alturaLinea, maxLineas) {
  const palabras = (texto || "").split(" ");
  let linea = "";
  let lineasUsadas = 0;
  for (let i = 0; i < palabras.length; i++) {
    const pruebaLinea = linea + palabras[i] + " ";
    if (ctx.measureText(pruebaLinea).width > anchoMax && linea) {
      ctx.fillText(linea.trim(), x, y);
      linea = palabras[i] + " ";
      y += alturaLinea;
      lineasUsadas++;
      if (lineasUsadas >= maxLineas - 1) {
        const resto = palabras.slice(i + 1).join(" ");
        ctx.fillText((linea + resto).trim().slice(0, 60) + "…", x, y);
        return;
      }
    } else {
      linea = pruebaLinea;
    }
  }
  ctx.fillText(linea.trim(), x, y);
}

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}
