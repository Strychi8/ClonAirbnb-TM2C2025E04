function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function volver(defaultPage = "http://localhost/Alquileres-y-alojamientos--main/") {
  const origen = getParam("from") || defaultPage;
  window.location.href = origen;
}
