window.addEventListener('DOMContentLoaded', function () {
	const metodo = document.getElementById('metodo');
	const metodoGuardado = document.getElementById('metodo-guardado');
	const pagoManualSection = document.getElementById('pago-manual-section');
	const seg1 = document.getElementById('seg1');
	const seg2 = document.getElementById('seg2');
	const seg3 = document.getElementById('seg3');
	const seg4 = document.getElementById('seg4');

	const bins = {
	  "visa-credito":   "411111",
	  "visa-debito":    "450799",
	  "master-credito": "510510",
	  "master-debito":  "530530",
	  "mercadopago":    "589562"
	};

	const metodosLabels = {
		"visa-credito": "Visa Crédito",
		"visa-debito": "Visa Débito",
		"master-credito": "Mastercard Crédito",
		"master-debito": "Mastercard Débito",
		"mercadopago": "Mercado Pago"
	};

	if (!metodo || !seg1) return;

	let savedMethods = []; // Store saved methods globally

	// Load saved payment methods
	fetch('../backend/metodos_pago_listar.php')
		.then(response => response.json())
		.then(data => {
			if (data.success && data.metodos && data.metodos.length > 0) {
				savedMethods = data.metodos;
				populateSavedMethods(data.metodos);
			} else {
				// No saved methods - only show "new payment method" option
				metodoGuardado.innerHTML = '<option value="nuevo" selected>➕ Nuevo método de pago</option>';
				// Show manual input since there are no saved methods
				pagoManualSection.style.display = 'block';
				enableManualInput();
			}
		})
		.catch(error => {
			console.error('Error loading saved methods:', error);
			metodoGuardado.innerHTML = '<option value="nuevo" selected>➕ Nuevo método de pago</option>';
			// Show manual input on error
			pagoManualSection.style.display = 'block';
			enableManualInput();
		});

	// Populate dropdown with saved methods
	function populateSavedMethods(metodos) {
		metodoGuardado.innerHTML = '';
		
		// Add saved methods
		metodos.forEach((metodoData, index) => {
			const option = document.createElement('option');
			option.value = index; // Use index to reference the method
			const label = metodosLabels[metodoData.metodo_pago] || metodoData.metodo_pago;
			const lastFour = metodoData.numero_tarjeta.slice(-4);
			option.textContent = `${label} - •••• ${lastFour}`;
			if (metodoData.es_predeterminado == 1) {
				option.textContent += ' (Predeterminado)';
				// Pre-select default method
				option.selected = true;
			}
			metodoGuardado.appendChild(option);
		});

		// Add "New payment method" option at the end
		const newOption = document.createElement('option');
		newOption.value = 'nuevo';
		newOption.textContent = '➕ Nuevo método de pago';
		metodoGuardado.appendChild(newOption);

		// Trigger change event to auto-fill if default is selected
		if (metodoGuardado.value && metodoGuardado.value !== 'nuevo') {
			metodoGuardado.dispatchEvent(new Event('change'));
		}
	}

	// Handle saved method selection
	metodoGuardado.addEventListener('change', function() {
		const selectedIndex = this.value;
		
		if (selectedIndex === 'nuevo') {
			// New payment method selected, show and enable manual input
			pagoManualSection.style.display = 'block';
			enableManualInput();
			clearCardFields();
		} else if (selectedIndex === '') {
			// No saved method selected
			pagoManualSection.style.display = 'block';
			enableManualInput();
			clearCardFields();
		} else {
			// Saved method selected, auto-fill and hide manual input
			const selectedMethod = savedMethods[selectedIndex];
			fillCardFromSaved(selectedMethod);
			pagoManualSection.style.display = 'none';
			disableManualInput();
		}
	});

	// Fill card fields from saved method
	function fillCardFromSaved(methodData) {
		// Set payment method
		metodo.value = methodData.metodo_pago;
		
		// Fill card number segments
		const cardNumber = methodData.numero_tarjeta;
		seg1.value = cardNumber.substring(0, 6);
		seg2.value = cardNumber.substring(6, 8);
		seg3.value = cardNumber.substring(8, 12);
		seg4.value = cardNumber.substring(12, 16);
	}

	// Enable manual input
	function enableManualInput() {
		metodo.disabled = false;
		metodo.required = true;
		seg2.disabled = false;
		seg2.required = true;
		seg3.disabled = false;
		seg3.required = true;
		seg4.disabled = false;
		seg4.required = true;
		pagoManualSection.style.opacity = '1';
	}

	// Disable manual input when using saved method
	function disableManualInput() {
		metodo.disabled = true;
		metodo.required = false;
		seg2.disabled = true;
		seg2.required = false;
		seg3.disabled = true;
		seg3.required = false;
		seg4.disabled = true;
		seg4.required = false;
		pagoManualSection.style.opacity = '0.6';
	}

	// Clear all card fields
	function clearCardFields() {
		metodo.value = '';
		seg1.value = '';
		seg2.value = '';
		seg3.value = '';
		seg4.value = '';
	}

	// Autocompletar BIN según método de pago (for manual entry)
	metodo.addEventListener('change', function () {
	  const value = metodo.value;
	  seg1.value = bins[value] || "";
	  // Clear other segments when method changes
	  seg2.value = '';
	  seg3.value = '';
	  seg4.value = '';
	  if (value) {
		seg2.focus();
	  }
	});

	// Si el select ya tiene valor al cargar la página
	if (metodo.value && !metodo.disabled) {
	  seg1.value = bins[metodo.value] || "";
	}

	// --- Auto avanzar al siguiente campo ---
	function autoTab(current, next, maxLength) {
		current.addEventListener('input', function () {
		  this.value = this.value.replace(/\D/g, ''); // 🔒 Solo números
		  if (this.value.length >= maxLength && next) {
			next.focus();
		  }
		});
	}

	autoTab(seg2, seg3, seg2.maxLength || 2);
	autoTab(seg3, seg4, seg3.maxLength || 4);
	
	// Concatenar todo en el hidden antes de enviar
	document.querySelector("form").addEventListener("submit", function () {
		const numeroCompleto = seg1.value + seg2.value + seg3.value + seg4.value;
		document.getElementById("numeroTarjeta").value = numeroCompleto;
		
		// If using saved method, ensure metodo_pago has correct value
		if (metodoGuardado.value !== '' && metodoGuardado.value !== 'nuevo' && savedMethods[metodoGuardado.value]) {
			// Override with saved method data
			const savedMethod = savedMethods[metodoGuardado.value];
			// Create a hidden input for metodo_pago since the select is disabled
			const hiddenMetodo = document.createElement('input');
			hiddenMetodo.type = 'hidden';
			hiddenMetodo.name = 'metodo_pago';
			hiddenMetodo.value = savedMethod.metodo_pago;
			this.appendChild(hiddenMetodo);
		}
	});

	
});