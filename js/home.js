document.addEventListener("DOMContentLoaded", () => {
  cargarAlojamientos();

  document.getElementById('btn-filtrar-precio').addEventListener('click', filtrarPorPrecio);
});

function cargarAlojamientos() {
  fetch("backend/alojamientos.php")
    .then(r => r.json())
    .then(data => mostrarAlojamientos(data))
    .catch(err => console.error("Error:", err));
}

function filtrarPorPrecio() {

  const min = parseInt(document.getElementById('filtro-precio-min').value, 10);

  const max = parseInt(document.getElementById('filtro-precio-max').value, 10);
  
  //console.log('Filtrando por precio:', min, max);
  
  if (min < 0 || max < 0 || min > max) {

    // Opcional: mostrar mensaje de error al usuario
    return;
  }


  fetch(`backend/filtrar_precio.php?min=${min}&max=${max}`)
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