# Estudio Jurídico EC — sitio web

Sitio web del estudio de abogados penalistas **Estudio Jurídico EC** (Dr. Jose Luis España y Dr. Adriel España Cotrone), CABA, Buenos Aires, Santa Cruz y Fuero Federal.

**En vivo:**
- https://arianacotrone.github.io/EJEC/
- https://espanacotrone.com.ar/

## Estructura

```
/index.html                 → landing principal del estudio (100% derecho penal)
/infracciones/index.html    → landing del servicio especializado en multas de tránsito
/prensa/index.html          → prensa, entrevistas y testimonios (con placeholders de link)
/Assets/style.css           → sistema de diseño compartido (colores, tipografía, layout)
/Assets/site.js             → comportamiento compartido (animaciones, tracking, WhatsApp)
/Assets/favicon*            → favicon "EC" en varios tamaños (svg, png, ico)
/Assets/og-image.jpg        → imagen de vista previa para redes (Open Graph)
```

Las tres páginas comparten el mismo `Assets/style.css` y `Assets/site.js` — para cambiar un color, una fuente o el comportamiento del sitio alcanza con editar esos dos archivos una sola vez.

### Cargar los links de prensa y testimonios

En `/prensa/index.html` cada nota y cada testimonio es una tarjeta de ejemplo. Para completarlas:

1. Buscar el bloque `<a class="press-card" href="#" ...>` que corresponda (hay un comentario `PLACEHOLDER` arriba de la grilla).
2. Reemplazar el `href="#"` por el link real (video de YouTube, nota del portal, audio, etc.).
3. Reemplazar el título, el nombre del medio y la fecha (marcados entre corchetes `[ ]`).
4. Borrar el `<span class="press-placeholder-flag">🔗 Falta agregar el link</span>` de esa tarjeta — es lo que muestra el aviso naranja/gris en la tarjeta mientras falta el link.
5. Para agregar más notas, copiar un bloque `<a class="press-card">...</a>` completo y pegarlo dentro de `<div class="press-grid">`.

Los testimonios (`<div class="testimonial-card">`) funcionan igual: reemplazar el texto de ejemplo y, si hay reseña pública (Google, video, etc.), el link de "Ver reseña completa".

⚠️ **Importante para el deploy:** GitHub Pages sirve archivos respetando mayúsculas/minúsculas. La carpeta se llama `Assets` (con A mayúscula) y así debe estar referenciada en ambos HTML (`Assets/style.css`, no `assets/style.css`). Si en algún momento se sube una versión con las rutas en minúscula pero la carpeta sigue en mayúscula (o viceversa), el sitio se rompe (queda sin estilos). Al subir cambios, siempre arrastrar la carpeta `Assets` completa, no archivo por archivo.

## Diseño

- Tipografía: **Cormorant Garamond** (serif, títulos) + **Inter** (sans-serif, cuerpo) — vía Google Fonts.
- Paleta de marca (definida en `:root` de `style.css`):
  - `--ink #122740` — Navy del logo, color principal (headers, botones oscuros, paneles, footer)
  - `--accent #A5783C` — Dorado del logo, acento de acción (CTAs, badges, links, texto destacado)
  - `--paper #FFFFFF` / `--paper-soft #F8F9FA` — fondos claros
  - `--text #1E232A` — Dark Charcoal, texto de cuerpo
  - `--whatsapp #25D366` — verde de WhatsApp
- Estética general inspirada en sitios de estudios jurídicos premium: botones tipo píldora, header sticky, logo monograma circular "EC", paneles oscuros con tarjetas, animación de aparición al hacer scroll.

## Tracking y atribución (clave para medir el proporcional)

Cada botón de WhatsApp agrega automáticamente el canal de origen al mensaje, leyendo el parámetro `?utm_source=` o `?origen=` de la URL (por ejemplo `?utm_source=instagram_ads`). Esto permite identificar qué consultas llegaron por cada canal (Instagram, Google Ads, etc.) sin ninguna configuración adicional — está resuelto en `Assets/site.js` (`getOrigen()`).

`Assets/site.js` también tiene una función `trackConversion()` que ya está conectada a los botones de WhatsApp y al formulario de contacto, pero no hace nada todavía porque las etiquetas de Google Analytics 4, Google Ads y Meta Pixel están comentadas en el `<head>` de cada HTML. Para activarlas:

1. Crear las cuentas de GA4, Google Ads y Meta Business Suite.
2. Reemplazar los IDs de ejemplo (`G-XXXXXXXXXX`, `AW-XXXXXXXXX`, `XXXXXXXXXXXXXXX`) por los reales en el `<head>` de `index.html` e `infracciones/index.html`.
3. Descomentar esos bloques `<script>`.

No hace falta tocar nada más — el resto de la lógica de tracking ya está armada.

## Pendientes

- Cargar los links reales de notas, entrevistas y testimonios en `/prensa/` (ver instrucciones arriba).
- Completar el correo real en la sección de contacto de `index.html` (hoy está marcado `[PLACEHOLDER]`).
- Nombres reales de los medios de radio y prensa gráfica en `/prensa/` (hoy hay placeholders genéricos salvo América 24, Canal 2, Crónica HD y "Café de Penalistas").
- IDs reales de GA4 / Google Ads / Meta Pixel (ver sección de tracking arriba).
- Sumar fotos de las entrevistas más recientes a `/fotos/prensa/` cuando estén disponibles (hoy la galería usa 8 capturas de TV + 3 fotos "detrás de cámara", todas con un tratamiento desaturado/degradado a propósito por ser capturas de pantalla de calidad dispar).

## Fotos de prensa (`/fotos/prensa/`)

Las fotos de apariciones en TV que cargó el estudio son capturas de pantalla de distinta calidad y antigüedad. Para que se vean cohesivas en vez de pixeladas, se les aplicó un tratamiento uniforme (desaturado + tono azul noche + recorte de las franjas de texto superpuestas) antes de usarlas en el sitio — así "se nota menos" la calidad original, tal como se pidió. Si en el futuro se agregan fotos nuevas de mejor calidad, no hace falta este tratamiento: se pueden usar directamente, más nítidas, y quedarán bien igual junto a las anteriores.

## Desarrollo

Es un sitio estático sin build ni dependencias — para editarlo alcanza con abrir los archivos `.html`/`.css`/`.js` directamente. Para verlo local, abrir `index.html` en el navegador o levantar un servidor simple (`python3 -m http.server`) desde la raíz del proyecto.

---
Sitio desarrollado por Espar Co. — Data and Business Solutions.
