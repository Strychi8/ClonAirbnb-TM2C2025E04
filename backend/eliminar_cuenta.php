<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/eliminar_cuenta.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use DELETE']);
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
    
    // Validaciones
    if (!$usuarioId || !is_numeric($usuarioId)) {
        throw new InvalidArgumentException('ID de usuario inválido');
    }
    
    // Iniciar transacción
    $pdo->beginTransaction();
    
    try {
        // Verificar que el usuario existe
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE id = ?');
        $stmt->execute([$usuarioId]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario) {
            throw new InvalidArgumentException('Usuario no encontrado');
        }
        
        // Eliminar reservas del usuario (si las hay)
        $pdo->prepare('DELETE FROM reservas WHERE email IN (SELECT email FROM usuarios WHERE id = ?)')->execute([$usuarioId]);
        
        // Eliminar imágenes de alojamientos del usuario
        $pdo->prepare('DELETE FROM alojamiento_imagenes WHERE alojamiento_id IN (SELECT id FROM alojamientos WHERE usuario_id = ?)')->execute([$usuarioId]);
        
        // Eliminar alojamientos del usuario
        $pdo->prepare('DELETE FROM alojamientos WHERE usuario_id = ?')->execute([$usuarioId]);
        
        // Finalmente eliminar el usuario
        $deleteStmt = $pdo->prepare('DELETE FROM usuarios WHERE id = ?');
        $resultado = $deleteStmt->execute([$usuarioId]);
        
        if ($resultado && $deleteStmt->rowCount() > 0) {
            $pdo->commit();
            
            // Destruir la sesión del usuario
            session_destroy();
            
            echo json_encode([
                'success' => true, 
                'message' => 'Cuenta eliminada correctamente'
            ]);
        } else {
            throw new RuntimeException('No se pudo eliminar la cuenta');
        }
        
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
    error_log('Error en eliminar_cuenta.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor'
    ]);
}
?>