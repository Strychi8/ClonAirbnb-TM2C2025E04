(function () {
  const fechaInicio = document.getElementById("fechaInicio");
  const fechaFin = document.getElementById("fechaFin");

  if (!fechaInicio || !fechaFin) return;

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
  }

  fechaInicio.addEventListener("change", syncEndDate);
  fechaInicio.addEventListener("input", syncEndDate);

  syncEndDate();
})();
