(function () {
  const fechaInicio = document.getElementById("fechaInicio");
  const fechaFin = document.getElementById("fechaFin");
  const precioNocheField = document.getElementById("precioNoche");
  const precioTotalField = document.getElementById("precioTotal");
  const cantidadPersonasField = document.querySelector("input[name='cantidadPersonas']");
  const telefono = document.getElementById("telefono");

  if (!fechaInicio || !fechaFin) return;

  const params = new URLSearchParams(window.location.search);
  const precioPorNoche = parseInt(params.get("precio")) || 0;
  const nombreAlojamiento = params.get("nombre");

  // --- Mostrar alojamiento elegido ---
  if (nombreAlojamiento) {
    const h2 = document.querySelector("form h2");
    if (h2) {
      h2.textContent = `Formulario de Reserva: ${nombreAlojamiento.replace(/_/g, " ")}`;
    }
  }

  // --- Mostrar precio por noche ---
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
    const cantidadPersonas = cantidadPersonasField ? parseInt(cantidadPersonasField.value) : 1;

    if (inicio && fin) {
      const fechaInicioObj = new Date(inicio);
      const fechaFinObj = new Date(fin);

      const diffTime = fechaFinObj - fechaInicioObj;

      if (diffTime >= 0) {
        const diffDias = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 día
        const total = diffDias * precioPorNoche * cantidadPersonas;
        precioTotalField.value =
          "$ " + total.toLocaleString("es-AR") + ` (${diffDias} noches)`;
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

  if (cantidadPersonasField) {
    cantidadPersonasField.addEventListener("input", calcularPrecio);
  }

  // Inicializar
  syncEndDate();

  // --- Validación y formateo del teléfono ---
  if (telefono) {
    telefono.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });

    
  }

})();
