document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-compartir');
  if (!btn) return;

  let urlCompartir = '';

  // Crear overlay tipo YouTube
  const overlay = document.createElement('div');
  overlay.id = 'compartir-overlay';
  overlay.style.display = 'none';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.6)';
  overlay.style.zIndex = '9998';
  document.body.appendChild(overlay);

  // Crear menú flotante centrado
  const menu = document.createElement('div');
  menu.id = 'compartir-menu';
  menu.style.display = 'none';
  menu.style.position = 'fixed';
  menu.style.top = '50%';
  menu.style.left = '50%';
  menu.style.transform = 'translate(-50%, -50%)';
  menu.style.background = '#fff';
  menu.style.borderRadius = '16px';
  menu.style.boxShadow = '0 12px 36px rgba(0,0,0,0.3)';
  menu.style.padding = '16px';
  menu.style.zIndex = '9999';
  menu.style.textAlign = 'center';
  menu.style.minWidth = '300px';
  document.body.appendChild(menu);

  // Contenedor de iconos (fila horizontal)
  const iconRow = document.createElement('div');
  iconRow.style.display = 'flex';
  iconRow.style.justifyContent = 'center';
  iconRow.style.gap = '20px';
  iconRow.style.marginBottom = '16px';
  menu.appendChild(iconRow);

  // Iconos de compartir
  const redes = [
    { nombre: 'WhatsApp', icon: '../icons/whatsapp.png', url: (encoded) => `https://wa.me/?text=${encoded}` },
    { nombre: 'X', icon: '../icons/twitter.png', url: (encoded) => `https://twitter.com/intent/tweet?url=${encoded}` },
    { nombre: 'Mail', icon: '../icons/mail.png', url: (encoded) => `https://mail.google.com/mail/?view=cm&fs=1&su=Te%20comparto%20este%20alojamiento&body=${encoded}` },
  ];

  redes.forEach(r => {
    const a = document.createElement('a');
    a.href = '#';
    a.style.display = 'flex';
    a.style.flexDirection = 'column';
    a.style.alignItems = 'center';
    a.style.textDecoration = 'none';
    a.style.color = '#111';
    a.style.cursor = 'pointer';

    const img = document.createElement('img');
    img.src = r.icon;
    img.alt = r.nombre;
    img.style.width = '48px';
    img.style.height = '48px';

    const label = document.createElement('span');
    label.textContent = r.nombre;
    label.style.fontSize = '14px';
    label.style.marginTop = '4px';

    a.appendChild(img);
    a.appendChild(label);
    iconRow.appendChild(a);

    a.addEventListener('click', (e) => {
      e.preventDefault();
      if (!urlCompartir) return;
      const encoded = encodeURIComponent(urlCompartir);
      window.open(r.url(encoded), '_blank');
      menu.style.display = 'none';
      overlay.style.display = 'none';
    });
  });

  // Contenedor del link + botón copiar
  const linkContainer = document.createElement('div');
  linkContainer.style.display = 'flex';
  linkContainer.style.alignItems = 'center';
  linkContainer.style.justifyContent = 'space-between';
  linkContainer.style.marginTop = '12px';
  linkContainer.style.padding = '0 20px';

  const linkInput = document.createElement('input');
  linkInput.type = 'text';
  linkInput.readOnly = true;
  linkInput.style.flex = '1';
  linkInput.style.padding = '8px';
  linkInput.style.fontSize = '14px';
  linkInput.style.border = '1px solid #ccc';
  linkInput.style.borderRadius = '8px';
  linkInput.style.marginRight = '8px';

  const copiarBtn = document.createElement('button');
  copiarBtn.textContent = 'Copiar enlace';
  copiarBtn.style.padding = '8px 12px';
  copiarBtn.style.fontSize = '14px';
  copiarBtn.style.border = 'none';
  copiarBtn.style.borderRadius = '8px';
  copiarBtn.style.background = '#a33e1f';
  copiarBtn.style.color = '#fff';
  copiarBtn.style.cursor = 'pointer';
  
  copiarBtn.addEventListener('mouseenter', () => copiarBtn.style.background = '#922f16'); // más oscuro al hover
copiarBtn.addEventListener('mouseleave', () => copiarBtn.style.background = '#a33e1f');

  copiarBtn.addEventListener('click', () => {
    if (!urlCompartir) return;
    navigator.clipboard.writeText(urlCompartir)
      .then(() => showTemporaryMessage('Enlace copiado al portapapeles'))
      .catch(() => window.prompt('Copia el enlace (Ctrl+C + Enter):', urlCompartir));
  });

  linkContainer.appendChild(linkInput);
  linkContainer.appendChild(copiarBtn);
  menu.appendChild(linkContainer);

  // Mensaje temporal (se expone en window para que otras scripts puedan reutilizarlo)
  window.showTemporaryMessage = function (text, duration = 2000) {
    let msgEl = document.getElementById('copiado-msg');
    const svgCheck = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
      msgEl.style.zIndex = '10000';
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
  };

  // Obtener URL del backend
  async function obtenerURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (!id) return;

    try {
      const resp = await fetch('../backend/compartir_propiedad/compartir_propiedad.php?id=' + encodeURIComponent(id));
      const data = await resp.json();
      if (data.success && data.url) {
        urlCompartir = data.url;
        linkInput.value = urlCompartir; // mostrar la URL
      }
    } catch (err) {
      console.error('Error obteniendo URL:', err);
    }
  }

  obtenerURL();

  // Abrir menú al hacer clic
  btn.addEventListener('click', () => {
    if (!urlCompartir) return alert('No se pudo generar el enlace.');
    overlay.style.display = 'block';
    menu.style.display = 'block';
  });

  // Cerrar menú al hacer clic fuera
  overlay.addEventListener('click', () => {
    menu.style.display = 'none';
    overlay.style.display = 'none';
  });
});
