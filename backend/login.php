<?php
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    $sql = "SELECT id, nombre, contrasenia FROM usuarios WHERE email = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) { // si encontró usuario
        if (password_verify($password, $user['contrasenia'])) {
            // Contraseña correcta
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['nombre'];
            $_SESSION['logged_in'] = true;

            // Check if there's a redirect URL stored
            $redirect_url = $_POST['redirect_url'] ?? $_SESSION['redirect_after_login'] ?? '../index.html';
            unset($_SESSION['redirect_after_login']); // Clear the redirect URL
            
            header("Location: " . $redirect_url);
            exit();
        } else {
            // Redirigir de vuelta al formulario de login con un flag de error
            header('Location: ../autenticacion/signin.html?error=1');
            exit();
        }
    } else {
        // Redirigir de vuelta al formulario de login con un flag de error
        header('Location: ../autenticacion/signin.html?error=1');
        exit();
    }

    $stmt->closeCursor();
} else {
    header("Location: signin.html");
    exit();
}
