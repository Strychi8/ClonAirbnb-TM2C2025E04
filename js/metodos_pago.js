window.addEventListener('DOMContentLoaded', function () {
    const metodosList = document.getElementById('metodos-list');
    const addMetodoForm = document.getElementById('add-metodo-form');
    const btnMostrarForm = document.getElementById('btn-mostrar-form');
    const btnCancelarForm = document.getElementById('btn-cancelar-form');
    const formMetodoPago = document.getElementById('form-metodo-pago');
    const alertContainer = document.getElementById('alert-container');
    
    // Card input elements
    const metodo = document.getElementById('metodo');
    const seg1 = document.getElementById('seg1');
    const seg2 = document.getElementById('seg2');
    const seg3 = document.getElementById('seg3');
    const seg4 = document.getElementById('seg4');
    
    // BIN mapping (same as metodoPago.js)
    const bins = {
        "visa-credito": "411111",
        "visa-debito": "450799",
        "master-credito": "510510",
        "master-debito": "530530",
        "mercadopago": "589562"
    };
    
    // Payment method labels
    const metodosLabels = {
        "visa-credito": "Visa Crédito",
        "visa-debito": "Visa Débito",
        "master-credito": "Mastercard Crédito",
        "master-debito": "Mastercard Débito",
        "mercadopago": "Mercado Pago"
    };
    
    // Load payment methods on page load
    cargarMetodosPago();
    
    // Show/hide form
    btnMostrarForm.addEventListener('click', function() {
        addMetodoForm.style.display = 'block';
        addMetodoForm.classList.add('active');
        btnMostrarForm.style.display = 'none';
        limpiarFormulario();
    });
    
    btnCancelarForm.addEventListener('click', function() {
        addMetodoForm.style.display = 'none';
        addMetodoForm.classList.remove('active');
        btnMostrarForm.style.display = 'block';
        limpiarFormulario();
    });
    
    // Auto-fill BIN based on payment method selection
    metodo.addEventListener('change', function () {
        const value = metodo.value;
        seg1.value = bins[value] || "";
        seg2.value = "";
        seg3.value = "";
        seg4.value = "";
        if (value) {
            seg2.focus();
        }
    });
    
    // Auto-tab between card segments
    function autoTab(current, next, maxLength) {
        current.addEventListener('input', function () {
            this.value = this.value.replace(/\D/g, ''); // Only numbers
            if (this.value.length >= maxLength && next) {
                next.focus();
            }
        });
    }
    
    autoTab(seg2, seg3, seg2.maxLength || 2);
    autoTab(seg3, seg4, seg3.maxLength || 4);
    autoTab(seg4, null, seg4.maxLength || 4);
    
    // Form submission
    formMetodoPago.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate segments
        if (!metodo.value) {
            mostrarAlerta('Por favor selecciona un método de pago', 'error');
            return;
        }
        
        if (!seg2.value || !seg3.value || !seg4.value) {
            mostrarAlerta('Por favor completa el número de tarjeta', 'error');
            return;
        }
        
        // Build full card number
        const numeroCompleto = seg1.value + seg2.value + seg3.value + seg4.value;
        
        if (numeroCompleto.length !== 16) {
            mostrarAlerta('El número de tarjeta debe tener 16 dígitos', 'error');
            return;
        }
        
        // Send to backend
        agregarMetodoPago({
            metodo_pago: metodo.value,
            numero_tarjeta: numeroCompleto
        });
    });
    
    // Load payment methods from backend
    function cargarMetodosPago() {
        fetch('../backend/metodos_pago_listar.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    mostrarMetodosPago(data.metodos);
                } else {
                    mostrarAlerta(data.message || 'Error al cargar métodos de pago', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mostrarAlerta('Error de conexión al cargar métodos de pago', 'error');
            });
    }
    
    // Display payment methods
    function mostrarMetodosPago(metodos) {
        if (metodos.length === 0) {
            metodosList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">💳</div>
                    <p>No tienes métodos de pago guardados</p>
                    <p style="color: #999; font-size: 0.9em;">Agrega uno para realizar reservas más rápidamente</p>
                </div>
            `;
            btnMostrarForm.style.display = 'block';
            return;
        }
        
        metodosList.innerHTML = '';
        
        metodos.forEach(metodo => {
            const metodoCard = document.createElement('div');
            metodoCard.className = 'metodo-card';
            if (metodo.es_predeterminado == 1) {
                metodoCard.classList.add('predeterminado');
            }
            
            // Format card number (show only last 4 digits)
            const numeroFormateado = '•••• •••• •••• ' + metodo.numero_tarjeta.slice(-4);
            
            metodoCard.innerHTML = `
                <div class="metodo-info">
                    <div class="metodo-tipo">${metodosLabels[metodo.metodo_pago] || metodo.metodo_pago}</div>
                    <div class="metodo-numero">${numeroFormateado}</div>
                    ${metodo.es_predeterminado == 1 ? '<span class="metodo-badge">Predeterminado</span>' : ''}
                </div>
                <div class="metodo-actions">
                    ${metodo.es_predeterminado != 1 ? `<button class="btn-icon default" title="Hacer predeterminado" onclick="hacerPredeterminado(${metodo.id})">⭐</button>` : ''}
                    <button class="btn-icon delete" title="Eliminar" onclick="eliminarMetodo(${metodo.id})">🗑️</button>
                </div>
            `;
            
            metodosList.appendChild(metodoCard);
        });
        
        // Show or hide "Add" button based on count
        if (metodos.length >= 3) {
            btnMostrarForm.style.display = 'none';
            addMetodoForm.style.display = 'none';
            mostrarAlerta('Has alcanzado el límite máximo de 3 métodos de pago', 'info');
        } else {
            btnMostrarForm.style.display = 'block';
        }
    }
    
    // Add new payment method
    function agregarMetodoPago(data) {
        fetch('../backend/metodos_pago_agregar.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarAlerta(data.message, 'success');
                limpiarFormulario();
                addMetodoForm.style.display = 'none';
                addMetodoForm.classList.remove('active');
                cargarMetodosPago();
            } else {
                mostrarAlerta(data.message || 'Error al agregar método de pago', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarAlerta('Error de conexión al agregar método de pago', 'error');
        });
    }
    
    // Delete payment method (global function)
    window.eliminarMetodo = function(id) {
        if (!confirm('¿Estás seguro de eliminar este método de pago?')) {
            return;
        }
        
        fetch('../backend/metodos_pago_eliminar.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarAlerta(data.message, 'success');
                cargarMetodosPago();
            } else {
                mostrarAlerta(data.message || 'Error al eliminar método de pago', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarAlerta('Error de conexión al eliminar método de pago', 'error');
        });
    };
    
    // Set default payment method (global function)
    window.hacerPredeterminado = function(id) {
        fetch('../backend/metodos_pago_predeterminado.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarAlerta(data.message, 'success');
                cargarMetodosPago();
            } else {
                mostrarAlerta(data.message || 'Error al actualizar método predeterminado', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            mostrarAlerta('Error de conexión al actualizar método predeterminado', 'error');
        });
    };
    
    // Show alert message
    function mostrarAlerta(mensaje, tipo) {
        const alertClass = `alert-${tipo}`;
        alertContainer.innerHTML = `
            <div class="alert ${alertClass}">
                ${mensaje}
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
        
        // Scroll to top to show alert
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Clear form
    function limpiarFormulario() {
        formMetodoPago.reset();
        seg1.value = '';
        seg2.value = '';
        seg3.value = '';
        seg4.value = '';
        metodo.focus();
    }
});

