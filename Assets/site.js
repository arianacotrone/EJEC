/* ==========================================================================
   Estudio Jurídico España Cotrone — comportamiento compartido
   ========================================================================== */

// Animación de aparición al hacer scroll (fade + translateY)
(function () {
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || !els.length) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px 150px 0px' });
  els.forEach(function (el) { io.observe(el); });
})();

// Botón flotante de WhatsApp: aparece con una entrada suave recién cuando
// se scrollea más allá del primer tramo de la página (evita duplicar el
// CTA del Hero apenas se carga) y queda con foco visible para teclado.
(function () {
  var fab = document.querySelector('.fab-whatsapp');
  if (!fab) return;
  var shown = false;
  function onScroll() {
    var trigger = Math.min(window.innerHeight * 0.6, 480);
    if (!shown && window.scrollY > trigger) {
      shown = true;
      fab.classList.add('fab-visible');
      window.removeEventListener('scroll', onScroll);
    }
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// [PLACEHOLDER] Dispara conversión en Google Ads / GA4 y Meta Pixel cuando
// alguien hace click en un botón de WhatsApp o en un link de conversión. No
// hace nada mientras las etiquetas (gtag / fbq) sigan comentadas en el
// <head> -- activarlas junto con las cuentas de Google Ads y Meta.
function trackConversion(label) {
  if (typeof gtag === 'function') {
    gtag('event', 'conversion', { event_category: 'whatsapp', event_label: label });
    // Reemplazar por el send_to de la etiqueta de conversión específica de Google Ads
    // gtag('event', 'conversion', {'send_to': 'AW-XXXXXXXXX/XXXXXXXXXXXX'});
  }
  if (typeof fbq === 'function') {
    fbq('track', 'Lead', { content_name: label });
  }
}

// Detecta de dónde vino la visita (?utm_source=instagram_ads, ?utm_source=google_ads,
// ?origen=instagram_bio, etc.) para poder identificar qué consultas llegaron por
// cada canal. Fundamental para medir resultados de las campañas y el proporcional.
function getOrigen() {
  var params = new URLSearchParams(window.location.search);
  return params.get('utm_source') || params.get('origen') || 'directo';
}

// Agrega el origen a los botones de WhatsApp directos apenas carga la página, así
// el mensaje que le llega al estudio ya incluye el canal de procedencia.
document.addEventListener('DOMContentLoaded', function () {
  var origen = getOrigen();
  var sufijo = '%0AOrigen%3A%20' + encodeURIComponent(origen);
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
    a.href = a.href + sufijo;
  });
});

/* ==========================================================================
   REVAMP — interactividad nueva
   ========================================================================== */

// Contadores animados: cualquier elemento con [data-count="33"] cuenta desde 0
// hasta ese número apenas entra en pantalla (una sola vez).
(function () {
  var counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1100;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(target * eased);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }
  if (!('IntersectionObserver' in window)) {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(function (el) { io.observe(el); });
})();

// Selector interactivo de "tipos de causa": pestañas verticales (escritorio) o
// un <select> compacto (mobile) que muestran un panel con detalle + CTA de
// WhatsApp pre-armado para ese tipo de causa. Los dos controles quedan
// sincronizados entre sí para que cambiar de tamaño de pantalla no los
// desalinee.
(function () {
  var tabs = document.querySelectorAll('.causa-tab');
  var select = document.querySelector('.causa-select');
  if (!tabs.length && !select) return;
  var panels = document.querySelectorAll('.causa-panel');
  function activateCausa(targetId) {
    tabs.forEach(function (t) {
      var isMatch = t.getAttribute('data-target') === targetId;
      t.classList.toggle('is-active', isMatch);
      t.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });
    panels.forEach(function (p) { p.classList.toggle('is-active', p.id === targetId); });
    if (select && select.value !== targetId) select.value = targetId;
  }
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { activateCausa(tab.getAttribute('data-target')); });
  });
  if (select) {
    select.addEventListener('change', function () { activateCausa(select.value); });
  }
})();

