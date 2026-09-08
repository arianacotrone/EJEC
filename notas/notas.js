/* ==========================================================================
   NOTAS.JS — Trae las notas desde el Google Sheets publicado como CSV
   y arma las tarjetas destacadas + el listado completo + el modal.

   👉 LO ÚNICO QUE TENÉS QUE CAMBIAR VOS: la constante SHEET_CSV_URL de acá abajo.
   Ver instrucciones de cómo conseguir esa URL en el mensaje / documento entregado.
   ========================================================================== */

const SHEET_CSV_URL = "PEGAR_ACA_LA_URL_CSV_PUBLICADA_DEL_GOOGLE_SHEET";

// Nombres de columnas esperados en el Sheet (no importa mayúsculas/acentos,
// la función normalizarClave() de abajo los hace equivalentes).
const CLAVES = {
  fecha: ["fecha"],
  titulo: ["titulo", "título"],
  autor: ["autor"],
  resumen: ["resumen"],
  notaCompleta: ["nota completa", "notacompleta", "nota"],
  destacada: ["destacada"],
};

document.addEventListener("DOMContentLoaded", inicializar);

async function inicializar() {
  const estadoCargando = document.getElementById("notas-estado-cargando");
  const estadoError = document.getElementById("notas-estado-error");
  const estadoVacio = document.getElementById("notas-estado-vacio");
  const grillaDestacadas = document.getElementById("notas-destacadas-grid");
  const listadoTodas = document.getElementById("notas-listado-items");

  try {
    const csvTexto = await obtenerCSV(SHEET_CSV_URL);
    const filas = Papa.parse(csvTexto, {
      header: true,
      skipEmptyLines: true,
    }).data;

    const notas = filas
      .map(normalizarFila)
      .filter((n) => n.titulo); // descarta filas vacías/basura

    estadoCargando.classList.add("oculto");

    if (notas.length === 0) {
      estadoVacio.classList.remove("oculto");
      return;
    }

    // Orden por fecha, de más nueva a más vieja
    notas.sort((a, b) => (b.fechaObj || 0) - (a.fechaObj || 0));

    const destacadas = notas.filter((n) => n.destacada).slice(0, 3);

    renderDestacadas(destacadas, grillaDestacadas);
    renderListado(notas, listadoTodas);
    configurarModal(notas);
  } catch (error) {
    console.error("Error cargando notas:", error);
    estadoCargando.classList.add("oculto");
    estadoError.classList.remove("oculto");
  }
}

async function obtenerCSV(url) {
  const respuesta = await fetch(url, { cache: "no-store" });
  if (!respuesta.ok) {
    throw new Error("No se pudo leer el Google Sheets (" + respuesta.status + ")");
  }
  return respuesta.text();
}

function normalizarClave(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // saca acentos
    .trim();
}

function normalizarFila(filaCruda) {
  const filaNormalizada = {};
  Object.keys(filaCruda).forEach((claveOriginal) => {
    filaNormalizada[normalizarClave(claveOriginal)] = (filaCruda[claveOriginal] || "").trim();
  });

  const obtener = (posiblesClaves) => {
    for (const clave of posiblesClaves) {
      if (filaNormalizada[clave] !== undefined) return filaNormalizada[clave];
    }
    return "";
  };

  const fechaTexto = obtener(CLAVES.fecha);
  const destacadaTexto = obtener(CLAVES.destacada).toLowerCase();

  return {
    fechaTexto,
    fechaObj: parsearFecha(fechaTexto),
    titulo: obtener(CLAVES.titulo),
    autor: obtener(CLAVES.autor),
    resumen: obtener(CLAVES.resumen),
    notaCompleta: obtener(CLAVES.notaCompleta),
    destacada: destacadaTexto.startsWith("s"), // "si" / "sí" / "SI" → true
  };
}

