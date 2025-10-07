<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    // Obtener información completa del usuario desde la base de datos
    require_once __DIR__ . '/db.php';
    
    try {
        $stmt = $pdo->prepare('SELECT id, nombre, nombre_completo, email, telefono, foto_perfil, direccion, numero_identidad, created_at FROM usuarios WHERE id = ?');
        $stmt->execute([$_SESSION['user_id']]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($usuario) {
            // Use nombre_completo if available, otherwise fall back to nombre
            $displayName =  $usuario['nombre'];
            
            echo json_encode([
                'logged_in' => true,
                'user_name' => $displayName,
                'nombre_completo' => $usuario['nombre_completo'],
                'user_id' => $usuario['id'],
                'user_email' => $usuario['email'],
                'telefono' => $usuario['telefono'],
                'foto_perfil' => $usuario['foto_perfil'],
                'direccion' => $usuario['direccion'],
                'numero_identidad' => $usuario['numero_identidad'],
                'created_at' => $usuario['created_at']
            ]);
        } else {
            // Si no se encuentra el usuario, cerrar sesión
            session_destroy();
            echo json_encode(['logged_in' => false]);
        }
    } catch (Exception $e) {
        error_log('Error en check_login.php: ' . $e->getMessage());
        // En caso de error, devolver información básica de la sesión
        echo json_encode([
            'logged_in' => true,
            'user_name' => $_SESSION['user_name'],
            'user_id' => $_SESSION['user_id']
        ]);
    }
} else {
    echo json_encode(['logged_in' => false]);
}
