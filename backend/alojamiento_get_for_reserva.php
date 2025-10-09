<?php
declare(strict_types=1);

// Seguridad y encabezados
header('Content-Type: application/json; charset=utf-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

// Configurar errores: loguearlos, no mostrarlos en pantalla
error_reporting(E_ALL);
ini_set('display_errors', '0');        // ❌ no mostrar en salida (evita el "<br><b>Warning")
ini_set('log_errors', '1');            // ✅ loguearlos en el log del servidor
ini_set('error_log', __DIR__ . '/errores_php.log'); // se guarda en backend/errores_php.log

try {
    require_once __DIR__ . '/db.php';

    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('No hay conexión PDO disponible. Revise db.php.');
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

// Validar ID recibido
$alojamiento_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($alojamiento_id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'ID de alojamiento requerido']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            id,
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
            imagen_principal,
            usuario_id
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

    // Formatear dirección
    $direccion_completa = '';
    if (!empty($alojamiento['calle']) && !empty($alojamiento['altura']) && !empty($alojamiento['localidad']) && !empty($alojamiento['provincia']) && !empty($alojamiento['pais'])) {
        $direccion_completa = "{$alojamiento['calle']} {$alojamiento['altura']}, {$alojamiento['localidad']}, {$alojamiento['provincia']}, {$alojamiento['pais']}";
    } elseif (!empty($alojamiento['direccion'])) {
        $direccion_completa = $alojamiento['direccion'];
    }

    // Parsear servicios
    $servicios = [];
    if (!empty($alojamiento['servicios'])) {
        $servicios = json_decode($alojamiento['servicios'], true);
        if (!is_array($servicios)) {
            $servicios = [$alojamiento['servicios']];
        }
    }

    // Generar respuesta limpia
    $response = [
        'id' => (int)$alojamiento['id'],
        'nombre' => $alojamiento['nombre'] ?? '',
        'descripcion' => $alojamiento['descripcion'] ?? '',
        'precio_noche' => (float)($alojamiento['precio_noche'] ?? 0),
        'direccion' => $direccion_completa,
        'servicios' => $servicios,
        'usuario_id' => isset($alojamiento['usuario_id']) ? (int)$alojamiento['usuario_id'] : null,
        'imagen_principal' => !empty($alojamiento['imagen_principal'])
            ? '../uploads/' . basename($alojamiento['imagen_principal'])
            : null
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al obtener el alojamiento: ' . $e->getMessage()]);
}
