<?php
// backend/login.php
declare(strict_types=1);
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  header('Location: signin.html');
  exit();
}

$email    = $_POST['email']    ?? '';
$password = $_POST['password'] ?? '';
$redirect = $_POST['redirect_url'] ?? ($_SESSION['redirect_after_login'] ?? '../index.html');

$sql = "SELECT id, nombre, email, contrasenia, estado
        FROM usuarios
        WHERE email = ?
        LIMIT 1";
$stmt = $pdo->prepare($sql);
$stmt->execute([$email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['contrasenia'])) {
  header('Location: ../autenticacion/signin.html?error=1'); // credenciales inválidas
  exit();
}

/* Bloquear acceso si no está activo */
if ($user['estado'] !== 'activo') {
  // NO crear sesión
  $code = ($user['estado'] === 'desactivado') ? 'deactivated' : 'deleted';
  header('Location: ../autenticacion/signin.html?error=' . $code . '&email=' . urlencode($email));
  exit();
}

/* Login OK */
session_regenerate_id(true);
$_SESSION['user_id']    = (int)$user['id'];
$_SESSION['user_name']  = $user['nombre'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['logged_in']  = true;

unset($_SESSION['redirect_after_login']); // limpiar

header('Location: ' . $redirect);
exit();