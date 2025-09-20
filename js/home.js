document.addEventListener("DOMContentLoaded", () => {
  const minEl = document.getElementById('filtro-precio-min');
  const maxEl = document.getElementById('filtro-precio-max');
  const zonaEl = document.getElementById('filtrar');
  const minLabel = document.getElementById('precio-min-label');
  const maxLabel = document.getElementById('precio-max-label');

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
  const zona = document.getElementById('filtrar').value.trim();

  // Validación básica
  
  if (min < 0 || max < 0 || min > max) {
    // Si el rango quedó inválido por cualquier razón, no alertar, solo no enviar
    return;
  }

  let url;

  // Decide qué archivo PHP usar según los filtros
  if (zona) {
    // Si hay una zona especificada, usa filtrar_zona.php
    url = `backend/filtrar_zona.php?min=${min}&max=${max}&zona=${encodeURIComponent(zona)}`;
  } else {
    // Si no hay zona, usa filtrar_precio.php
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