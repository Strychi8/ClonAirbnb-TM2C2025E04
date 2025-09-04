window.addEventListener('DOMContentLoaded', function () {
	const metodo = document.getElementById('metodo');
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

	if (!metodo || !seg1) return;

	// Autocompletar BIN según método de pago
	metodo.addEventListener('change', function () {
	  const value = metodo.value;
	  seg1.value = bins[value] || "";
	});

	// Si el select ya tiene valor al cargar la página
	if (metodo.value) {
	  seg1.value = bins[metodo.value] || "";
	}

	// --- Auto avanzar al siguiente campo ---
	function autoTab(current, next, maxLength) {
		current.addEventListener('input', function () {
		  this.value = this.value.replace(/\D/g, ''); // 🔒 Solo números
		  if (this.value.length >= maxLength) {
			next.focus();
		  }
		});
	}

	autoTab(seg2, seg3, seg2.maxLength || 2);
	autoTab(seg3, seg4, seg3.maxLength || 4);
	
	// Concatenar todo en el hidden antes de enviar
	document.querySelector("form").addEventListener("submit", function () {
		document.getElementById("numeroTarjeta").value =
		seg1.value + seg2.value + seg3.value + seg4.value;
	});

	
});