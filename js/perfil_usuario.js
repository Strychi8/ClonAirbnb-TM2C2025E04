document.addEventListener('DOMContentLoaded', function () {
  // Verificar que el usuario esté logueado usando el mismo sistema que index.html
  fetch('../backend/check_login.php')
    .then(res => res.json())
    .then(data => {
      if (!data.logged_in) {
        window.location.href = 'signin.html';
        return;
      }

      // Crear objeto usuario compatible con el resto del código
      const usuarioLogueado = {
        id: data.user_id,
        nombre: data.user_name,
        nombre_completo: data.nombre_completo || '',
        email: data.user_email || '',
        telefono: data.telefono || '',
        foto_perfil: data.foto_perfil || '',
        direccion: data.direccion || '',
        numero_identidad: data.numero_identidad || '',
        created_at: data.created_at || ''
      };

      // Guardamos una copia por si otras pantallas la usan
      localStorage.setItem('usuario', JSON.stringify(usuarioLogueado));

      cargarInfoUsuario(usuarioLogueado);
      configurarEventos(usuarioLogueado);        // editar/guardar/eliminar
      wiringModalDesactivar(usuarioLogueado);    // desactivar cuenta (modal)
    })
    .catch(err => {
      console.error('Error al verificar sesión:', err);
      window.location.href = 'signin.html';
    });
});

function configurarEventos(usuarioLogueado) {
  // Editar perfil
  const btnEditar = document.getElementById('btn-editar');
  btnEditar?.addEventListener('click', function () {
    mostrarFormularioEdicion(usuarioLogueado);
  });

  // Cancelar edición
  const btnCancelar = document.getElementById('btn-cancelar');
  btnCancelar?.addEventListener('click', function () {
    ocultarFormularioEdicion();
  });

  // Guardar edición
  const formEditar = document.getElementById('form-editar-perfil');
  formEditar?.addEventListener('submit', function (e) {
    e.preventDefault();
    guardarCambiosPerfil(usuarioLogueado);
  });

  // Manejamos el Logout (si existiera ese botón en esta vista)
  const btnLogout = document.getElementById('btn-logout');
  btnLogout?.addEventListener('click', function () {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      fetch('../backend/logout.php')
        .then(() => (window.location.href = '../index.html'))
        .catch(() => (window.location.href = '../index.html'));
    }
  });

  // Eliminar cuenta (hard delete)
  const btnEliminarCuenta = document.getElementById('btn-eliminar-cuenta');
  btnEliminarCuenta?.addEventListener('click', function () {
    const confirmacion = confirm(
      '⚠️ ADVERTENCIA: Esta acción es irreversible.\n\n¿Estás seguro de que deseas eliminar tu cuenta permanentemente?\n\nSe eliminarán todos tus datos, alojamientos y reservas.'
    );
    if (!confirmacion) return;

    const confirmacionFinal = prompt('Para confirmar, escribe "ELIMINAR" (en mayúsculas):');
    if (confirmacionFinal !== 'ELIMINAR') {
      alert('Eliminación cancelada.');
      return;
    }

    eliminarCuenta(usuarioLogueado.id);
  });
}

function cargarInfoUsuario(usuario) {
  // Actualizar nombre del usuario
  const nombreElement = document.getElementById('usuario-nombre');
  const infoNombreElement = document.getElementById('info-nombre');
  const infoNombreCompletoElement = document.getElementById('info-nombre-completo');
  const infoEmailElement = document.getElementById('info-email');
  const infoTelefonoElement = document.getElementById('info-telefono');
  const infoDireccionElement = document.getElementById('info-direccion');
  const infoNumeroIdentidadElement = document.getElementById('info-numero-identidad');
  const infoFechaElement = document.getElementById('info-fecha');
  const fechaRegistroElement = document.getElementById('fecha-registro');
  const avatarElement = document.getElementById('avatar-inicial');
  const fotoPerfilImg = document.getElementById('foto-perfil-img');

  const displayName = usuario.nombre_completo || usuario.nombre;

  nombreElement && (nombreElement.textContent = displayName);
  infoNombreElement && (infoNombreElement.textContent = usuario.nombre);
  infoNombreCompletoElement && (infoNombreCompletoElement.textContent = usuario.nombre_completo || 'No especificado');
  infoEmailElement && (infoEmailElement.textContent = usuario.email);
  infoTelefonoElement && (infoTelefonoElement.textContent = usuario.telefono || 'No especificado');
  infoDireccionElement && (infoDireccionElement.textContent = usuario.direccion || 'No especificada');
  infoNumeroIdentidadElement && (infoNumeroIdentidadElement.textContent = usuario.numero_identidad || 'No especificado');

  // Formatear fecha
  if (usuario.created_at) {
    const fecha = new Date(usuario.created_at);
    const fechaFormateada = fecha.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    infoFechaElement && (infoFechaElement.textContent = fechaFormateada);
    fechaRegistroElement && (fechaRegistroElement.textContent = fechaFormateada);
  }

  // Manejar foto de perfil
  if (usuario.foto_perfil && fotoPerfilImg && avatarElement) {
    fotoPerfilImg.src = '../' + usuario.foto_perfil;
    fotoPerfilImg.style.display = 'block';
    avatarElement.style.display = 'none';
  } else if (avatarElement && usuario.nombre) {
    avatarElement.textContent = usuario.nombre.charAt(0).toUpperCase();
    avatarElement.style.display = 'flex';
    fotoPerfilImg && (fotoPerfilImg.style.display = 'none');
  }
}

