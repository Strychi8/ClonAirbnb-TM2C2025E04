<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/restablecer_contrasenia.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use POST']);
    exit;
}

try {
    require __DIR__ . '/db.php';
    
    // Leer datos JSON del cuerpo de la petición
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new InvalidArgumentException('Datos JSON inválidos');
    }
    
    $token = trim($input['token'] ?? '');
    $nuevaContrasenia = trim($input['nueva_contrasenia'] ?? '');
    
    // Validaciones
    if (empty($token)) {
        throw new InvalidArgumentException('Token de recuperación requerido');
    }
    
    if (empty($nuevaContrasenia)) {
        throw new InvalidArgumentException('La nueva contraseña es requerida');
    }
    
    if (strlen($nuevaContrasenia) < 6) {
        throw new InvalidArgumentException('La contraseña debe tener al menos 6 caracteres');
    }
    
    // Verificar token válido y no expirado
    $stmt = $pdo->prepare('
        SELECT prt.usuario_id, u.email, u.nombre 
        FROM password_reset_tokens prt
        JOIN usuarios u ON u.id = prt.usuario_id
        WHERE prt.token = ? AND prt.expiracion > NOW()
    ');
    $stmt->execute([$token]);
    $datos = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$datos) {
        throw new InvalidArgumentException('Token inválido o expirado');
    }
    
    // Iniciar transacción
    $pdo->beginTransaction();
    
    try {
        // Actualizar contraseña
        $contraseniaHash = password_hash($nuevaContrasenia, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare('UPDATE usuarios SET contrasenia = ? WHERE id = ?');
        $stmt->execute([$contraseniaHash, $datos['usuario_id']]);
        
        // Eliminar token usado
        $stmt = $pdo->prepare('DELETE FROM password_reset_tokens WHERE usuario_id = ?');
        $stmt->execute([$datos['usuario_id']]);
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Contraseña actualizada exitosamente'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log('Error en restablecer_contrasenia.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor'
    ]);
}
?>