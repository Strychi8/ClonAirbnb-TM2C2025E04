document.addEventListener('DOMContentLoaded', function() {
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
                email: data.user_email || '',
                telefono: data.telefono || '',
                foto_perfil: data.foto_perfil || '',
                direccion: data.direccion || '',
                numero_identidad: data.numero_identidad || '',
                created_at: data.created_at || ''
            };

            // Cargar información del usuario
            cargarInfoUsuario(usuarioLogueado);

            // Configurar eventos
            configurarEventos(usuarioLogueado);
        })
        .catch(err => {
            console.error('Error al verificar sesión:', err);
            window.location.href = 'signin.html';
        });
});

function configurarEventos(usuarioLogueado) {

    // Manejar editar perfil
    const btnEditar = document.getElementById('btn-editar');
    if (btnEditar) {
        btnEditar.addEventListener('click', function() {
            mostrarFormularioEdicion(usuarioLogueado);
        });
    }

    // Manejar cancelar edición
    const btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) {
        btnCancelar.addEventListener('click', function() {
            ocultarFormularioEdicion();
        });
    }

    // Manejar submit del formulario de edición
    const formEditar = document.getElementById('form-editar-perfil');
    if (formEditar) {
        formEditar.addEventListener('submit', function(e) {
            e.preventDefault();
            guardarCambiosPerfil(usuarioLogueado);
        });
    }

    // Manejar logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                fetch('../backend/logout.php')
                    .then(() => {
                        window.location.href = '../index.html';
                    })
                    .catch(err => {
                        console.error('Error al cerrar sesión:', err);
                        window.location.href = '../index.html';
                    });
            }
        });
    }

    // Manejar eliminación de cuenta
    const btnEliminarCuenta = document.getElementById('btn-eliminar-cuenta');
    if (btnEliminarCuenta) {
        btnEliminarCuenta.addEventListener('click', function() {
            const confirmacion = confirm('⚠️ ADVERTENCIA: Esta acción es irreversible.\n\n¿Estás seguro de que deseas eliminar tu cuenta permanentemente?\n\nSe eliminarán todos tus datos, alojamientos y reservas.');
            
            if (confirmacion) {
                const confirmacionFinal = prompt('Para confirmar, escribe "ELIMINAR" (en mayúsculas):');
                
                if (confirmacionFinal === 'ELIMINAR') {
                    eliminarCuenta(usuarioLogueado.id);
                } else {
                    alert('Eliminación cancelada.');
                }
            }
        });
    }
};

function cargarInfoUsuario(usuario) {
    // Actualizar nombre del usuario
    const nombreElement = document.getElementById('usuario-nombre');
    const infoNombreElement = document.getElementById('info-nombre');
    const infoEmailElement = document.getElementById('info-email');
    const infoTelefonoElement = document.getElementById('info-telefono');
    const infoDireccionElement = document.getElementById('info-direccion');
    const infoNumeroIdentidadElement = document.getElementById('info-numero-identidad');
    const infoFechaElement = document.getElementById('info-fecha');
    const fechaRegistroElement = document.getElementById('fecha-registro');
    const avatarElement = document.getElementById('avatar-inicial');
    const fotoPerfilImg = document.getElementById('foto-perfil-img');

    if (nombreElement) nombreElement.textContent = usuario.nombre;
    if (infoNombreElement) infoNombreElement.textContent = usuario.nombre;
    if (infoEmailElement) infoEmailElement.textContent = usuario.email;
    if (infoTelefonoElement) infoTelefonoElement.textContent = usuario.telefono || 'No especificado';
    if (infoDireccionElement) infoDireccionElement.textContent = usuario.direccion || 'No especificada';
    if (infoNumeroIdentidadElement) infoNumeroIdentidadElement.textContent = usuario.numero_identidad || 'No especificado';
    
    // Formatear fecha
    if (usuario.created_at) {
        const fecha = new Date(usuario.created_at);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        if (infoFechaElement) infoFechaElement.textContent = fechaFormateada;
        if (fechaRegistroElement) fechaRegistroElement.textContent = fechaFormateada;
    }

    // Manejar foto de perfil
    if (usuario.foto_perfil && fotoPerfilImg && avatarElement) {
        fotoPerfilImg.src = '../' + usuario.foto_perfil;
        fotoPerfilImg.style.display = 'block';
        avatarElement.style.display = 'none';
    } else if (avatarElement && usuario.nombre) {
        avatarElement.textContent = usuario.nombre.charAt(0).toUpperCase();
        avatarElement.style.display = 'flex';
        if (fotoPerfilImg) fotoPerfilImg.style.display = 'none';
    }
}

function mostrarFormularioEdicion(usuario) {
    // Ocultar vista de solo lectura
    const perfilView = document.getElementById('perfil-view');
    const perfilEdit = document.getElementById('perfil-edit');
    
    if (perfilView) perfilView.style.display = 'none';
    if (perfilEdit) perfilEdit.style.display = 'block';
    
    // Cargar datos actuales en el formulario
    const editNombre = document.getElementById('edit-nombre');
    const editTelefono = document.getElementById('edit-telefono');
    const editDireccion = document.getElementById('edit-direccion');
    const editNumeroIdentidad = document.getElementById('edit-numero-identidad');
    
    if (editNombre) editNombre.value = usuario.nombre || '';
    if (editTelefono) editTelefono.value = usuario.telefono || '';
    if (editDireccion) editDireccion.value = usuario.direccion || '';
    if (editNumeroIdentidad) editNumeroIdentidad.value = usuario.numero_identidad || '';
}

function ocultarFormularioEdicion() {
    const perfilView = document.getElementById('perfil-view');
    const perfilEdit = document.getElementById('perfil-edit');
    
    if (perfilView) perfilView.style.display = 'block';
    if (perfilEdit) perfilEdit.style.display = 'none';
}

async function guardarCambiosPerfil(usuario) {
    try {
        const form = document.getElementById('form-editar-perfil');
        const formData = new FormData(form);
        formData.append('usuario_id', usuario.id);
        
        const response = await fetch('../backend/actualizar_perfil.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Perfil actualizado correctamente');
            
            // Actualizar objeto usuario con los nuevos datos
            usuario.nombre = data.usuario.nombre;
            usuario.telefono = data.usuario.telefono;
            usuario.direccion = data.usuario.direccion;
            usuario.numero_identidad = data.usuario.numero_identidad;
            if (data.usuario.foto_perfil) {
                usuario.foto_perfil = data.usuario.foto_perfil;
            }
            
            // Recargar la vista
            cargarInfoUsuario(usuario);
            ocultarFormularioEdicion();
        } else {
            alert('❌ Error: ' + (data.message || 'No se pudo actualizar el perfil'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error de conexión. Inténtalo de nuevo.');
    }
}

async function eliminarCuenta(usuarioId) {
    try {
        const response = await fetch('../backend/eliminar_cuenta.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: usuarioId
            })
        });

        const data = await response.json();

        if (data.success) {
            alert('Tu cuenta ha sido eliminada exitosamente.');
            
            // Cerrar sesión en el servidor
            await fetch('../backend/logout.php');
            
            // Limpiar localStorage por si acaso
            localStorage.removeItem('usuarioLogueado');
            
            window.location.href = '../index.html';
        } else {
            alert('Error al eliminar la cuenta: ' + (data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión. Inténtalo de nuevo.');
    }
}