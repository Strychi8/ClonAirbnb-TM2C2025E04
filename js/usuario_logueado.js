document.addEventListener("DOMContentLoaded", () => {
  fetch('backend/check_login.php')
    .then(res => res.json())
    .then(data => {
      const loginButtonsDiv = document.getElementById('login-buttons');
      const userMenuDiv = document.getElementById('user-menu');
      
      if (data.logged_in) {
        // Ocultar botones de login y mostrar menú de usuario
        if (loginButtonsDiv) loginButtonsDiv.style.display = 'none';
        if (userMenuDiv) {
          userMenuDiv.style.display = 'flex';
          
          // Actualizar nombre del usuario
          const userNameSpan = document.getElementById('user-name');
          if (userNameSpan) userNameSpan.textContent = data.user_name;
          
          // Configurar funcionalidad del dropdown
          setupUserDropdown();
          
          // Configurar logout
          setupLogout();
        } else {
          // Si no existe el div user-menu, crear el menú completo (compatibilidad con versión anterior)
          createLegacyUserMenu(loginButtonsDiv, data.user_name);
        }
      } else {
        // Usuario no logueado - mostrar botones de login
        if (loginButtonsDiv) loginButtonsDiv.style.display = 'flex';
        if (userMenuDiv) userMenuDiv.style.display = 'none';
      }
    })
    .catch(err => console.error('Error al verificar sesión:', err));
});

function setupUserDropdown() {
  const dropdownBtn = document.getElementById('user-dropdown-btn');
  const dropdown = document.getElementById('user-dropdown');
  
  if (dropdownBtn && dropdown) {
    // Mostrar/ocultar dropdown al hacer clic en el botón
    dropdownBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      const isVisible = dropdown.style.display === 'block';
      dropdown.style.display = isVisible ? 'none' : 'block';
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
      if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }
}

function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        fetch('backend/logout.php')
          .then(() => window.location.reload()) // recarga la página para actualizar botones
          .catch(err => console.error('Error al cerrar sesión:', err));
      }
    });
  }
}

// Función de compatibilidad para versión anterior (si no existe el div user-menu)
function createLegacyUserMenu(loginButtonsDiv, userName) {
  if (loginButtonsDiv) {
    loginButtonsDiv.innerHTML = `
      <span>Bienvenido, ${userName}</span>
      <a class="btn btn-primary" href="alojamientos/mis_alojamientos.html">Mis alojamientos</a>
      <a id="legacy-logout-btn" class="btn btn-primary" href="#">Cerrar sesión</a>
    `;

    // Asignar funcionalidad al botón de cerrar sesión legacy
    const legacyLogoutBtn = document.getElementById('legacy-logout-btn');
    legacyLogoutBtn.addEventListener('click', e => {
      e.preventDefault();
      if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        fetch('backend/logout.php')
          .then(() => window.location.reload())
          .catch(err => console.error('Error al cerrar sesión:', err));
      }
    });
  }
}
