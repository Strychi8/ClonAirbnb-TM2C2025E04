<?php
// Postman -> http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/registro.php
require_once 'db.php';

// Verifica si la solicitud es de tipo POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Obtiene los datos del formulario y los limpia
    $nombre = filter_input(INPUT_POST, 'nombre', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
    $email = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
    $password = $_POST['password'];
    $password_confirm = $_POST['password1'];

    // Valida que los campos no estén vacíos
    if (empty($nombre) || empty($email) || empty($password) || empty($password_confirm)) {
        die("Todos los campos son obligatorios.");
    }

    // Valida que las contraseñas coincidan
    if ($password !== $password_confirm) {
        die("Las contraseñas no coinciden.");
    }

    // Valida el formato del email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("El formato del email es inválido.");
    }

    // Hashea la contraseña para mayor seguridad
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Prepara la consulta para evitar inyecciones SQL
    $sql = "INSERT INTO usuarios (nombre, email, contrasenia) VALUES (?, ?, ?)";
    $stmt = $pdo->prepare($sql);

    // Vincula los parámetros y ejecuta la consulta

    if ($stmt->execute([$nombre, $email, $hashed_password])) {
        // Redirecciona a la página principal después del registro exitoso
        header("Location: ../index.html");
        exit();
    } else {
        // Muestra un error si la inserción falla
        echo "Error al registrar el usuario: " . $stmt->error;
    }

    // Cierra la declaración y la conexión
    $stmt->closeCursor();
} else {
    // Si no es una solicitud POST, redirecciona al formulario de registro
    header("Location: signup.html");
    exit();
}
?>