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
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const accommodations = await response.json();
    
    if (accommodations.error) {
      throw new Error(accommodations.error);
    }
    
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
        <td colspan="4" class="no-data">
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
          <strong>${escapeHtml(accommodation.nombre)}</strong>
          <br>
          <small style="color: #666;">$${accommodation.precio_noche}/noche</small>
          ${accommodation.descripcion ? `<br><small style="color: #888;">${escapeHtml(accommodation.descripcion.substring(0, 100))}${accommodation.descripcion.length > 100 ? '...' : ''}</small>` : ''}
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
  console.log('deleteAccommodation llamada con id:', accommodationId);
  if (!confirm(`¿Estás seguro de que quieres eliminar "${accommodationName}"?\n\nEsta acción no se puede deshacer.`)) {
    return;
  }
  try {
    const response = await fetch('../backend/eliminar_alojamiento.php', {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: accommodationId,
        usuario_id: currentUser.user_id
      })
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      throw new Error(result.message || result.error || 'Error al eliminar el alojamiento');
    }

    // Refrescar la lista
    await loadUserAccommodations();
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
      <td colspan="4" class="no-data">
        Cargando alojamientos...
      </td>
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
      <td colspan="4" class="no-data" style="color: #e5534b;">
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

// Export functions for global access (needed for onclick handlers)
window.editAccommodation = editAccommodation;
window.deleteAccommodation = deleteAccommodation;
window.loadUserAccommodations = loadUserAccommodations;
