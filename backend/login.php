<?php
// Inicia una sesión de PHP
session_start();

// Incluye el archivo de configuración y conexión a la base de datos
require_once 'db.php';

// Verifica si la solicitud es de tipo POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtiene los datos del formulario
    $email = $_POST['email'];
    $password = $_POST['password'];

    // Prepara la consulta para evitar inyecciones SQL
    $sql = "SELECT id, nombre, contrasenia FROM usuarios WHERE email = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$email]); // Pasa los parámetros directamente a execute()
    $user = $stmt->fetch(PDO::FETCH_ASSOC); // Obtiene la fila como un array asociativo

    // Verifica si se encontró un usuario con el email proporcionado
    if ($user = $stmt->fetch(PDO::FETCH_ASSOC) > 0) {
        $user = $result->fetch_assoc();

        // Verifica si la contraseña coincide con la contraseña hasheada en la base de datos
        if (password_verify($password, $user['contrasenia'])) {
            // Contraseña correcta, inicia la sesión
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['nombre'];
            $_SESSION['logged_in'] = true;

            // Redirecciona al usuario a la página principal
            header("Location: ../index.html");
            exit();
        } else {
            // Contraseña incorrecta
            echo "Email o contraseña incorrectos.";
        }
    } else {
        // No se encontró un usuario con ese email
        echo "Email o contraseña incorrectos.";
    }

    // Cierra la declaración y la conexión
    $stmt->closeCursor();
} else {
    // Si no es una solicitud POST, redirecciona al formulario de inicio de sesión
    header("Location: signin.html");
    exit();
}
?>
