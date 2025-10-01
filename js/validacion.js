(function () {
  const fechaInicioInput = document.getElementById("fechaInicio");
  const fechaFinInput = document.getElementById("fechaFin");
  const precioNocheField = document.getElementById("precioNoche");
  const precioTotalField = document.getElementById("precioTotal");
  const cantidadPersonasField = document.querySelector("input[name='cantidadPersonas']");
  const telefono = document.getElementById("telefono");

  const seg1 = document.getElementById("seg1");
  const seg2 = document.getElementById("seg2");
  const seg3 = document.getElementById("seg3");
  const seg4 = document.getElementById("seg4");
  const numeroTarjeta = document.getElementById("numeroTarjeta");

  const alojamientoIdField = document.getElementById("alojamiento_id");

  if (!fechaInicioInput || !fechaFinInput) return;

  const params = new URLSearchParams(window.location.search);
  const precioPorNoche = parseInt(params.get("precio")) || 0;
  const nombreAlojamiento = params.get("nombre");

  if (alojamientoIdField) {
    alojamientoIdField.value = parseInt(params.get("alojamiento") || "0", 10) || 0;
  }

  // Mostrar alojamiento elegido
  if (nombreAlojamiento) {
    const h2 = document.querySelector("form h2");
    if (h2) {
      h2.textContent = `Formulario de Reserva: ${nombreAlojamiento.replace(/_/g, " ")}`;
    }
  }

  // Mostrar precio por noche
  if (precioNocheField) {
    precioNocheField.value = precioPorNoche > 0
      ? "$ " + precioPorNoche.toLocaleString("es-AR")
      : "No disponible";
  }

  let fechasOcupadas = []; // Array de strings YYYY-MM-DD
  let fpInicio, fpFin;

  // Inicializar Flatpickr
  function initCalendars() {
    fpInicio = flatpickr(fechaInicioInput, {
      dateFormat: "Y-m-d",
      minDate: "today",
      disable: fechasOcupadas, // <-- ahora son strings, Flatpickr los bloquea correctamente
      onChange: function(selectedDates, dateStr) {
        actualizarFechaFinMin(selectedDates[0]);
        verificarDisponibilidad(dateStr);
        calcularPrecio();
      }
    });

    fpFin = flatpickr(fechaFinInput, {
      dateFormat: "Y-m-d",
      minDate: "today",
      disable: fechasOcupadas,
      onChange: calcularPrecio
    });
  }

  function actualizarFechaFinMin(fechaInicio) {
    if (!fechaInicio) return;
    fpFin.set("minDate", fechaInicio);
    if (fpFin.selectedDates[0] && fpFin.selectedDates[0] < fechaInicio) {
      fpFin.setDate(fechaInicio, true);
    }
  }

  // Calcular precio total
  function calcularPrecio() {
    if (!precioTotalField || precioPorNoche <= 0) return;

    const inicio = fechaInicioInput.value;
    const fin = fechaFinInput.value;
    const cantidadPersonas = cantidadPersonasField ? parseInt(cantidadPersonasField.value) : 1;

    const precioNocheNumField = document.getElementById("precio_noche_num");
    const precioTotalNumField = document.getElementById("precio_total_num");

    if (inicio && fin) {
      const diffDias = Math.floor((new Date(fin) - new Date(inicio)) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDias > 0) {
        const total = diffDias * precioPorNoche * cantidadPersonas;
        precioTotalField.value = `$ ${total.toLocaleString("es-AR")} (${diffDias} noches)`;
        if (precioNocheNumField) precioNocheNumField.value = precioPorNoche;
        if (precioTotalNumField) precioTotalNumField.value = total;
      } else {
        precioTotalField.value = "⚠️ Fechas inválidas";
        if (precioTotalNumField) precioTotalNumField.value = 0;
      }
    } else {
      precioTotalField.value = "";
      if (precioTotalNumField) precioTotalNumField.value = 0;
    }
  }

  // Traer fechas ocupadas del historial
  async function cargarFechasOcupadas() {
    const alojamientoId = alojamientoIdField.value;
    if (!alojamientoId) return;

    try {
      const response = await fetch(`../backend/fechas_ocupadas.php?alojamiento_id=${alojamientoId}`);
      const data = await response.json();
      fechasOcupadas = data; // <-- ya son strings YYYY-MM-DD

      initCalendars(); // inicializa Flatpickr **después** de tener las fechas
    } catch (err) {
      console.error("Error cargando fechas ocupadas:", err);
    }
  }

  // Verificar disponibilidad en tiempo real
  async function verificarDisponibilidad(fechaInicioStr) {
    const alojamientoId = alojamientoIdField.value;
    if (!alojamientoId || !fechaInicioStr) return;

    try {
      const response = await fetch(`../backend/verificar_disponibilidad.php?alojamiento_id=${alojamientoId}&fecha_inicio=${fechaInicioStr}`);
      const data = await response.json();

      if (data.error) {
        console.error("Error:", data.error);
        return;
      }

      if (data.disponible === false && data.motivo === "fecha_inicio_ocupada") {
        alert("La fecha de inicio seleccionada ya está reservada. Elegí otra.");
        fpInicio.clear();
        return;
      }

      if (data.max_fecha) {
        fpFin.set("maxDate", data.max_fecha);
        if (fpFin.selectedDates[0] && fpFin.selectedDates[0] > new Date(data.max_fecha)) {
          fpFin.setDate(data.max_fecha, true);
        }
      } else {
        fpFin.set("maxDate", null);
      }

      calcularPrecio();
    } catch (err) {
      console.error("Error verificando disponibilidad:", err);
    }
  }

  // Cantidad de personas
  if (cantidadPersonasField) cantidadPersonasField.addEventListener("input", calcularPrecio);

  // Teléfono
  if (telefono) {
    telefono.addEventListener("input", function () {
      this.value = this.value.replace(/[^0-9]/g, "");
    });
  }

  // Validación de tarjeta
  const form = document.querySelector("form");
  form.addEventListener("submit", function (e) {
    numeroTarjeta.value = seg1.value + seg2.value + seg3.value + seg4.value;

    if (!seg1.value || !seg2.value || !seg3.value || !seg4.value) {
      e.preventDefault();
      alert("Por favor completa todos los campos del número de tarjeta.");
      return false;
    }

    if (!/^\d+$/.test(numeroTarjeta.value)) {
      e.preventDefault();
      alert("El número de tarjeta debe contener solo números.");
      return false;
    }

    if (numeroTarjeta.value.length !== 16) {
      e.preventDefault();
      alert("El número de tarjeta debe tener 16 dígitos.");
      return false;
    }
  });

  // Inicializar
  cargarFechasOcupadas();

})();
