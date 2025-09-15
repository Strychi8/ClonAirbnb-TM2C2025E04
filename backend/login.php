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

            header("Location: ../index.html");
            exit();
        } else {
            echo "Email o contraseña incorrectos.";
        }
    } else {
        echo "Email o contraseña incorrectos.";
    }

    $stmt->closeCursor();
} else {
    header("Location: signin.html");
    exit();
}
?>
