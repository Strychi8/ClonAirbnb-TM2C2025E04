// compartir_propiedad.js
// Lógica para solicitar la URL de compartir al backend y copiarla al portapapeles

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-compartir');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      // Obtener id de la query string (ej: ?id=123)
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (!id) {
        alert('No se encontró el id del alojamiento en la URL.');
        return;
      }

      // Llamada al endpoint
      const resp = await fetch('../backend/compartir_propiedad/compartir_propiedad.php?id=' + encodeURIComponent(id));
      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        throw new Error((err && err.message) ? err.message : 'Error al generar el enlace');
      }

      const data = await resp.json();
      if (!data.success || !data.url) {
        throw new Error(data.message || 'Respuesta inválida del servidor');
      }

      // Copiar al portapapeles
      try {
        await navigator.clipboard.writeText(data.url);
        // Mostrar confirmación simple
        showTemporaryMessage('Enlace copiado al portapapeles');
      } catch (clipboardErr) {
        // fallback: prompt para que el usuario copie manualmente
        window.prompt('Copia el enlace (Ctrl+C + Enter):', data.url);
      }

    } catch (err) {
      console.error('Compartir error:', err);
      alert('No se pudo generar el enlace: ' + (err.message || err));
    }
  });
});

function showTemporaryMessage(text, duration = 2000) {
  // msgEl = elemento de notificación temporal (en la esquina inferior derecha)
  let msgEl = document.getElementById('copiado-msg');
  const svgCheck = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#e6f6ec"/>
      <path d="M7.5 12.5l2.5 2.5L16.5 9" stroke="#2b8a3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

  if (!msgEl) {
    msgEl = document.createElement('div');
    msgEl.id = 'copiado-msg';
    // estilo similar al ejemplo: fondo blanco, texto oscuro, sombra y border-radius
    msgEl.style.position = 'fixed';
  // centrar horizontalmente en la parte inferior
  msgEl.style.left = '50%';
  msgEl.style.right = 'auto';
  msgEl.style.bottom = '20px';
    msgEl.style.padding = '8px 12px';
    msgEl.style.background = '#ffffff';
    msgEl.style.color = '#1f2937';
    msgEl.style.borderRadius = '12px';
    msgEl.style.boxShadow = '0 6px 18px rgba(31,41,55,0.08)';
    msgEl.style.display = 'flex';
    msgEl.style.alignItems = 'center';
    msgEl.style.gap = '10px';
    msgEl.style.fontSize = '14px';
    msgEl.style.zIndex = '9999';
  msgEl.style.transition = 'opacity 200ms, transform 200ms';
  msgEl.style.opacity = '0';
  // start slightly below and centered
  msgEl.style.transform = 'translate(-50%, 6px)';
    msgEl.setAttribute('role', 'status');
    msgEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(msgEl);
  }

  // insertar icono + texto
  msgEl.innerHTML = `${svgCheck}<div style="line-height:1">${text}</div>`;
  // mostrar con transición
  msgEl.style.opacity = '1';
  // bring to center-bottom (translateX(-50%) to center horizontally)
  msgEl.style.transform = 'translate(-50%, 0)';

  // limpiar timeouts anteriores si existen
  if (msgEl.__hideTimeout) {
    clearTimeout(msgEl.__hideTimeout);
  }

  msgEl.__hideTimeout = setTimeout(() => {
    msgEl.style.opacity = '0';
    msgEl.style.transform = 'translate(-50%, 6px)';
  }, duration);
}
