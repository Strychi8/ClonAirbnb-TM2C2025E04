function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function volver(defaultPage = "mis_alojamientos.html") {
  const origen = getParam("from"); // intento usar parámetro 'from'

  if (origen) {
    // Si existe 'from', vamos a esa página
    window.location.href = origen;
  } else if (window.history.length > 1) {
    // Si no, intentamos volver al historial del navegador
    window.history.back();
  } else {
    // Si no hay historial, vamos a la página por defecto
    window.location.href = defaultPage;
  }
}