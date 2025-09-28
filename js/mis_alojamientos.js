/**
 * Mis Alojamientos - JavaScript Module
 * Handles fetching and displaying user accommodations
 */

// Global variables
let currentUser = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Check authentication
    currentUser = await SessionUtils.requireAuth();
    if (!currentUser) {
      return; // Already redirected to login
    }
    
    // Load user accommodations
    await loadUserAccommodations();
    
  } catch (error) {
    console.error('Error initializing page:', error);
    showError('Error al cargar la página');
  }
});

/**
 * Load and display user accommodations
 */
async function loadUserAccommodations() {
  try {
    showLoading();
    
    const response = await fetch(`../backend/alojamiento_get_by_usuario.php?usuario_id=${currentUser.user_id}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const accommodations = await response.json();
    if (accommodations.error) throw new Error(accommodations.error);
    
    displayAccommodations(accommodations);
    
  } catch (error) {
    console.error('Error loading accommodations:', error);
    showError('Error al cargar los alojamientos');
  }
}

/**
 * Display accommodations in the table
 */
function displayAccommodations(accommodations) {
  const tableBody = document.getElementById('tabla-body');
  
  if (!accommodations || accommodations.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="no-data">
          No tienes alojamientos publicados.
          <br>
          <a href="alojamiento_form.html" style="color: #2ea44f; text-decoration: none;">
            <strong>¡Publica tu primer alojamiento!</strong>
          </a>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = accommodations.map(accommodation => {
    const imageSrc = accommodation.imagen_principal 
      ? `../${accommodation.imagen_principal}` 
      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDE2MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjBkOWMwIi8+CjxyZWN0IHg9IjQwIiB5PSIzMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZThjZmFlIi8+Cjx0ZXh0IHg9IjgwIiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TaW4gaW1hZ2VuPC90ZXh0Pgo8L3N2Zz4K';
      
    return `
      <tr data-accommodation-id="${accommodation.id}">
        <td class="foto-cell">
          <img src="${imageSrc}" alt="${accommodation.nombre}" 
               onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDE2MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjBkOWMwIi8+CjxyZWN0IHg9IjQwIiB5PSIzMCIgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZThjZmFlIi8+Cjx0ZXh0IHg9IjgwIiB5PSI2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TaW4gaW1hZ2VuPC90ZXh0Pgo8L3N2Zz4K'">
        </td>
        <td>
          <a href="alojamiento.html?id=${accommodation.id}" style="color: black; text-decoration: none;">
            <strong>${escapeHtml(accommodation.nombre)}</strong>
          </a>
          <br>
          <small style="color: #666;">$${accommodation.precio_noche}/noche</small>
          ${accommodation.descripcion ? `<br><small style="color: #888;">${escapeHtml(accommodation.descripcion.substring(0, 100))}${accommodation.descripcion.length > 100 ? '...' : ''}</small>` : ''}
        </td>
        <td>
          <button class="btn-historial" onclick="verHistorial(${accommodation.id}, '${escapeHtml(accommodation.nombre)}')">
            Historial
          </button>
        </td>
        <td>
          <button class="btn-editar" onclick="editAccommodation(${accommodation.id})">
            Editar
          </button>
        </td>
        <td>
          <button class="btn-eliminar" onclick="deleteAccommodation(${accommodation.id}, '${escapeHtml(accommodation.nombre)}')">
            Eliminar
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Edit accommodation
 */
function editAccommodation(accommodationId) {
  window.location.href = `alojamiento_form.html?id=${accommodationId}`;
}

/**
 * Delete accommodation
 */
async function deleteAccommodation(accommodationId, accommodationName) {
  if (!confirm(`¿Estás seguro de que quieres eliminar "${accommodationName}"?\n\nEsta acción no se puede deshacer.`)) return;

  try {
    const response = await fetch('../backend/eliminar_alojamiento.php', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: accommodationId, usuario_id: currentUser.user_id })
    });

    const result = await response.json();
    if (!response.ok || result.error) throw new Error(result.message || result.error || 'Error al eliminar el alojamiento');

    document.querySelector(`tr[data-accommodation-id="${accommodationId}"]`)?.remove();
    alert(`"${accommodationName}" se eliminó correctamente.`);

  } catch (error) {
    console.error('Error eliminando alojamiento:', error);
    alert('Hubo un error al eliminar el alojamiento. Intenta de nuevo.');
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const tableBody = document.getElementById('tabla-body');
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="no-data">Cargando alojamientos...</td>
    </tr>
  `;
}

/**
 * Show error message
 */
function showError(message) {
  const tableBody = document.getElementById('tabla-body');
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="no-data" style="color: #e5534b;">
        ${message}
        <br>
        <button onclick="loadUserAccommodations()" style="margin-top: 10px; padding: 5px 10px; background: #2ea44f; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Reintentar
        </button>
      </td>
    </tr>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Ver historial de reservas
 */
function verHistorial(accommodationId, accommodationName) {
  const modal = document.getElementById('reservasModal');
  const modalBody = document.getElementById('modal-body');
  const modalTitle = document.getElementById('modal-title');

  modalTitle.textContent = `Historial de Reservas - ${accommodationName}`;
  modalBody.innerHTML = '<p>Cargando reservas...</p>';
  modal.style.display = 'block';

  fetch(`../backend/reservas_get_by_alojamiento.php?alojamiento_id=${accommodationId}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length === 0) {
        modalBody.innerHTML = '<p>No hay reservas.</p>';
        return;
      }
      let tableHtml = '<table class="reservas-table"><thead><tr><th>Nombre</th><th>Apellido</th><th>Email</th><th>Teléfono</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Cant. Personas</th><th>Precio Total</th></tr></thead><tbody>';
      data.forEach(r => {
        tableHtml += `<tr>
          <td>${escapeHtml(r.nombre)}</td>
          <td>${escapeHtml(r.apellido)}</td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.telefono)}</td>
          <td>${r.fecha_inicio}</td>
          <td>${r.fecha_fin}</td>
          <td>${r.cantidad_personas}</td>
          <td>$${r.precio_total}</td>
        </tr>`;
      });
      tableHtml += '</tbody></table>';
      modalBody.innerHTML = tableHtml;
    })
    .catch(err => {
      console.error(err);
      modalBody.innerHTML = '<p>Error al cargar reservas.</p>';
    });
}

function cerrarModal() {
  document.getElementById('reservasModal').style.display = 'none';
}

// Export functions for global access
window.editAccommodation = editAccommodation;
window.deleteAccommodation = deleteAccommodation;
window.loadUserAccommodations = loadUserAccommodations;
window.verHistorial = verHistorial;
window.cerrarModal = cerrarModal;
