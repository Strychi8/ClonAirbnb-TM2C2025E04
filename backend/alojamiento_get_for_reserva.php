<?php
declare(strict_types=1);

// Seguridad básica
ini_set('default_charset', 'UTF-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Content-Type: application/json');

try {
    require_once __DIR__ . '/db.php';

    // Fallback opcional si $pdo no existe (ajustar si hace falta)
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('No hay conexión PDO disponible. Revise db.php.');
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

// Verificar que se proporcionó un ID
$alojamiento_id = (int)($_GET['id'] ?? 0);
if ($alojamiento_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de alojamiento requerido']);
    exit;
}

try {
    // Obtener datos del alojamiento
    $stmt = $pdo->prepare("
        SELECT 
            id,
            usuario_id,
            nombre,
            descripcion,
            precio_noche,
            direccion,
            calle,
            altura,
            localidad,
            codigo_postal,
            provincia,
            pais,
            servicios,
            imagen_principal
        FROM alojamientos 
        WHERE id = :id
    ");
    
    $stmt->execute([':id' => $alojamiento_id]);
    $alojamiento = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$alojamiento) {
        http_response_code(404);
        echo json_encode(['error' => 'Alojamiento no encontrado']);
        exit;
    }
    
    // Formatear la dirección
    $direccion_completa = '';
    if ($alojamiento['calle'] && $alojamiento['altura'] && $alojamiento['localidad'] && $alojamiento['provincia'] && $alojamiento['pais']) {
        $direccion_completa = "{$alojamiento['calle']} {$alojamiento['altura']}, {$alojamiento['localidad']}, {$alojamiento['provincia']}, {$alojamiento['pais']}";
    } elseif ($alojamiento['direccion']) {
        $direccion_completa = $alojamiento['direccion'];
    }
    
    // Parsear servicios si existen
    $servicios = [];
    if ($alojamiento['servicios']) {
        $servicios = json_decode($alojamiento['servicios'], true) ?: [];
    }
    
    // Preparar respuesta
    $response = [
        'id' => (int)$alojamiento['id'],
        'usuario_id' => (int)$alojamiento['usuario_id'],
        'nombre' => $alojamiento['nombre'],
        'descripcion' => $alojamiento['descripcion'],
        'precio_noche' => (float)$alojamiento['precio_noche'],
        'direccion' => $direccion_completa,
        'servicios' => $servicios,
        'imagen_principal' => $alojamiento['imagen_principal'] ? '../uploads/' . basename($alojamiento['imagen_principal']) : null
    ];
    
    echo json_encode($response);
    
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener el alojamiento: ' . $e->getMessage()]);
}
