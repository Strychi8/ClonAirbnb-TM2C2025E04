document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('favoritos-container');
  if (!container) return;

  // Elementos modales
  const confirmModal = document.getElementById('confirmModal');
  const confirmTextEl = document.getElementById('confirmText');
  const confirmOk = document.getElementById('confirmOk');
  const confirmCancel = document.getElementById('confirmCancel');
  const confirmClose = document.getElementById('confirmClose');

  function confirmDialog(message) {
    return new Promise((resolve) => {
      if (!confirmModal) return resolve(false);
  if (message && confirmTextEl) confirmTextEl.textContent = message;
  // show modal as flex so align-items/justify-content work
  confirmModal.style.display = 'flex';

      function cleanup() {
        confirmModal.style.display = 'none';
        if (confirmOk) confirmOk.removeEventListener('click', onOk);
        if (confirmCancel) confirmCancel.removeEventListener('click', onCancel);
        if (confirmClose) confirmClose.removeEventListener('click', onCancel);
      }

      function onOk() { cleanup(); resolve(true); }
      function onCancel() { cleanup(); resolve(false); }

      if (confirmOk) confirmOk.addEventListener('click', onOk);
      if (confirmCancel) confirmCancel.addEventListener('click', onCancel);
      if (confirmClose) confirmClose.addEventListener('click', onCancel);
    });
  }

  function showTemporaryMessage(text, opts = {}) {
    // opts: { background, color, duration, className, padding, borderRadius }
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.bottom = '24px';
    el.style.transform = 'translateX(-50%)';
    el.style.background = opts.background || '#333';
    el.style.color = opts.color || '#fff';
    el.style.padding = opts.padding || '10px 14px';
    el.style.borderRadius = opts.borderRadius || '8px';
    el.style.zIndex = opts.zIndex || 9999;
    if (opts.className) el.classList.add(opts.className);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), typeof opts.duration === 'number' ? opts.duration : 2000);
  }

  // Asegurar que la tabla exista, si no, crearla
  function ensureTableExists() {
    let tbody = document.getElementById('tabla-body');
    if (tbody) return tbody;

    // Limpiar contenido y crear la tabla
    container.innerHTML = '';
    const table = document.createElement('table');
    table.className = 'tabla-alojamientos'; // clase genérica, ajuste en CSS si hace falta

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Foto</th><th>Nombre del Alojamiento</th><th style="text-align:center;">Eliminar</th></tr>';
    table.appendChild(thead);

      tbody = document.createElement('tbody');
      tbody.id = 'tabla-body';
    table.appendChild(tbody);

    container.appendChild(table);
    return tbody;
  }

  // Normalizar la ruta de la imagen devuelta del backend a un src utilizable
  function normalizeImagePath(path) {
    if (!path) return '../uploads/placeholder.jpg';
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('../') || path.startsWith('./')) return path;
    if (path.startsWith('/')) return '..' + path;
    return '../' + path;
  }

  async function fetchFavoritos() {
    // Asegurar tabla y mostrar fila de carga dentro del tbody
    const tbody = ensureTableExists();
  tbody.innerHTML = '<tr><td colspan="3" class="loading">Cargando favoritos...</td></tr>';
    try {
      const resp = await fetch('../backend/guardar_propiedad/listar_favoritos.php', { credentials: 'same-origin' });
      if (!resp.ok) {
        if (resp.status === 401) {
          container.innerHTML = 
          `<div class="empty-state">
            Debes <a href="../autenticacion/signin.html">iniciar sesión</a> para ver tus favoritos.
          </div>`;
          return;
        }
        throw new Error('Respuesta no OK ' + resp.status);
      }

      const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'Error al obtener favoritos');

      renderFavoritos(data.favoritos || []);
    } catch (e) {
      console.error('fetchFavoritos error', e);
      // Mostrar mensaje de error dentro de la tabla si existe, sino en el contenedor
      const tbody2 = document.getElementById('tabla-body');
      if (tbody2) {
        tbody2.innerHTML = '<tr><td colspan="3" class="no-data">No se pudieron cargar los favoritos. Intenta nuevamente.</td></tr>';
      } else {
        container.innerHTML = '<div class="empty-state">No se pudieron cargar los favoritos. Intenta nuevamente.</div>';
      }
    }
  }

  function renderFavoritos(items) {
    const tbody = document.getElementById('tabla-body');
    if (!tbody) return;

    if (!items || items.length === 0) {
      tbody.innerHTML = `
            <tr>
              <td colspan="3" class="no-data">
                No tienes favoritos todavía. 
                <br>
                <a href="../index.html">
                   ¡Guarda tu primer alojamiento!
                </a>
              </td>
            </tr>
          `;
      return;
    }

    tbody.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');

      // Foto
      const tdFoto = document.createElement('td');
      tdFoto.className = 'foto-cell';
  const img = document.createElement('img');
  img.src = normalizeImagePath(item.imagen);
      img.alt = item.nombre || 'Imagen';
      img.style.display = 'block';
      img.style.margin = '0 auto';
      img.style.width = '160px';
      img.style.height = 'auto';
      img.style.borderRadius = '4px';
      img.style.objectFit = 'cover';
      tdFoto.appendChild(img);
      tr.appendChild(tdFoto);

  // Nombre + descripción (usar textContent para evitar XSS y construir nodos)
  const tdNombre = document.createElement('td');
      const strong = document.createElement('strong');
      strong.style.display = 'block';
      const a = document.createElement('a');
      a.href = `alojamiento.html?id=${encodeURIComponent(item.id)}`;
      a.textContent = item.nombre || '';
      a.style.textDecoration = 'none';
      a.style.color = 'black';
      strong.appendChild(a);
      tdNombre.appendChild(strong);

      // Precio (si viene)
      if (item.precio) {
        const priceSmall = document.createElement('small');
        priceSmall.style.color = '#666';
        priceSmall.textContent = `$${item.precio}/noche`;
        tdNombre.appendChild(priceSmall);
      }

      // Descripción
      const descSmall = document.createElement('small');
      descSmall.style.color = '#888';
      descSmall.style.display = 'block';
      descSmall.textContent = (item.descripcion || '').substring(0, 120);
      tdNombre.appendChild(descSmall);
  tr.appendChild(tdNombre);

  // Eliminar
  const tdDel = document.createElement('td');
  tdDel.style.textAlign = 'center';
      const delBtn = document.createElement('button');
  // Usar el mismo nombre de clase que mis_alojamientos para reutilizar estilos
  delBtn.className = 'btn-eliminar btn btn-danger';
      delBtn.type = 'button';
      delBtn.textContent = 'Eliminar';
      delBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const ok = await confirmDialog(`¿Quitar "${item.nombre}" de tus favoritos?`);
        if (!ok) return;
        delBtn.disabled = true;
        try {
          const resp = await fetch('../backend/guardar_propiedad/guardar_propiedad.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alojamiento_id: item.id, action: 'remove' })
          });
          const data = await resp.json();
          if (!data.success) throw new Error(data.message || 'No se pudo eliminar');
          tr.remove();
          showTemporaryMessage('Eliminado de favoritos', { color: '#fff', background: '#b00020' });
          if (!document.querySelectorAll('#tabla-body tr').length) {
            tbody.innerHTML = `
            <tr>
              <td colspan="3" class="no-data">
                No tienes favoritos todavía. 
                <br>
                <a href="../index.html" style="color: #2ea44f; text-decoration: none;">
                   <strong>¡Guarda tu primer alojamiento!</strong>
                </a>
              </td>
            </tr>
          `;
          }
        } catch (err) {
          console.error('Eliminar favorito error', err);
          showTemporaryMessage('No se pudo eliminar. Intenta de nuevo.');
          delBtn.disabled = false;
        }
      });
      tdDel.appendChild(delBtn);
      tr.appendChild(tdDel);

    tbody.appendChild(tr);
    });
  }

  // Inicializar
  fetchFavoritos();

});
