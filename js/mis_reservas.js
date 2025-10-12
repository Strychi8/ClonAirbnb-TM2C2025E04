/**
 * Mis Reservas - JavaScript Module
 * Handles fetching, displaying, and cancelling user reservations
 */

// Global variables
let currentUser = null;
let reservations = []; // Guardamos todas las reservas aquí

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Verificar autenticación
    currentUser = await SessionUtils.requireAuth();
    if (!currentUser) return; // Ya redirigido al login

    // Cargar reservas
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

    reservations = await response.json(); // Guardamos en la variable global
    if (reservations.error) throw new Error(reservations.error);

    displayReservations(reservations);

  } catch (error) {
    console.error('Error loading reservations:', error);
    showError('Error al cargar las reservas');
  }
}

/**
 * Parse date
 */
function parseDate(dateString) {
  if (!dateString) return null;
  const [y,m,d] = dateString.split('-');
  return new Date(y,m-1,d);
}

/**
 * Display reservations in the table
 */
function displayReservations(reservations) {
  const tableBody = document.getElementById('tabla-body');
  const hoy = new Date();
  hoy.setHours(0,0,0,0);

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
    const imageSrc = reservation.alojamiento_imagen ? `../${reservation.alojamiento_imagen}` : 'data:image/svg+xml;base64,...';

    const fechaInicio = parseDate(reservation.fecha_inicio);
    const fechaFin = parseDate(reservation.fecha_fin);
    const fechaReservaStr = reservation.fecha_reserva ? parseDate(reservation.fecha_reserva).toLocaleDateString('es-ES') : 'N/A';

    // Estado visual
    let estadoClass = '';
    switch (reservation.estado) {
      case 'activa': estadoClass = 'estado-activa'; break;
      case 'cancelada': estadoClass = 'estado-cancelada'; break;
      case 'finalizada': estadoClass = 'estado-finalizada'; break;
      default: estadoClass = '';
    }

    const estadoBadge = reservation.estado.charAt(0).toUpperCase() + reservation.estado.slice(1);

    // Botón de cancelación
    let cancelButton = '';
    if (reservation.estado !== 'activa') {
      cancelButton = `<span style="color:#6b6b6b; font-weight: bold;">No Cancelable</span>`;
    } else {
      const diffDays = (fechaInicio - hoy) / (1000*60*60*24);
      cancelButton = diffDays >= 2
        ? `<button class="btn-cancel" onclick="cancelReservation(${reservation.id}, this)">Cancelar</button>`
        : `<button class="btn-cancelar-disabled" disabled>No Cancelable</button>`;
    }

    const precioFmt = parseFloat(reservation.precio_total).toLocaleString('es-AR',{minimumFractionDigits:2, maximumFractionDigits:2});
    const checkInStr = fechaInicio ? fechaInicio.toLocaleDateString('es-ES') : 'N/A';
    const checkOutStr = fechaFin ? fechaFin.toLocaleDateString('es-ES') : 'N/A';

    return `
      <tr data-reservation-id="${reservation.id}">
        <td class="foto-cell"><img src="${imageSrc}" alt="${escapeHtml(reservation.alojamiento_nombre)}"></td>
        <td style="text-align:center;">
          <a href="../alojamientos/alojamiento.html?id=${reservation.alojamiento_id}" style="color:black;text-decoration:none;">
            <strong>${escapeHtml(reservation.alojamiento_nombre)}</strong>
          </a><br>
          <small style="color:#666;">📍 ${escapeHtml(reservation.alojamiento_direccion||'Sin dirección')}</small><br>
          <small style="color:#888;">Reservado: ${fechaReservaStr}</small>
        </td>
        <td><strong>Check-in:</strong><br>${checkInStr}<br><br><strong>Check-out:</strong><br>${checkOutStr}</td>
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

    const text = await response.text();
    let result;
    try { result = JSON.parse(text); } 
    catch (e) {
      console.error('Respuesta inválida del servidor:', text);
      alert('Error al comunicarse con el servidor.');
      return;
    }

    if (result.success) {
      alert('Reserva cancelada correctamente.');

      // Actualizamos el estado en la variable global
      const reserva = reservations.find(r => r.id === reservationId);
      if (reserva) {
        reserva.estado = 'cancelada';
      }

      // Volvemos a renderizar la tabla completa
      displayReservations(reservations);
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
 * Escape HTML
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
