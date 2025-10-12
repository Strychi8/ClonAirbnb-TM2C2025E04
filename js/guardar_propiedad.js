document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btn-guardar');
  const icon = document.getElementById('icon-guardar');
  if (!btn || !icon) return;

  // Helper para obtener id de la URL
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) {
    console.warn('guardar_propiedad: no se encontró id en la URL');
    return;
  }

  // Estado visual inicial: asumimos outline; si quieres, podemos agregar un endpoint que devuelva el estado real.
  let saved = false;

  // Intentar obtener el estado real desde el backend (si el usuario está autenticado)
  (async function initSavedState() {
    try {
      const resp = await fetch(`../backend/guardar_propiedad/esta_guardado.php?id=${encodeURIComponent(id)}`, {
        method: 'GET',
        credentials: 'same-origin'
      });

      if (!resp.ok) {
        // 401 puede indicar que no está autenticado: no es un error crítico
        if (resp.status === 401) return;
        console.warn('esta_guardado: respuesta no OK', resp.status);
        return;
      }

      const data = await resp.json().catch(() => null);
      if (data && data.success) {
        setIcon(!!data.saved);
      }
      // Verificar si el alojamiento pertenece al usuario actual y, si es así, desactivar el botón
      try {
        const resp2 = await fetch(`../backend/alojamiento_get_for_reserva.php?id=${encodeURIComponent(id)}`, {
          method: 'GET',
          credentials: 'same-origin'
        });
        if (resp2.ok) {
          const alojamientoData = await resp2.json().catch(() => null);
          if (alojamientoData && typeof alojamientoData.usuario_id !== 'undefined') {
            // Obtener sesión (si existe) para comparar
            if (typeof getSessionData === 'function') {
              const session = await getSessionData('../backend/');
              if (session && session.logged_in && session.user_id && Number(session.user_id) === Number(alojamientoData.usuario_id)) {
                // Es el propietario: desactivar el botón y mostrar un label
                btn.disabled = true;
                btn.setAttribute('aria-disabled', 'true');
                btn.classList.add('btn-disabled-own');
                const label = btn.querySelector('.guardar-label');
                if (label) label.textContent = 'Tu propiedad';
                // cambiar icon a estado bloqueado si se desea
                icon.src = '../icons/icono-guardar-disabled.png';
              }
            }
          }
        }
      } catch (e) {
        // no crítico: si falla esta comprobación, no bloqueamos la funcionalidad
        console.warn('No se pudo comprobar propietario del alojamiento', e);
      }
    } catch (e) {
      console.warn('No se pudo comprobar estado de guardado:', e);
    }
  })();

  const setIcon = (isSaved) => {
    saved = !!isSaved;
    if (saved) {
      icon.src = '../icons/icono-guardar.png';
      btn.setAttribute('aria-pressed', 'true');
    } else {
      icon.src = '../icons/icono-guardar-normal.png';
      btn.setAttribute('aria-pressed', 'false');
    }
    // actualizar label
    const label = btn.querySelector('.guardar-label');
    if (label) label.textContent = saved ? 'Guardados' : 'Guardar';
  };

  btn.addEventListener('click', async (e) => {
    // prevenir cualquier comportamiento por defecto (ej. submit accidental / navegación)
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
      e.stopPropagation();
    }

    // UI optimista: invertir estado visual inmediatamente para que el usuario vea el cambio
    const previousSaved = saved;
    setIcon(!saved);

    try {
      const resp = await fetch('../backend/guardar_propiedad/guardar_propiedad.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alojamiento_id: id })
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => null);
        throw new Error((err && err.message) ? err.message : 'Error al guardar');
      }

  const data = await resp.json();
      if (!data.success) throw new Error(data.message || 'Respuesta inválida');

      // Si backend devuelve 'saved' usamos ese valor, si no, inferimos por el mensaje
      if (typeof data.saved !== 'undefined') {
        setIcon(data.saved);
        showMsg(data.message || (data.saved ? 'Guardado' : 'Eliminado'));
      } else {
        // inferir: mensajes 'Guardado correctamente' o 'Eliminado de guardados'
        const isNowSaved = /guardad/i.test(data.message) && !/eliminad/i.test(data.message);
        setIcon(isNowSaved);
        showMsg(data.message);
      }

    } catch (error) {
      console.error('guardar_propiedad error:', error);
      // revertir UI optimista si hubo error
      setIcon(previousSaved);
      // Mostrar notificación de error usando la función global si existe
      if (window && typeof window.showTemporaryMessage === 'function') {
        window.showTemporaryMessage('No se pudo guardar la propiedad: ' + (error.message || error), 3000);
      } else if (typeof showTemporaryMessage === 'function') {
        showTemporaryMessage('No se pudo guardar la propiedad: ' + (error.message || error), 3000);
      } else {
        alert('No se pudo guardar la propiedad: ' + (error.message || error));
      }
    }
  });

  function showMsg(text) {
    // Preferir la función global expuesta por compartir_propiedad.js
    try { } catch (e) { }
    if (window && typeof window.showTemporaryMessage === 'function') {
      window.showTemporaryMessage(text);
      return;
    }
    if (typeof showTemporaryMessage === 'function') {
      showTemporaryMessage(text);
      return;
    }
    // fallback simple
    const tmp = document.createElement('div');
    tmp.textContent = text;
    tmp.style.position = 'fixed';
    tmp.style.left = '50%';
    tmp.style.bottom = '24px';
    tmp.style.transform = 'translateX(-50%)';
    tmp.style.background = '#333';
    tmp.style.color = '#fff';
    tmp.style.padding = '10px 14px';
    tmp.style.borderRadius = '8px';
    tmp.style.zIndex = '9999';
    document.body.appendChild(tmp);
    setTimeout(() => tmp.remove(), 2000);
  }

});
