document.addEventListener("DOMContentLoaded", () => {
  const minEl = document.getElementById('filtro-precio-min');
  const maxEl = document.getElementById('filtro-precio-max');
  const zonaEl = document.getElementById('buscar-zona');
  const minLabel = document.getElementById('precio-min-label');
  const maxLabel = document.getElementById('precio-max-label');
  
  // Mostrar/Ocultar el dropdown de servicios
  const btnServicios = document.getElementById('dropdown-btn-servicios');
  const listServicios = document.getElementById('dropdown-servicios-list');
  const chipsContainer = document.getElementById('servicios-chips');
  const serviciosCount = document.getElementById('servicios-count');
  const clearBtn = document.getElementById('servicios-clear'); // Boton "Borrar todo"

  if (btnServicios && listServicios) {
    btnServicios.addEventListener('click', function(e) {
      e.stopPropagation();
      listServicios.style.display = listServicios.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', function(e) {
      if (!btnServicios.contains(e.target) && !listServicios.contains(e.target)) {
        listServicios.style.display = 'none';
      }
    });

    // Listado para los checkboxes
    listServicios.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', function() {
        // Actualiza chips
        const selected = Array.from(listServicios.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        chipsContainer.innerHTML = '';
        selected.forEach(servicio => {
          chipsContainer.innerHTML += `<span style="background:#e0b84c;color:#fff;padding:4px 12px;border-radius:16px;font-size:14px;">${servicio}</span>`;
        });
        // Actualiza contador
        serviciosCount.textContent = selected.length ? `(${selected.length})` : '';
        // Filtra resultados
        filtrar();
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function() {
        listServicios.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        chipsContainer.innerHTML = '';
        serviciosCount.textContent = '';
        filtrar();
      });
    }
  }

  const formatMoney = (num) => (Number(num) || 0).toLocaleString('es-AR');

  const updateLabels = () => {
    if (minLabel && minEl) {
      minLabel.textContent = `$ ${formatMoney(minEl.value)}`;
    }
    if (maxLabel && maxEl) {
      const maxVal = Number(maxEl.value);
      const cap = Number(maxEl.max || maxVal);
      maxLabel.textContent = maxVal >= cap ? `$ ${formatMoney(maxVal)}+` : `$ ${formatMoney(maxVal)}`;
    }
  };

  const fillEl = document.getElementById('precio-fill');
  const updateFill = () => {
    if (!fillEl || !minEl || !maxEl) return;
    const minBound = Number(minEl.min);
    const maxBound = Number(minEl.max);
    const a = Number(minEl.value);
    const b = Number(maxEl.value);
    const total = maxBound - minBound || 1;
    const left = ((Math.min(a, b) - minBound) / total) * 100;
    let right = ((Math.max(a, b) - minBound) / total) * 100;
    fillEl.style.left = left + '%';
    fillEl.style.right = (100 - right) + '%';
  };

  let debounceId;
  const triggerFilter = () => {
    updateLabels();
    updateFill();
    clearTimeout(debounceId);
    debounceId = setTimeout(() => filtrar(), 250);
  };

  async function loadBoundsAndInit() {
    try {
      const zona = (zonaEl?.value || '').trim();
      const url = zona
        ? `backend/precio_bounds.php?zona=${encodeURIComponent(zona)}`
        : `backend/precio_bounds.php`;
      const res = await fetch(url);
      const data = await res.json();
      const rawMin = Number(data.min) || 0;
      const rawMax = Number(data.max) || 0;
      let minBound = Math.max(0, Math.floor(rawMin / 100) * 100); // floor to hundreds
      let maxBound = Math.ceil(rawMax / 100) * 100; // ceil to hundreds
      maxBound = Math.max(minBound, maxBound);

      if (minEl && maxEl) {
        // Set range attributes based on DB bounds
        minEl.min = String(minBound);
        minEl.max = String(maxBound);
        minEl.step = '1';
        maxEl.min = String(minBound);
        maxEl.max = String(maxBound);
        maxEl.step = '1';

        // Initialize values to full range
        minEl.value = String(minBound);
        maxEl.value = String(maxBound);
      }

      updateLabels();
      updateFill();
      filtrar();
    } catch (e) {
      // Fallback: just filter with current values
      updateLabels();
      updateFill();
      filtrar();
    }
  }

  if (minEl && maxEl) {
    // Keep coherent range
    minEl.addEventListener('input', () => {
      if (Number(minEl.value) > Number(maxEl.value)) {
        maxEl.value = minEl.value;
      }
      triggerFilter();
    });
    maxEl.addEventListener('input', () => {
      if (Number(maxEl.value) < Number(minEl.value)) {
        minEl.value = maxEl.value;
      }
      triggerFilter();
    });
  }

  if (zonaEl) {
    zonaEl.addEventListener('input', () => {
      clearTimeout(debounceId);
      debounceId = setTimeout(() => loadBoundsAndInit(), 350);
    });
  }

  // Initial load based on DB bounds
  loadBoundsAndInit();
});

