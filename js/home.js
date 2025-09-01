document.addEventListener("DOMContentLoaded", () => {
  fetch("backend/alojamientos.php")
    .then(r => r.json())
    .then(data => {
      const cont = document.getElementById("listado");
      cont.innerHTML = "";
      data.forEach(a => {
        const nombreUrl = encodeURIComponent((a.nombre || "").replace(/\s+/g, "_"));
        const precioFmt = (a.precio_noche ?? 0).toLocaleString("es-AR");
        cont.innerHTML += `
          <article class="card">
            <a class="card-media" href="alojamientos/alojamiento${a.id}.html">
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
    })
    .catch(err => console.error("Error:", err));
});