(function () {
  const fechaInicio = document.getElementById("fechaInicio");
  const fechaFin = document.getElementById("fechaFin");
  const precioNocheField = document.getElementById("precioNoche");
  const precioTotalField = document.getElementById("precioTotal");

  if (!fechaInicio || !fechaFin) return;

  // --- Obtener precio por noche desde la URL ---
  const params = new URLSearchParams(window.location.search);
  const precioPorNoche = parseInt(params.get("precio")) || 0;

  if (precioNocheField) {
    precioNocheField.value = precioPorNoche > 0
      ? "$ " + precioPorNoche.toLocaleString("es-AR")
      : "No disponible";
  }

  // --- Función para sincronizar fecha mínima ---
  function syncEndDate() {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 1); // Día siguiente
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const fechaSiguienteStr = `${yyyy}-${mm}-${dd}`;

    // Fecha mínima y valor por defecto para inicio
    fechaInicio.min = fechaSiguienteStr;
    if (!fechaInicio.value || fechaInicio.value < fechaSiguienteStr) {
      fechaInicio.value = fechaSiguienteStr;
    }

    // Sincronizar fecha fin
    fechaFin.min = fechaInicio.value;
    if (!fechaFin.value || fechaFin.value < fechaInicio.value) {
      fechaFin.value = fechaInicio.value;
    }

    // Recalcular precio total
    calcularPrecio();
  }

  // --- Función para calcular precio total ---
  function calcularPrecio() {
    if (!precioTotalField || precioPorNoche <= 0) return;

    const inicio = fechaInicio.value;
    const fin = fechaFin.value;

    if (inicio && fin) {
      const fechaInicioObj = new Date(inicio);
      const fechaFinObj = new Date(fin);

      const diffTime = fechaFinObj - fechaInicioObj;

      if (diffTime >= 0) {
        const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 día
        const total = diffDias * precioPorNoche;
        precioTotalField.value =
          "$ " + total.toLocaleString("es-AR") + " (" + diffDias + " noches)";
      } else {
        precioTotalField.value = "⚠️ Fechas inválidas";
      }
    } else {
      precioTotalField.value = "";
    }
  }

  // --- Eventos ---
  fechaInicio.addEventListener("change", syncEndDate);
  fechaInicio.addEventListener("input", syncEndDate);
  fechaFin.addEventListener("change", calcularPrecio);
  fechaFin.addEventListener("input", calcularPrecio);

  // Inicializar
  syncEndDate();
  
  // --- Validación y formateo del teléfono ---
  const telefono = document.getElementById("telefono");
  if (telefono) {
    // Bloquear letras mientras escribe
    telefono.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });

    // Formatear al salir del campo
    telefono.addEventListener("blur", function () {
      let val = this.value.replace(/\D/g, ""); // solo dígitos
      if (val.length === 11) { 
        // Formato: 011 1234 5678
        this.value = val.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3");
      }
    });
  }

})();