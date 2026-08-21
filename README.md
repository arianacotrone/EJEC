# Estudio Jurídico EC — sitio web

Sitio web del estudio de abogados penalistas **Estudio Jurídico EC** (Dr. Jose Luis España y Dr. Adriel España Cotrone), CABA, Buenos Aires, Santa Cruz y Fuero Federal.

**En vivo:**
- https://arianacotrone.github.io/EJEC/
- https://espanacotrone.com.ar/

## Estructura

```
/index.html                 → landing principal del estudio (100% derecho penal)
/infracciones/index.html    → landing del servicio especializado en multas de tránsito
/Assets/style.css           → sistema de diseño compartido (colores, tipografía, layout)
/Assets/site.js             → comportamiento compartido (animaciones, tracking, WhatsApp)
/Assets/favicon*            → favicon "EC" en varios tamaños (svg, png, ico)
/Assets/og-image.jpg        → imagen de vista previa para redes (Open Graph)
```

Las dos páginas comparten el mismo `Assets/style.css` y `Assets/site.js` — para cambiar un color, una fuente o el comportamiento del sitio alcanza con editar esos dos archivos una sola vez.

⚠️ **Importante para el deploy:** GitHub Pages sirve archivos respetando mayúsculas/minúsculas. La carpeta se llama `Assets` (con A mayúscula) y así debe estar referenciada en ambos HTML (`Assets/style.css`, no `assets/style.css`). Si en algún momento se sube una versión con las rutas en minúscula pero la carpeta sigue en mayúscula (o viceversa), el sitio se rompe (queda sin estilos). Al subir cambios, siempre arrastrar la carpeta `Assets` completa, no archivo por archivo.

## Diseño

- Tipografía: **Cormorant Garamond** (serif, títulos) + **Inter** (sans-serif, cuerpo) — vía Google Fonts.
- Paleta de marca (definida en `:root` de `style.css`):
  - `--ink #111E38` — Deep Night Blue, color principal (headers, botones oscuros, paneles, footer)
  - `--accent #FF5A36` — Vibrant Orange, acento de acción (CTAs, badges, links, texto destacado)
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

- Dominio propio (hoy corre en GitHub Pages / Netlify).
- Fotos reales de ambos abogados y del estudio (hoy hay placeholders).
- Bios completas: años de ejercicio, matrícula y especialización puntual de cada uno.
- Confirmar la cifra "más de 30 años de trayectoria".
- IDs reales de GA4 / Google Ads / Meta Pixel (ver sección de tracking arriba).
- Sacar el banner amarillo "BORRADOR DE TRABAJO" antes de considerar el sitio definitivo.

## Desarrollo

Es un sitio estático sin build ni dependencias — para editarlo alcanza con abrir los archivos `.html`/`.css`/`.js` directamente. Para verlo local, abrir `index.html` en el navegador o levantar un servidor simple (`python3 -m http.server`) desde la raíz del proyecto.

---
Sitio desarrollado por Espar Co. — Data and Business Solutions.
