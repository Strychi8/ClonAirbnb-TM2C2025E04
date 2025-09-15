document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const form = document.getElementById('alojamiento-form');
  const title = document.getElementById('form-title');
  const submitBtn = document.getElementById('submit-btn');
  const imagenInput = document.getElementById('imagen');
  const imagenPreview = document.getElementById('imagenPreview');
  if (!form) return;

  // Get user session data - required for authentication
  const userData = await window.SessionUtils.requireAuth();
  if (!userData) {
    // requireAuth will handle redirect if not authenticated
    return;
  }
  
  console.log('User authenticated:', userData);

  // Helpers
  function setServicios(servicesArray) {
    const set = new Set(Array.isArray(servicesArray) ? servicesArray : []);
    form.querySelectorAll('input[name="servicios[]"]').forEach(cb => {
      cb.checked = set.has(cb.value);
    });
  }

  function parseDireccionToFields(direccion) {
    // Very light parsing; manual edits allowed later
    // Expected stored format: "calle altura, localidad codigo, provincia, pais"
    return { calle: '', altura: '', localidad: '', codigoPostal: '', provincia: '', pais: '' };
  }

  // Edit mode: fetch and prefill
  if (id) {
    title.textContent = 'Editar alojamiento';
    submitBtn.textContent = 'Actualizar';

    try {
      const res = await fetch(`../backend/alojamiento_get.php?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      const aloja = Array.isArray(data) ? data.find(r => String(r.id) === String(id)) : data;
      if (aloja) {
        form.nombre.value = aloja.nombre || '';
        form.precio.value = aloja.precio_noche || '';
        form.descripcion.value = aloja.descripcion || '';
        if (aloja.servicios) {
          try { setServicios(JSON.parse(aloja.servicios)); } catch { setServicios([]); }
        }
        // Dirección normalizada
        form.calle.value = aloja.calle || '';
        form.altura.value = aloja.altura || '';
        form.localidad.value = aloja.localidad || '';
        form.codigoPostal.value = aloja.codigo_postal || '';
        form.provincia.value = aloja.provincia || '';
        form.pais.value = aloja.pais || '';
        // Fallback desde "direccion" si faltan campos
        if ((!form.calle.value || !form.localidad.value) && aloja.direccion) {
          const f = parseDireccionToFields(aloja.direccion);
          form.calle.value ||= f.calle || '';
          form.altura.value ||= f.altura || '';
          form.localidad.value ||= f.localidad || '';
          form.codigoPostal.value ||= f.codigoPostal || '';
          form.provincia.value ||= f.provincia || '';
          form.pais.value ||= f.pais || '';
        }

        // Preview de imagen existente
        if (aloja.imagen_principal) {
          imagenPreview.src = `../${aloja.imagen_principal}`;
          imagenPreview.style.display = 'block';
        }
      }
    } catch (e) {
      console.error('No se pudo cargar el alojamiento', e);
    }
  } else {
    title.textContent = 'Publicar un alojamiento';
    submitBtn.textContent = 'Publicar';
  }

  // Preview en selección de archivo
  if (imagenInput && imagenPreview) {
    imagenInput.addEventListener('change', () => {
      const file = imagenInput.files && imagenInput.files[0];
      if (!file) {
        imagenPreview.style.display = 'none';
        imagenPreview.removeAttribute('src');
        return;
      }
      const url = URL.createObjectURL(file);
      imagenPreview.src = url;
      imagenPreview.style.display = 'block';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    
    // Add user ID to form data
    fd.append('usuario_id', userData.user_id);
    
    if (id) {
      fd.append('id', id);
    }

    console.log('Enviando alojamiento con usuario_id:', userData.user_id);

    const endpoint = id ? '../backend/actualizar_alojamiento.php' : '../backend/publicar_alojamiento.php';

    try {
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const text = await res.text();
      let payload; try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
      console.log('Respuesta form alojamiento:', res.status, payload);
      if (res.ok) {
        const message = id ? 'Alojamiento actualizado exitosamente' : 'Alojamiento publicado exitosamente';
        alert(message);
        // Optionally redirect to "mis alojamientos" page
        // window.location.href = 'mis_alojamientos.html';
      } else {
        alert('No se pudo guardar el alojamiento. Ver consola para más detalles.');
      }
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      alert('Error de conexión. Intenta nuevamente.');
    }
  });
});


