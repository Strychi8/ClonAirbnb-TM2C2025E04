document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-recuperar-contrasenia');
    const mensajeDiv = document.getElementById('mensaje');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        
        // Validaciones del frontend
        if (!email) {
            mostrarMensaje('Por favor ingresa tu email', 'error');
            return;
        }
        
        if (!validarEmail(email)) {
            mostrarMensaje('Por favor ingresa un email válido', 'error');
            return;
        }

        // Deshabilitar botón mientras se procesa
        const submitBtn = form.querySelector('button[type="submit"]');
        const textoOriginal = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';

        try {
            const response = await fetch('../backend/recuperar_contrasenia.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email
                })
            });

            const data = await response.json();

            if (data.success) {
                mostrarMensaje(data.message, 'exito');
                form.reset();
                
                // Mostrar mensaje adicional
                setTimeout(() => {
                    mostrarMensaje(
                        '📧 Revisa tu bandeja de entrada y la carpeta de spam. El enlace es válido por 1 hora.',
                        'exito'
                    );
                }, 2000);
            } else {
                mostrarMensaje(data.message || 'Error al procesar solicitud', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarMensaje('Error de conexión. Inténtalo de nuevo.', 'error');
        } finally {
            // Rehabilitar botón
            submitBtn.disabled = false;
            submitBtn.textContent = textoOriginal;
        }
    });

    function mostrarMensaje(texto, tipo) {
        mensajeDiv.textContent = texto;
        mensajeDiv.className = `mensaje ${tipo}`;
        mensajeDiv.style.display = 'block';
        
        // Auto-ocultar mensaje después de 8 segundos para mensajes de éxito
        if (tipo === 'exito') {
            setTimeout(() => {
                mensajeDiv.style.display = 'none';
            }, 8000);
        }
    }

    function validarEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
});