function mostrarFormularioEdicion(usuario) {
  document.getElementById('perfil-view')?.style && (document.getElementById('perfil-view').style.display = 'none');
  document.getElementById('perfil-edit')?.style && (document.getElementById('perfil-edit').style.display = 'block');

  const editNombre = document.getElementById('edit-nombre');
  const editNombreCompleto = document.getElementById('edit-nombre-completo');
  const editTelefono = document.getElementById('edit-telefono');
  const editDireccion = document.getElementById('edit-direccion');
  const editNumeroIdentidad = document.getElementById('edit-numero-identidad');

  editNombre && (editNombre.value = usuario.nombre || '');
  editNombreCompleto && (editNombreCompleto.value = usuario.nombre_completo || '');
  editTelefono && (editTelefono.value = usuario.telefono || '');
  editDireccion && (editDireccion.value = usuario.direccion || '');
  editNumeroIdentidad && (editNumeroIdentidad.value = usuario.numero_identidad || '');
}

function ocultarFormularioEdicion() {
  document.getElementById('perfil-view')?.style && (document.getElementById('perfil-view').style.display = 'block');
  document.getElementById('perfil-edit')?.style && (document.getElementById('perfil-edit').style.display = 'none');
}

async function guardarCambiosPerfil(usuario) {
  try {
    const form = document.getElementById('form-editar-perfil');
    const formData = new FormData(form);
    formData.append('usuario_id', usuario.id);

    const response = await fetch('../backend/actualizar_perfil.php', { method: 'POST', body: formData });
    const data = await response.json();

    if (!data.success) throw new Error(data.message || 'No se pudo actualizar el perfil');

    alert('✅ Perfil actualizado correctamente');

    // Actualizo el objeto y guardo en storage
    const actualizado = {
      ...usuario,
      nombre: data.usuario.nombre,
      nombre_completo: data.usuario.nombre_completo,
      telefono: data.usuario.telefono,
      direccion: data.usuario.direccion,
      numero_identidad: data.usuario.numero_identidad,
      foto_perfil: data.usuario.foto_perfil || usuario.foto_perfil
    };
    localStorage.setItem('usuario', JSON.stringify(actualizado));

    cargarInfoUsuario(actualizado);
    ocultarFormularioEdicion();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ ' + error.message);
  }
}

async function eliminarCuenta(usuarioId) {
  try {
    const response = await fetch('../backend/eliminar_cuenta.php', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario_id: usuarioId })
    });
    const data = await response.json();

    if (!data.success) throw new Error(data.message || 'Error desconocido');

    alert('Tu cuenta ha sido eliminada exitosamente.');
    await fetch('../backend/logout.php'); // por si hay sesión del lado servidor
    localStorage.removeItem('usuario');
    window.location.href = '../index.html';
  } catch (error) {
    console.error('Error:', error);
    alert('Error al eliminar la cuenta: ' + error.message);
  }
}

function wiringModalDesactivar(usuarioLogueado) {
  const btnDesactivar = document.getElementById('btn-desactivar-cuenta');
  const modal = document.getElementById('modal-desactivar');
  const confirmar = document.getElementById('confirmar-desactivar');
  const cerrar = document.getElementById('cerrar-desactivar');
  const motivoSel = document.getElementById('motivo-desactivar');
  const detalleTxt = document.getElementById('detalle-desactivar');

  if (!btnDesactivar || !modal || !confirmar || !cerrar || !motivoSel) return;

  btnDesactivar.addEventListener('click', () => {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  });

  const closeModal = () => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  };
  cerrar.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

confirmar.addEventListener('click', async () => {
  try {
    const motivo  = document.getElementById('motivo-desactivar').value;
    const detalle = document.getElementById('detalle-desactivar').value;

    const resp = await fetch('../backend/desactivar_cuenta.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_id: usuarioLogueado.id,
        motivo,
        detalle
      })
    });
    const data = await resp.json();

    if (!resp.ok || !data.success) {
      // Caso específico: tiene reservas futuras
      if (data && data.code === 'reservas_pendientes') {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        alert(`No podés desactivar la cuenta: ${data.message}\n\nTe llevo a "Mis Reservas" para cancelarlas.`);
        window.location.href = '../reservas/mis_reservas.html';
        return;
      }
      throw new Error(data.message || 'Error desactivando la cuenta');
    }

    // OK
    localStorage.removeItem('usuario');
    alert('Tu cuenta fue desactivada. Podrás reactivarla cuando quieras.');
    window.location.href = '../index.html';
  } catch (e) {
    alert(e.message);
  } finally {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
});
}