function cargarAlojamientos() {
  fetch("backend/alojamientos.php")
    .then(r => r.json())
    .then(data => mostrarAlojamientos(data))
    .catch(err => console.error("Error:", err));
}

function filtrar() {
  const min = parseInt(document.getElementById('filtro-precio-min').value, 10);
  const max = parseInt(document.getElementById('filtro-precio-max').value, 10);
  const zona = document.getElementById('buscar-zona').value.trim();

  // Obtiene los servicios seleccionados del dropdown
  const selected = Array.from(document.querySelectorAll('#dropdown-servicios-list input[type="checkbox"]:checked')).map(cb => cb.value);
  let servicios = selected.join(',');

  // Validación básica
  
  if (min < 0 || max < 0 || min > max) {
    // Si el rango quedó inválido por cualquier razón, no alertar, solo no enviar
    return;
  }

  let url;

  // Si hay zona y servicios, envía ambos parámetros
  if (servicios && zona) {
    url = `backend/filtrar_servicios.php?min=${min}&max=${max}&servicios=${encodeURIComponent(servicios)}&zona=${encodeURIComponent(zona)}`;
  } else if (servicios) {
    url = `backend/filtrar_servicios.php?min=${min}&max=${max}&servicios=${encodeURIComponent(servicios)}`;
  } else if (zona) {
    url = `backend/filtrar_zona.php?min=${min}&max=${max}&zona=${encodeURIComponent(zona)}`;
  } else {
    url = `backend/filtrar_precio.php?min=${min}&max=${max}`;
  }

  // Realiza la petición al backend
  fetch(url)
    .then(res => res.json())
    .then(data => mostrarAlojamientos(data))
    .catch(err => console.error("Error:", err));
}

function mostrarAlojamientos(data) {
  const cont = document.getElementById("listado");
  cont.innerHTML = "";

  data.forEach(a => {
    const nombreUrl = encodeURIComponent((a.nombre || "").replace(/\s+/g, "_"));
    const precioFmt = (a.precio_noche ?? 0).toLocaleString("es-AR");

    cont.innerHTML += `
      <article class="card">
        <a class="card-media" href="alojamientos/alojamiento.html?id=${a.id}">
          <img src="${a.imagen_principal}" alt="${a.nombre}">
        </a>
        <div class="card-content">
          <h2 class="card-title">${a.nombre ?? ""}</h2>
          <p class="card-sub">${a.direccion || a.ubicacion || ""}</p>
          <div class="card-footer">
            <span class="price">$ ${precioFmt} <small>por noche</small></span>
            <a class="btn btn-primary" href="reservas/reserva.html?alojamiento=${a.id}&precio=${a.precio_noche}&nombre=${nombreUrl}">Reservar</a>
          </div>
        </div>
      </article>
    `;
  });
}