// Menú mobile: botón hamburguesa que despliega los links del header (antes
// desaparecían por completo debajo de los 640px y no había forma de navegar
// a otra sección sin scrollear todo el sitio a mano).
(function () {
  var header = document.querySelector('header');
  var toggle = header && header.querySelector('.nav-toggle');
  var links = header && header.querySelector('nav.links');
  if (!header || !toggle || !links) return;
  function closeMenu() {
    header.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    var open = header.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Cerrar al elegir un link (navegue a una sección o a otra página).
  links.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') closeMenu();
  });
  // Si se agranda la ventana (o se rota el celular) más allá del breakpoint
  // mobile, evita que el menú quede "abierto" atascado de fondo.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 640) closeMenu();
  });
})();

// Carrusel de "Primeros pasos" (#urgencia) en mobile: flechas + puntitos.
// En desktop el CSS vuelve a mostrar la grilla de 4 columnas de siempre.
(function () {
  var track = document.getElementById('stepsTrack');
  var dotsWrap = document.getElementById('stepsDots');
  if (!track) return;
  var dots = dotsWrap ? dotsWrap.querySelectorAll('.dot') : [];
  window.stepsScroll = function (dir) {
    var card = track.querySelector('.dark-card');
    if (!card) return;
    var gap = 14;
    track.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: 'smooth' });
  };
  track.addEventListener('scroll', function () {
    var card = track.querySelector('.dark-card');
    if (!card) return;
    var idx = Math.round(track.scrollLeft / (card.offsetWidth + 14));
    dots.forEach(function (d, i) { d.classList.toggle('is-active', i === idx); });
  });
})();

// Filtro de la grilla de prensa (Todas / TV / Radio / Prensa escrita).
(function () {
  var filterBtns = document.querySelectorAll('.press-filter-btn');
  if (!filterBtns.length) return;
  var cards = document.querySelectorAll('.press-card[data-kind]');
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      var filter = btn.getAttribute('data-filter');
      cards.forEach(function (card) {
        var show = (filter === 'todas') || (card.getAttribute('data-kind') === filter);
        card.style.display = show ? '' : 'none';
      });
    });
  });
})();

// Header: resalta el link del nav correspondiente a la sección visible.
(function () {
  var navLinks = document.querySelectorAll('nav.links a[href^="#"]');
  if (!navLinks.length || !('IntersectionObserver' in window)) return;
  var map = {};
  navLinks.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    var section = document.getElementById(id);
    if (section) map[id] = a;
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = map[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(function (a) { a.classList.remove('is-active'); });
        link.classList.add('is-active');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });
  Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
})();

// Formulario de contacto: nombre opcional + área elegida + detalle.
function enviarConsultaChips(formPrefix, telefono, saludo) {
  var nombreEl = document.getElementById(formPrefix + 'nombre');
  var detalleEl = document.getElementById(formPrefix + 'detalle');
  var areaEl = document.getElementById(formPrefix + 'area');
  var nombre = (nombreEl && nombreEl.value.trim()) || '';
  var detalle = (detalleEl && detalleEl.value.trim()) || '';
  var area = areaEl ? areaEl.value : '';

  if (!detalle) {
    if (detalleEl) { detalleEl.focus(); detalleEl.style.borderColor = '#e64a28'; }
    return;
  }

  // Armado del mensaje en tono natural
  var msg = '';

  if (nombre) {
    msg += 'Hola, mi nombre es ' + nombre + ' y quería hacerles una consulta sobre: ' + area + '\n\n';
  } else {
    msg += 'Hola, quería hacerles una consulta sobre: ' + area + '.\n\n';
  }

  msg += detalle;

  if (area) {
    msg += '\n\n(Consulta sobre: ' + area + ')';
  }

  if (typeof trackConversion === 'function') trackConversion('formulario_chips_' + formPrefix);
  
  window.open('https://wa.me/' + telefono + '?text=' + encodeURIComponent(msg), '_blank');
}
