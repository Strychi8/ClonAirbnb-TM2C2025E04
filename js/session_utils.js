/**
 * Utility functions for session management
 */

/**
 * Gets current session data from the backend
 * @param {string} basePath - Base path to backend (e.g., '../backend/' or 'backend/')
 * @returns {Promise<{logged_in: boolean, user_id?: number, user_name?: string}>}
 */
async function getSessionData(basePath = '../backend/') {
  try {
    const response = await fetch(`${basePath}check_login.php`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Session data retrieved:', data);
    return data;
    
  } catch (error) {
    console.error('Error getting session data:', error);
    return { logged_in: false };
  }
}

/**
 * Checks if user is authenticated and redirects to login if not
 * @param {string} basePath - Base path to backend
 * @param {string} loginPath - Path to login page (default: '../autenticacion/signin.html')
 * @returns {Promise<{user_id: number, user_name: string} | null>} User data if authenticated, null if not
 */
async function requireAuth(basePath = '../backend/', loginPath = '../autenticacion/signin.html') {
  const sessionData = await getSessionData(basePath);
  
  if (!sessionData.logged_in || !sessionData.user_id) {
    alert('Debes iniciar sesión para acceder a esta página');
    window.location.href = loginPath;
    return null;
  }
  
  return {
    user_id: sessionData.user_id,
    user_name: sessionData.user_name
  };
}

// Export functions for use in other scripts
window.SessionUtils = {
  getSessionData,
  requireAuth
};
