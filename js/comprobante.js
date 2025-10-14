// JavaScript para el comprobante de reserva

document.addEventListener('DOMContentLoaded', function() {
    // Obtener el ID de la reserva desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    const reservaId = urlParams.get('id');
    
    if (!reservaId) {
        mostrarError('No se proporcionó un ID de reserva válido.');
        return;
    }
    
    // Cargar los datos de la reserva
    cargarDatosReserva(reservaId);
});

async function cargarDatosReserva(reservaId) {
    try {
        mostrarCargando(true);
        
        const response = await fetch(`../backend/comprobante.php?id=${reservaId}`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al cargar los datos de la reserva');
        }
        
        if (data.success) {
            mostrarDatosReserva(data.reserva);
            mostrarExito();
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
        
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al cargar los datos de la reserva: ' + error.message);
    } finally {
        mostrarCargando(false);
    }
}

function mostrarDatosReserva(reserva) {
    // Información del huésped
    document.getElementById('reserva-id').textContent = reserva.id;
    document.getElementById('nombre').textContent = reserva.nombre;
    document.getElementById('apellido').textContent = reserva.apellido;
    document.getElementById('email').textContent = reserva.email;
    document.getElementById('telefono').textContent = reserva.telefono;
    
    // Información del alojamiento
    document.getElementById('alojamiento-nombre').textContent = reserva.alojamiento.nombre;
    document.getElementById('alojamiento-descripcion').textContent = reserva.alojamiento.descripcion || 'Sin descripción disponible';
    document.getElementById('alojamiento-direccion').textContent = reserva.alojamiento.direccion;
    
    // Mostrar imagen del alojamiento si existe
    const imagenElement = document.getElementById('alojamiento-imagen');
    const placeholderElement = document.getElementById('no-image-placeholder');
    
    console.log('🔍 Debugging imagen del alojamiento:');
    console.log('- reserva.alojamiento:', reserva.alojamiento);
    console.log('- imagen value:', reserva.alojamiento.imagen);
    console.log('- imagen type:', typeof reserva.alojamiento.imagen);
    console.log('- imagen trimmed:', reserva.alojamiento.imagen ? reserva.alojamiento.imagen.trim() : 'null/undefined');
    
    if (reserva.alojamiento.imagen && reserva.alojamiento.imagen.trim() !== '') {
        // Verificar si la imagen ya incluye la ruta uploads/
        let imagePath;
        if (reserva.alojamiento.imagen.startsWith('uploads/')) {
            imagePath = `../${reserva.alojamiento.imagen}`;
        } else {
            imagePath = `../uploads/${reserva.alojamiento.imagen}`;
        }
        console.log('- Intentando cargar imagen desde:', imagePath);
        
        // Crear una nueva imagen para verificar si existe
        const testImg = new Image();
        testImg.onload = function() {
            console.log('✅ Imagen cargada exitosamente:', imagePath);
            imagenElement.src = imagePath;
            imagenElement.style.display = 'block';
            imagenElement.alt = `Imagen de ${reserva.alojamiento.nombre}`;
            placeholderElement.style.display = 'none';
        };
        testImg.onerror = function() {
            console.error('❌ Error cargando imagen:', imagePath);
            console.error('- Verificar que el archivo existe en la carpeta uploads/');
            console.error('- Verificar permisos de archivo');
            imagenElement.style.display = 'none';
            placeholderElement.style.display = 'block';
        };
        testImg.src = imagePath;
    } else {
        console.log('⚠️ No hay imagen disponible o está vacía');
        console.log('- Mostrando placeholder');
        imagenElement.style.display = 'none';
        placeholderElement.style.display = 'block';
    }
    
    // Detalles de la reserva
    document.getElementById('fecha-inicio').textContent = reserva.fecha_inicio;
    document.getElementById('fecha-fin').textContent = reserva.fecha_fin;
    document.getElementById('dias-estadia').textContent = reserva.dias_estadia;
    document.getElementById('cantidad-personas').textContent = reserva.cantidad_personas;
    document.getElementById('fecha-reserva').textContent = reserva.fecha_reserva;
    
    // Información de pago
    document.getElementById('precio-noche').textContent = `$${reserva.precio_noche}`;
    document.getElementById('metodo-pago').textContent = reserva.metodo_pago;
    document.getElementById('precio-total').textContent = `$${reserva.precio_total}`;
}

function mostrarError(mensaje) {
    const container = document.querySelector('.comprobante-container');
    container.innerHTML = `
        <div class="error-container">
            <div class="error-icon">⚠️</div>
            <h2>Error</h2>
            <p>${mensaje}</p>
            <a href="../index.html" class="btn btn-primary">Volver al Inicio</a>
        </div>
    `;
    
    // Agregar estilos para el error
    const style = document.createElement('style');
    style.textContent = `
        .error-container {
            text-align: center;
            padding: 50px;
            color: #dc3545;
        }
        .error-icon {
            font-size: 3em;
            margin-bottom: 20px;
        }
        .error-container h2 {
            color: #dc3545;
            margin-bottom: 15px;
        }
        .error-container p {
            color: #6c757d;
            margin-bottom: 25px;
        }
    `;
    document.head.appendChild(style);
}

function mostrarCargando(mostrar) {
    const loadingSection = document.getElementById('loading-section');
    const errorSection = document.getElementById('error-section');
    const successContent = document.getElementById('success-content');
    
    if (mostrar) {
        loadingSection.style.display = 'block';
        errorSection.style.display = 'none';
        successContent.style.display = 'none';
    } else {
        loadingSection.style.display = 'none';
    }
}

function mostrarError(mensaje) {
    const loadingSection = document.getElementById('loading-section');
    const errorSection = document.getElementById('error-section');
    const successContent = document.getElementById('success-content');
    
    loadingSection.style.display = 'none';
    successContent.style.display = 'none';
    errorSection.style.display = 'block';
    
    document.getElementById('error-message').textContent = mensaje;
}

function mostrarExito() {
    const loadingSection = document.getElementById('loading-section');
    const errorSection = document.getElementById('error-section');
    const successContent = document.getElementById('success-content');
    
    loadingSection.style.display = 'none';
    errorSection.style.display = 'none';
    successContent.style.display = 'block';
}

function imprimirComprobante() {
    // Ocultar botones de acción antes de imprimir
    const actions = document.querySelector('.actions');
    const footerInfo = document.querySelector('.footer-info');
    
    if (actions) actions.style.display = 'none';
    if (footerInfo) footerInfo.style.display = 'none';
    
    // Asegurar que las imágenes estén cargadas antes de imprimir
    const images = document.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;
    
    if (totalImages === 0) {
        window.print();
        return;
    }
    
    const checkImagesAndPrint = () => {
        loadedImages++;
        if (loadedImages === totalImages) {
            setTimeout(() => {
                window.print();
                // Restaurar botones después de imprimir
                setTimeout(() => {
                    if (actions) actions.style.display = 'flex';
                    if (footerInfo) footerInfo.style.display = 'block';
                }, 1000);
            }, 500);
        }
    };
    
    images.forEach(img => {
        if (img.complete) {
            checkImagesAndPrint();
        } else {
            img.onload = checkImagesAndPrint;
            img.onerror = checkImagesAndPrint;
        }
    });
}

// Función para formatear números con separadores de miles
function formatearNumero(numero) {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Función para validar que el ID de reserva sea numérico
function validarIdReserva(id) {
    return /^\d+$/.test(id);
}
