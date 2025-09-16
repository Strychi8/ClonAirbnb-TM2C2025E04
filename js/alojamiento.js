document.addEventListener("DOMContentLoaded", () => {
  // Leer parámetros de la URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.body.innerHTML = "<p style='color:red'>⚠ No se especificó un ID de alojamiento.</p>";
    return;
  }

  // Pedir los datos al backend
  fetch(`../backend/alojamiento_get.php?id=${encodeURIComponent(id)}`)
    .then(res => {
      if (!res.ok) {
        throw new Error("Error en la respuesta del servidor");
      }
      return res.json();
    })
    .then(data => {
      if (data.error) {
        document.body.innerHTML = `<p style="color:red">⚠ Error: ${data.error}</p>`;
        return;
      }

      // Cargar datos en el HTML
      document.getElementById("nombre").textContent = data.nombre || "Nombre no disponible";
      document.getElementById("descripcion").textContent = data.descripcion || "Descripción no disponible";
      document.getElementById("precio").textContent = data.precio_noche ? `$${data.precio_noche} por noche` : "Precio no disponible";
      document.getElementById("direccion").textContent = 
        data.calle && data.altura && data.localidad && data.provincia && data.pais
          ? `${data.calle} ${data.altura}, ${data.localidad}, ${data.provincia}, ${data.pais}`
          : "Dirección no disponible";

      // Imagen con fallback
      const img = document.getElementById("imagen");
      img.src = data.imagen_principal ? "../" + data.imagen_principal : "../uploads/default.jpg";
      img.alt = data.nombre ? `Imagen de ${data.nombre}` : "Imagen no disponible";
      img.onerror = () => { img.src = "../uploads/default.jpg"; }; // fallback si no carga

      // Servicios como lista
      const serviciosContainer = document.getElementById("servicios");

	if (data.servicios) {
	  let servicios = [];
	  try {
		servicios = JSON.parse(data.servicios); // convertir de JSON a array
	  } catch (e) {
		// fallback: si no es JSON, asumimos que es string separado por comas
		servicios = data.servicios.split(',');
	  }

	  serviciosContainer.innerHTML = '';
	  servicios.forEach(servicio => {
		const li = document.createElement('li');
		li.textContent = servicio.trim();
		serviciosContainer.appendChild(li);
	  });
	} else {
	  serviciosContainer.innerHTML = '<li>No hay servicios disponibles.</li>';
	}
    })
    .catch(err => {
      console.error(err);
      document.body.innerHTML = `<p style="color:red">⚠ Error cargando el alojamiento.</p>`;
    });
});
