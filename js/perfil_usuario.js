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
    const infoFechaElement = document.getElementById('info-fecha');
    const fechaRegistroElement = document.getElementById('fecha-registro');
    const avatarElement = document.getElementById('avatar-inicial');

    if (nombreElement) nombreElement.textContent = usuario.nombre;
    if (infoNombreElement) infoNombreElement.textContent = usuario.nombre;
    if (infoEmailElement) infoEmailElement.textContent = usuario.email;
    
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

    // Actualizar avatar con inicial del nombre
    if (avatarElement && usuario.nombre) {
        avatarElement.textContent = usuario.nombre.charAt(0).toUpperCase();
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