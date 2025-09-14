document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    // Collect simple fields
    const data = {
      nombre: formData.get('nombre') || '',
      precio: formData.get('precio') || '',
      descripcion: formData.get('descripcion') || '',
      calle: formData.get('calle') || '',
      altura: formData.get('altura') || '',
      localidad: formData.get('localidad') || '',
      codigoPostal: formData.get('codigoPostal') || '',
      provincia: formData.get('provincia') || '',
      pais: formData.get('pais') || '',
      servicios: [],
    };

    // Collect servicios checkboxes (multiple)
    const serviciosSeleccionados = [];
    form.querySelectorAll('input[name="servicios"]:checked').forEach((el) => {
      serviciosSeleccionados.push(el.value);
    });
    data.servicios = serviciosSeleccionados;

    // Log all current values
    console.group('Publicar alojamiento - datos del formulario');
    console.table({ ...data, servicios: data.servicios.join(', ') });
    console.log('Objeto completo:', data);
    console.groupEnd();

    // Enviar al backend
    fetch('../backend/publicar_alojamiento.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(async (res) => {
        const text = await res.text();
        let payload;
        try { payload = JSON.parse(text); } catch (_) { payload = { raw: text }; }
        console.group('Respuesta del servidor (publicar_alojamiento)');
        console.log('status:', res.status);
        console.log('payload:', payload);
        console.groupEnd();
        if (res.ok && payload && payload.ok) {
          alert('Alojamiento publicado (ID ' + payload.id + ').');
          // form.reset(); // opcional
        } else {
          alert('No se pudo publicar. Ver consola.');
        }
      })
      .catch((err) => {
        console.error('Error de red:', err);
        alert('Error de red al publicar.');
      });
  });
});


