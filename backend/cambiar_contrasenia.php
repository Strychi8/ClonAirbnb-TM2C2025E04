<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/cambiar_contrasenia.php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

try {
    require __DIR__ . '/db.php';
    
    // Leer datos JSON del cuerpo de la petición
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new InvalidArgumentException('Datos JSON inválidos');
    }
    
    $usuarioId = $input['usuario_id'] ?? null;
    $contraseniaActual = $input['contrasenia_actual'] ?? '';
    $nuevaContrasenia = $input['nueva_contrasenia'] ?? '';
    
    // Validaciones
    if (!$usuarioId || !is_numeric($usuarioId)) {
        throw new InvalidArgumentException('ID de usuario inválido');
    }
    
    if (empty($contraseniaActual)) {
        throw new InvalidArgumentException('La contraseña actual es requerida');
    }
    
    if (empty($nuevaContrasenia)) {
        throw new InvalidArgumentException('La nueva contraseña es requerida');
    }
    
    if (strlen($nuevaContrasenia) < 6) {
        throw new InvalidArgumentException('La nueva contraseña debe tener al menos 6 caracteres');
    }
    
    if ($contraseniaActual === $nuevaContrasenia) {
        throw new InvalidArgumentException('La nueva contraseña debe ser diferente a la actual');
    }
    
    // Verificar que el usuario existe y obtener su contraseña actual
    $stmt = $pdo->prepare('SELECT id, contrasenia FROM usuarios WHERE id = ?');
    $stmt->execute([$usuarioId]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario) {
        throw new InvalidArgumentException('Usuario no encontrado');
    }
    
    // Verificar la contraseña actual
    if (!password_verify($contraseniaActual, $usuario['contrasenia'])) {
        echo json_encode([
            'success' => false, 
            'message' => 'La contraseña actual es incorrecta'
        ]);
        exit;
    }
    
    // Encriptar la nueva contraseña
    $nuevaContraseniaHash = password_hash($nuevaContrasenia, PASSWORD_DEFAULT);
    
    // Actualizar la contraseña en la base de datos
    $updateStmt = $pdo->prepare('UPDATE usuarios SET contrasenia = ? WHERE id = ?');
    $resultado = $updateStmt->execute([$nuevaContraseniaHash, $usuarioId]);
    
    if ($resultado) {
        echo json_encode([
            'success' => true, 
            'message' => 'Contraseña actualizada correctamente'
        ]);
    } else {
        throw new RuntimeException('Error al actualizar la contraseña');
    }
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log('Error en cambiar_contrasenia.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor'
    ]);
}
?>