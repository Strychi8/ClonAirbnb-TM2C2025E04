document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(location.search);
  const id = params.get('id');

  const form = document.getElementById('alojamiento-form');
  const title = document.getElementById('form-title');
  const submitBtn = document.getElementById('submit-btn');
  const imagenInput = document.getElementById('imagen');
  const imagenPreview = document.getElementById('imagenPreview');

  const activoContainer = document.getElementById('activo-container'); // div que contiene el checkbox
  const activoCheckbox = document.getElementById('activo'); // el checkbox real

  if (!form) return;

  // Obtener datos de sesión
  const userData = await window.SessionUtils.requireAuth();
  if (!userData) return;

  console.log('User authenticated:', userData);

  // Helpers
  function setServicios(servicesArray) {
    const set = new Set(Array.isArray(servicesArray) ? servicesArray : []);
    form.querySelectorAll('input[name="servicios[]"]').forEach(cb => {
      cb.checked = set.has(cb.value);
    });
  }

  function parseDireccionToFields(direccion) {
    return { calle: '', altura: '', localidad: '', codigoPostal: '', provincia: '', pais: '' };
  }

  // Modo edición
  if (id) {
    title.textContent = 'Editar alojamiento';
    submitBtn.textContent = 'Actualizar';
    if (activoContainer) activoContainer.style.display = 'block';

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
        // Dirección
        form.calle.value = aloja.calle || '';
        form.altura.value = aloja.altura || '';
        form.localidad.value = aloja.localidad || '';
        form.codigoPostal.value = aloja.codigo_postal || '';
        form.provincia.value = aloja.provincia || '';
        form.pais.value = aloja.pais || '';
        if ((!form.calle.value || !form.localidad.value) && aloja.direccion) {
          const f = parseDireccionToFields(aloja.direccion);
          form.calle.value ||= f.calle;
          form.altura.value ||= f.altura;
          form.localidad.value ||= f.localidad;
          form.codigoPostal.value ||= f.codigoPostal;
          form.provincia.value ||= f.provincia;
          form.pais.value ||= f.pais;
        }

        // Tipo de alojamiento
        if (aloja.tipo_alojamiento) form.tipo_alojamiento.value = aloja.tipo_alojamiento;

        // Checkbox activo
        if (typeof aloja.activo !== 'undefined') {
          activoCheckbox.checked = !!Number(aloja.activo);
        }

        // Preview de imagen
        if (aloja.imagen_principal) {
          imagenPreview.src = `../${aloja.imagen_principal}`;
          imagenPreview.style.display = 'block';
        }
      }
    } catch (e) {
      console.error('No se pudo cargar el alojamiento', e);
    }

  } else {
    // Modo creación
    title.textContent = 'Publicar un alojamiento';
    submitBtn.textContent = 'Publicar';
    if (activoContainer) activoContainer.style.display = 'none';
    activoCheckbox.checked = true; // por defecto activo
  }

  // Preview de imagen
  if (imagenInput && imagenPreview) {
    imagenInput.addEventListener('change', () => {
      const file = imagenInput.files && imagenInput.files[0];
      if (!file) {
        imagenPreview.style.display = 'none';
        imagenPreview.removeAttribute('src');
        return;
      }
      imagenPreview.src = URL.createObjectURL(file);
      imagenPreview.style.display = 'block';
    });
  }

  // Envío de formulario
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    fd.append('usuario_id', userData.user_id);

    if (id) {
      fd.append('id', id);
    }

    // Enviar valor de activo
    fd.append('activo', activoCheckbox.checked ? '1' : '0');

    console.log('Enviando alojamiento con usuario_id:', userData.user_id);

    const endpoint = id ? '../backend/actualizar_alojamiento.php' : '../backend/publicar_alojamiento.php';

    try {
      const res = await fetch(endpoint, { method: 'POST', body: fd });
      const text = await res.text();
      let payload;
      try { payload = JSON.parse(text); } catch { payload = { raw: text }; }
      console.log('Respuesta form alojamiento:', res.status, payload);
      if (res.ok) {
        alert(id ? 'Alojamiento actualizado exitosamente' : 'Alojamiento publicado exitosamente');
        window.location.href = 'mis_alojamientos.html';
      } else {
        alert('No se pudo guardar el alojamiento. Revisa la consola para más detalles.');
      }
    } catch (err) {
      console.error('Error al enviar formulario:', err);
      alert('Error de conexión. Intenta nuevamente.');
    }
  });
});
