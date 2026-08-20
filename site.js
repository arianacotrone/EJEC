/* ==========================================================================
   Estudio Jurídico España Cotrone — comportamiento compartido
   ========================================================================== */

// Header sólido al hacer scroll (transparente sobre el hero)
(function () {
  var header = document.querySelector('header');
  if (!header) return;
  function onScroll() {
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

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
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(function (el) { io.observe(el); });
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
