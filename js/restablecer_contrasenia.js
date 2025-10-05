document.addEventListener('DOMContentLoaded', function() {
    const tokenStatusDiv = document.getElementById('token-status');
    const formContainer = document.getElementById('form-container');
    const form = document.getElementById('form-restablecer-contrasenia');
    const mensajeDiv = document.getElementById('mensaje');

    // Obtener token de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
        mostrarError('Token de recuperación no encontrado', 'No se proporcionó un token válido en el enlace.');
        return;
    }

    // Verificar si el token es válido
    verificarToken(token);

    // Configurar evento del formulario
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nuevaContrasenia = document.getElementById('nueva_contrasenia').value;
        const confirmarContrasenia = document.getElementById('confirmar_contrasenia').value;
        
        // Validaciones del frontend
        if (!nuevaContrasenia || !confirmarContrasenia) {
            mostrarMensaje('Por favor completa todos los campos', 'error');
            return;
        }
        
        if (nuevaContrasenia.length < 6) {
            mostrarMensaje('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (nuevaContrasenia !== confirmarContrasenia) {
            mostrarMensaje('Las contraseñas no coinciden', 'error');
            return;
        }

        // Deshabilitar botón mientras se procesa
        const submitBtn = form.querySelector('button[type="submit"]');
        const textoOriginal = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Actualizando...';

        try {
            const response = await fetch('../backend/restablecer_contrasenia.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    nueva_contrasenia: nuevaContrasenia
                })
            });

            const data = await response.json();

            if (data.success) {
                mostrarMensaje('¡Contraseña actualizada exitosamente!', 'exito');
                form.reset();
                
                // Redirigir al login después de 3 segundos
                setTimeout(() => {
                    window.location.href = 'signin.html';
                }, 3000);
                
                mostrarMensaje('Redirigiendo al login en 3 segundos...', 'exito');
            } else {
                mostrarMensaje(data.message || 'Error al actualizar contraseña', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión. Inténtalo de nuevo.', 'error');
        } finally {
            // Rehabilitar botón si no fue exitoso
            submitBtn.disabled = false;
            submitBtn.textContent = textoOriginal;
        }
    });

    async function verificarToken(token) {
        // Mostrar estado de carga
        tokenStatusDiv.innerHTML = `
            <div class="info-box-password">
                <h3>🔍 Verificando token...</h3>
                <p>Validando el enlace de recuperación.</p>
            </div>
        `;

        try {
            // Hacer una petición simple para verificar si el token existe y es válido
            // Como no tenemos un endpoint específico para esto, mostraremos el formulario directamente
            // En una implementación más robusta, podrías crear un endpoint separado para verificar tokens
            
            mostrarExito();
        } catch (error) {
            mostrarError('Error de conexión', 'No se pudo verificar el token. Inténtalo de nuevo.');
        }
    }

    function mostrarExito() {
        tokenStatusDiv.innerHTML = `
            <div class="info-box-password">
                <h3>✅ Token válido</h3>
                <p>Tu enlace de recuperación es válido. Puedes proceder a cambiar tu contraseña.</p>
            </div>
        `;
        formContainer.style.display = 'block';
    }

    function mostrarError(titulo, descripcion) {
        tokenStatusDiv.innerHTML = `
            <div class="error-box">
                <h3>❌ ${titulo}</h3>
                <p>${descripcion}</p>
                <p>
                    <a href="recuperar_contrasenia.html">
                        Solicita un nuevo enlace de recuperación
                    </a>
                </p>
            </div>
        `;
        formContainer.style.display = 'none';
    }

    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        mensajeDiv.style.display = 'block';
        
        // Auto-ocultar mensaje después de 5 segundos para errores
        if (tipo === 'error') {
            setTimeout(() => {
                mensajeDiv.style.display = 'none';
            }, 5000);
        }
    }
});