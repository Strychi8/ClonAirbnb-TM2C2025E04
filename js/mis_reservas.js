/**
 * Mis Reservas - JavaScript Module
 * Handles fetching, displaying, and cancelling user reservations
 */

// Global variables
let currentUser = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Check authentication
    currentUser = await SessionUtils.requireAuth();
    if (!currentUser) return; // Already redirected to login

    // Load user reservations
    await loadUserReservations();

  } catch (error) {
    console.error('Error initializing page:', error);
    showError('Error al cargar la página');
  }
});

/**
 * Load and display user reservations
 */
async function loadUserReservations() {
  try {
    showLoading();

    const response = await fetch(`../backend/reservas_get_by_usuario.php?usuario_id=${currentUser.user_id}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const reservations = await response.json();
    if (reservations.error) throw new Error(reservations.error);

    displayReservations(reservations);

  } catch (error) {
    console.error('Error loading reservations:', error);
    showError('Error al cargar las reservas');
  }
}

/**
 * Parse date and fix timezone offset issue
 */
function parseDate(dateString) {
  if (!dateString) return null;
  const [y, m, d] = dateString.split('-');
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + 1); // Add 1 day to compensate
  return date;
}

/**
 * Display reservations in the table
 */
function displayReservations(reservations) {
  const tableBody = document.getElementById('tabla-body');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (!reservations || reservations.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="no-data">
          No tienes reservas realizadas.
          <br>
          <a href="../index.html" style="color: #2ea44f; text-decoration: none;">
            <strong>¡Explora alojamientos y haz tu primera reserva!</strong>
          </a>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = reservations.map(reservation => {
    const imageSrc = reservation.alojamiento_imagen 
      ? `../${reservation.alojamiento_imagen}` 
      : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjZjBkOWMwIi8+CjxyZWN0IHg9IjMwIiB5PSIyMCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjZThjZmFlIi8+Cjx0ZXh0IHg9IjYwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjNzc3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TaW4gaW1hZ2VuPC90ZXh0Pgo8L3N2Zz4K';

    // Parse dates with fix
    const fechaInicio = parseDate(reservation.fecha_inicio);
    const fechaFin = parseDate(reservation.fecha_fin);

    // Estado de la reserva según la BD
    let estadoBadge = '';
    let estadoClass = '';
    switch (reservation.estado) {
      case 'cancelada':
        estadoBadge = 'Cancelada';
        estadoClass = 'estado-cancelada';
        break;
      case 'finalizada':
        estadoBadge = 'Finalizada';
        estadoClass = 'estado-finalizada';
        break;
      case 'activa':
        estadoBadge = 'Activa';
        estadoClass = 'estado-activa';
        break;
      default:
        estadoBadge = 'Desconocida';
        estadoClass = '';
    }

    // Determinar botón de cancelación
    let cancelButton = '';
    if (reservation.estado !== 'activa') {
      cancelButton = `<span style="color: #999;">No cancelable</span>`;
    } else {
      const diffDays = (fechaInicio - hoy) / (1000 * 60 * 60 * 24);
      cancelButton = diffDays >= 2
        ? `<button class="btn-cancelar" onclick="cancelReservation(${reservation.id}, this)">Cancelar</button>`
        : `<button class="btn-cancelar-disabled" disabled>No cancelable</button>`;
    }

    const precioFmt = parseFloat(reservation.precio_total).toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    // Mostrar fechas en formato dd/mm/yyyy
    const checkInStr = fechaInicio ? fechaInicio.toLocaleDateString('es-ES') : 'N/A';
    const checkOutStr = fechaFin ? fechaFin.toLocaleDateString('es-ES') : 'N/A';
    const fechaReservaStr = reservation.fecha_reserva ? parseDate(reservation.fecha_reserva).toLocaleDateString('es-ES') : 'N/A';

    return `
      <tr data-reservation-id="${reservation.id}">
        <td class="foto-cell">
          <img src="${imageSrc}" alt="${escapeHtml(reservation.alojamiento_nombre)}">
        </td>
        <td style="text-align: center;">
          <a href="../alojamientos/alojamiento.html?id=${reservation.alojamiento_id}" style="color: black; text-decoration: none;">
            <strong>${escapeHtml(reservation.alojamiento_nombre)}</strong>
          </a>
          <br>
          <small style="color: #666;">📍 ${escapeHtml(reservation.alojamiento_direccion || 'Sin dirección')}</small>
          <br>
          <small style="color: #888;">Reservado: ${fechaReservaStr}</small>
        </td>
        <td>
          <strong>Check-in:</strong><br>${checkInStr}<br><br>
          <strong>Check-out:</strong><br>${checkOutStr}
        </td>
        <td>${reservation.cantidad_personas}</td>
        <td class="precio-cell"><strong>$ ${precioFmt}</strong></td>
        <td><span class="estado-badge ${estadoClass}">${estadoBadge}</span></td>
        <td class="accion-cell">${cancelButton}</td>
      </tr>
    `;
  }).join('');
}

/**
 * Cancel a reservation
 */
async function cancelReservation(reservationId, btnElement) {
  if (!confirm('¿Seguro que deseas cancelar esta reserva?')) return;

  try {
    const response = await fetch(`../backend/cancelar_reserva.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ reserva_id: reservationId, usuario_id: currentUser.user_id })
    });

    let result;
    const text = await response.text();
    try { result = JSON.parse(text); } 
    catch (e) {
      console.error('Respuesta inválida del servidor:', text);
      alert('Error al comunicarse con el servidor.');
      return;
    }

    if (result.success) {
      alert('Reserva cancelada correctamente.');
      if (btnElement) {
        btnElement.outerHTML = `<span style="color: #999;">No cancelable</span>`;
        const badge = btnElement.closest('tr').querySelector('.estado-badge');
        if (badge) {
          badge.textContent = 'Cancelada';
          badge.className = 'estado-badge estado-cancelada';
        }
      }
    } else {
      alert(result.error || 'No se pudo cancelar la reserva.');
    }

  } catch (error) {
    console.error('Error cancelling reservation:', error);
    alert('Error al cancelar la reserva.');
  }
}

/**
 * Show loading state
 */
function showLoading() {
  const tableBody = document.getElementById('tabla-body');
  tableBody.innerHTML = `
    <tr>
      <td colspan="7" class="no-data">Cargando reservas...</td>
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
      <td colspan="7" class="no-data" style="color: #e5534b;">
        ${message}
        <br>
        <button onclick="loadUserReservations()" style="margin-top: 10px; padding: 5px 10px; background: #2ea44f; color: white; border: none; border-radius: 4px; cursor: pointer;">
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
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions
window.loadUserReservations = loadUserReservations;
window.cancelReservation = cancelReservation;
