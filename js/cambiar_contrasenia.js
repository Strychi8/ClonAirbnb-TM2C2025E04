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
                nombre: data.user_name
            };

            // Configurar el formulario
            configurarFormulario(usuarioLogueado);
            
            // Configurar logout
            configurarLogout();
        })
        .catch(err => {
            console.error('Error al verificar sesión:', err);
            window.location.href = 'signin.html';
        });
});

function configurarFormulario(usuarioLogueado) {
    const form = document.getElementById('form-cambiar-contrasenia');
    const mensaje = document.getElementById('mensaje');

    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const contraseniaActual = document.getElementById('contrasenia_actual').value;
        const nuevaContrasenia = document.getElementById('nueva_contrasenia').value;
        const confirmarContrasenia = document.getElementById('confirmar_contrasenia').value;

        // Validaciones del frontend
        if (nuevaContrasenia !== confirmarContrasenia) {
            mostrarMensaje('Las nuevas contraseñas no coinciden.', 'error');
            return;
        }

        if (nuevaContrasenia.length < 6) {
            mostrarMensaje('La nueva contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }

        if (contraseniaActual === nuevaContrasenia) {
            mostrarMensaje('La nueva contraseña debe ser diferente a la actual.', 'error');
            return;
        }

        try {
            const response = await fetch('../backend/cambiar_contrasenia.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usuario_id: usuarioLogueado.id,
                    contrasenia_actual: contraseniaActual,
                    nueva_contrasenia: nuevaContrasenia
                })
            });

            const data = await response.json();

            if (data.success) {
                mostrarMensaje('Contraseña cambiada exitosamente.', 'success');
                form.reset();
                
                // Opcional: redirigir después de unos segundos
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
            } else {
                mostrarMensaje(data.message || 'Error al cambiar la contraseña.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión. Inténtalo de nuevo.', 'error');
        }
    });

    function mostrarMensaje(texto, tipo) {
        if (!mensaje) return;
        
        mensaje.textContent = texto;
        mensaje.className = `mensaje ${tipo}`;
        mensaje.style.display = 'block';
        
        // Ocultar mensaje después de 5 segundos
        setTimeout(() => {
            mensaje.style.display = 'none';
        }, 5000);
    }
}

function configurarLogout() {
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
}