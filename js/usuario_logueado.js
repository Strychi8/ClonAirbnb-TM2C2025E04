document.addEventListener("DOMContentLoaded", () => {
  fetch('backend/check_login.php')
    .then(res => res.json())
    .then(data => {
      console.log(data);
      const div = document.getElementById('login-buttons');
      if (data.logged_in) {
        div.innerHTML = `
          <span>Bienvenido, ${data.user_name}</span>
          <a class="btn btn-primary" href="alojamientos/mis_alojamientos.html">Mis alojamientos</a>
          <a id="logout-btn" class="btn btn-primary" href="#">Cerrar sesión</a>
        `;

        // Asignar funcionalidad al botón de cerrar sesión
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', e => {
          e.preventDefault();
          fetch('backend/logout.php')
            .then(() => window.location.reload()) // recarga la página para actualizar botones
            .catch(err => console.error('Error al cerrar sesión:', err));
        });
      }
    })
    .catch(err => console.error('Error al verificar sesión:', err));
});
