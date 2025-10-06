<?php
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
    
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('No hay conexión PDO');
    }

    $usuarioId = (int)($_POST['usuario_id'] ?? 0);
    
    if ($usuarioId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de usuario inválido']);
        exit;
    }
    
    // Verificar que el usuario existe
    $checkStmt = $pdo->prepare('SELECT id FROM usuarios WHERE id = ?');
    $checkStmt->execute([$usuarioId]);
    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }
    
    // Obtener datos del formulario
    $nombre = trim((string)($_POST['nombre'] ?? ''));
    $telefono = trim((string)($_POST['telefono'] ?? ''));
    $direccion = trim((string)($_POST['direccion'] ?? ''));
    $numeroIdentidad = trim((string)($_POST['numero_identidad'] ?? ''));
    
    // Validaciones básicas
    if (empty($nombre)) {
        throw new InvalidArgumentException('El nombre es requerido');
    }
    
    // Manejar subida de foto
    $fotoSet = '';
    $params = [
        ':id' => $usuarioId,
        ':nombre' => $nombre,
        ':telefono' => $telefono,
        ':direccion' => $direccion,
        ':numero_identidad' => $numeroIdentidad
    ];
    
    if (isset($_FILES['foto_perfil']) && is_uploaded_file($_FILES['foto_perfil']['tmp_name'])) {
        // Validar tipo de archivo
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        $fileType = $_FILES['foto_perfil']['type'];
        
        if (!in_array($fileType, $allowedTypes)) {
            throw new InvalidArgumentException('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
        }
        
        // Validar tamaño (max 5MB)
        if ($_FILES['foto_perfil']['size'] > 5 * 1024 * 1024) {
            throw new InvalidArgumentException('La foto es demasiado grande. Tamaño máximo: 5MB');
        }
        
        $uploadsDir = __DIR__ . '/../uploads';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0775, true);
        }
        
        $ext = pathinfo($_FILES['foto_perfil']['name'], PATHINFO_EXTENSION);
        $safeName = 'perfil_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . ($ext ? ('.' . strtolower($ext)) : '.jpg');
        $dest = $uploadsDir . '/' . $safeName;
        
        if (move_uploaded_file($_FILES['foto_perfil']['tmp_name'], $dest)) {
            $params[':foto_perfil'] = 'uploads/' . $safeName;
            $fotoSet = ', foto_perfil = :foto_perfil';
        }
    }
    
    // Actualizar perfil
    $sql = "UPDATE usuarios
            SET nombre = :nombre,
                telefono = :telefono,
                direccion = :direccion,
                numero_identidad = :numero_identidad
                $fotoSet
            WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $resultado = $stmt->execute($params);
    
    if ($resultado) {
        // Obtener datos actualizados
        $userStmt = $pdo->prepare('SELECT id, nombre, email, telefono, foto_perfil, direccion, numero_identidad, created_at FROM usuarios WHERE id = ?');
        $userStmt->execute([$usuarioId]);
        $usuario = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'message' => 'Perfil actualizado correctamente',
            'usuario' => $usuario
        ]);
    } else {
        throw new RuntimeException('Error al actualizar el perfil');
    }
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log('Error en actualizar_perfil.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
}
?>

