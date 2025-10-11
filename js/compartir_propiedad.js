document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-compartir');
  if (!btn) return;

  let urlCompartir = '';

  // Crear menú flotante centrado
  const menu = document.createElement('div');
	menu.id = 'compartir-menu';
	menu.style.display = 'none';
	menu.style.position = 'fixed';
	menu.style.top = '50%';
	menu.style.left = '50%';
	menu.style.transform = 'translate(-50%, -50%)';
	menu.style.background = '#fff';
	menu.style.border = '1px solid #ccc';
	menu.style.borderRadius = '12px';
	menu.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
	menu.style.padding = '12px 0';
	menu.style.zIndex = '9999';
	menu.style.minWidth = '300px';      // más ancho
	menu.style.padding = '16px 0';       // más padding
	menu.style.borderRadius = '16px';    // borde más redondeado
	menu.style.boxShadow = '0 12px 36px rgba(0,0,0,0.3)'; // sombra más visible
  document.body.appendChild(menu);

  // Opciones con iconos
  const redes = [
    { nombre: 'WhatsApp', icon: '../icons/whatsapp.png' },
    { nombre: 'X', icon: '../icons/twitter.png' },
    { nombre: 'Instagram', icon: '../icons/instagram.png' },
    { nombre: 'Mail', icon: '../icons/mail.png' },
  ];

  redes.forEach(r => {
    const a = document.createElement('a');
    a.href = '#';
    a.style.display = 'flex';
    a.style.alignItems = 'center';
    a.style.gap = '8px';
    a.style.padding = '12px 20px';
    a.style.fontSize = '16px';
    a.style.color = '#1f2937';
    a.style.textDecoration = 'none';
    a.style.cursor = 'pointer';
    a.style.justifyContent = 'flex-start';

    const img = document.createElement('img');
    img.src = r.icon;
    img.alt = r.nombre;
    img.style.width = '32px';
    img.style.height = '32px';

    a.appendChild(img);
    a.appendChild(document.createTextNode(r.nombre));
    menu.appendChild(a);
  });

  // Mensaje temporal
  function showTemporaryMessage(text, duration = 2000) {
    let msgEl = document.getElementById('copiado-msg');
    const svgCheck = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="12" cy="12" r="11" fill="#e6f6ec"/>
        <path d="M7.5 12.5l2.5 2.5L16.5 9" stroke="#2b8a3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.id = 'copiado-msg';
      msgEl.style.position = 'fixed';
      msgEl.style.left = '50%';
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
      msgEl.style.transform = 'translate(-50%, 6px)';
      msgEl.setAttribute('role', 'status');
      msgEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(msgEl);
    }

    msgEl.innerHTML = `${svgCheck}<div style="line-height:1">${text}</div>`;
    msgEl.style.opacity = '1';
    msgEl.style.transform = 'translate(-50%, 0)';

    if (msgEl.__hideTimeout) clearTimeout(msgEl.__hideTimeout);
    msgEl.__hideTimeout = setTimeout(() => {
      msgEl.style.opacity = '0';
      msgEl.style.transform = 'translate(-50%, 6px)';
    }, duration);
  }

  // Obtener URL del backend
  async function obtenerURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
      const resp = await fetch('../backend/compartir_propiedad/compartir_propiedad.php?id=' + encodeURIComponent(id));
      const data = await resp.json();
      if (data.success && data.url) urlCompartir = data.url;
    } catch (err) {
      console.error('Error obteniendo URL:', err);
    }
  }

  obtenerURL();

  // Abrir menú y copiar al portapapeles
  btn.addEventListener('click', async () => {
    if (!urlCompartir) return alert('No se pudo generar el enlace.');
    try {
      await navigator.clipboard.writeText(urlCompartir);
      showTemporaryMessage('Enlace copiado al portapapeles');
    } catch {
      window.prompt('Copia el enlace (Ctrl+C + Enter):', urlCompartir);
    }
    menu.style.display = 'block';
  });

  // Cerrar menú al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = 'none';
    }
  });

  // Configurar enlaces de compartir
  menu.querySelectorAll('a').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.preventDefault();
      const tipo = opt.textContent.trim().toLowerCase();
      const encodedURL = encodeURIComponent(urlCompartir);
      let compartirURL = '';

      switch(tipo) {
        case 'whatsapp':
          compartirURL = `https://wa.me/?text=${encodedURL}`;
          break;
        case 'x':
          compartirURL = `https://twitter.com/intent/tweet?url=${encodedURL}`;
          break;
        case 'instagram':
          alert('Instagram no permite compartir enlaces directos, usa otro método.');
          return;
        case 'mail':
          compartirURL = `mailto:?subject=Te comparto este alojamiento&body=${encodedURL}`;
          break;
      }

      if (compartirURL) window.open(compartirURL, '_blank');
      menu.style.display = 'none';
    });
  });
});