// Acepta DD/MM/AAAA (recomendado) y también AAAA-MM-DD como respaldo.
function parsearFecha(texto) {
  if (!texto) return null;

  const conBarras = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (conBarras) {
    const [, dia, mes, anio] = conBarras;
    const anioCompleto = anio.length === 2 ? "20" + anio : anio;
    return new Date(anioCompleto, mes - 1, dia);
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
  return fechaObj.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderDestacadas(destacadas, contenedor) {
  const seccion = contenedor.closest(".notas-destacadas");
  if (destacadas.length === 0) {
    seccion.classList.add("oculto");
    return;
  }
  contenedor.innerHTML = destacadas
    .map((nota, i) => tarjetaHTML(nota, notaIndiceGlobal(nota, destacadas)))
    .join("");
}

function renderListado(todas, contenedor) {
  contenedor.innerHTML = todas
    .map((nota, i) => filaHTML(nota, i))
    .join("");
}

// Guardamos el índice real dentro del array completo para poder
// abrir el modal correcto tanto desde una tarjeta destacada como del listado.
let NOTAS_GLOBAL = [];

function notaIndiceGlobal(nota) {
  return NOTAS_GLOBAL.indexOf(nota);
}

function tarjetaHTML(nota, indice) {
  return `
    <article class="nota-card" tabindex="0" role="button" data-nota-index="${indice}" aria-label="Ver nota completa: ${escaparHTML(nota.titulo)}">
      <p class="nota-card__meta"><strong>${escaparHTML(nota.autor)}</strong> · ${formatearFechaLarga(nota.fechaObj, nota.fechaTexto)}</p>
      <h3 class="nota-card__title">${escaparHTML(nota.titulo)}</h3>
      <p class="nota-card__resumen">${escaparHTML(nota.resumen)}</p>
      <span class="nota-card__link">Ver más</span>
    </article>
  `;
}

function filaHTML(nota, indice) {
  const dia = nota.fechaObj ? nota.fechaObj.getDate() : "—";
  const mes = nota.fechaObj
    ? nota.fechaObj.toLocaleDateString("es-AR", { month: "short" }).replace(".", "")
    : "";
  return `
    <article class="nota-fila" tabindex="0" role="button" data-nota-index="${indice}" aria-label="Ver nota completa: ${escaparHTML(nota.titulo)}">
      <div class="nota-fila__fecha">
        <span class="dia">${dia}</span>
        <span class="mes">${mes}</span>
      </div>
      <div>
        <h3 class="nota-fila__titulo">${escaparHTML(nota.titulo)}</h3>
        <p class="nota-fila__autor">Por ${escaparHTML(nota.autor)}</p>
        <p class="nota-fila__resumen">${escaparHTML(nota.resumen)}</p>
      </div>
    </article>
  `;
}

function configurarModal(notas) {
  NOTAS_GLOBAL = notas;

  const modal = document.getElementById("nota-modal");
  const modalTitulo = document.getElementById("nota-modal-titulo");
  const modalMeta = document.getElementById("nota-modal-meta");
  const modalCuerpo = document.getElementById("nota-modal-cuerpo");
  const botonCerrar = document.getElementById("nota-modal-cerrar");

  document.addEventListener("click", (evento) => {
    const tarjeta = evento.target.closest("[data-nota-index]");
    if (!tarjeta) return;
    abrirModal(Number(tarjeta.dataset.notaIndex));
  });

  document.addEventListener("keydown", (evento) => {
    const tarjeta = evento.target.closest("[data-nota-index]");
    if (tarjeta && (evento.key === "Enter" || evento.key === " ")) {
      evento.preventDefault();
      abrirModal(Number(tarjeta.dataset.notaIndex));
    }
    if (evento.key === "Escape") cerrarModal();
  });

  botonCerrar.addEventListener("click", cerrarModal);
  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) cerrarModal();
  });

  function abrirModal(indice) {
    const nota = NOTAS_GLOBAL[indice];
    if (!nota) return;
    modalTitulo.textContent = nota.titulo;
    modalMeta.textContent = `Por ${nota.autor} · ${formatearFechaLarga(nota.fechaObj, nota.fechaTexto)}`;
    modalCuerpo.innerHTML = (nota.notaCompleta || nota.resumen)
      .split(/\n+/)
      .filter((p) => p.trim())
      .map((p) => `<p>${escaparHTML(p)}</p>`)
      .join("");
    modal.hidden = false;
    document.body.classList.add("nota-modal-abierto");
    botonCerrar.focus();
  }

  function cerrarModal() {
    modal.hidden = true;
    document.body.classList.remove("nota-modal-abierto");
  }
}

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto || "";
  return div.innerHTML;
}
