<?php
declare(strict_types=1);

// Seguridad básica
ini_set('default_charset', 'UTF-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

try {
    require_once __DIR__ . '/db.php';

    // Fallback opcional si $pdo no existe
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('No hay conexión PDO disponible. Revise db.php.');
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo "<h2>Error de conexión</h2><pre>{$e->getMessage()}</pre>";
    exit;
}

// Obtener el ID de la reserva desde GET o POST
$reserva_id = (int)($_GET['id'] ?? $_POST['id'] ?? 0);

if ($reserva_id <= 0) {
    http_response_code(400);
    echo "<h2>Error</h2><p>ID de reserva inválido.</p>";
    echo '<p><a href="../index.html">Volver al inicio</a></p>';
    exit;
}

try {
    // Consulta para obtener los datos de la reserva con información del alojamiento
    $sql = "SELECT 
                r.id as reserva_id,
                r.nombre,
                r.apellido,
                r.email,
                r.telefono,
                r.fecha_inicio,
                r.fecha_fin,
                r.cantidad_personas,
                r.precio_noche,
                r.precio_total,
                r.metodo_pago,
                r.fecha_reserva,
                a.nombre as alojamiento_nombre,
                a.descripcion as alojamiento_descripcion,
                a.direccion as alojamiento_direccion,
                a.calle,
                a.altura,
                a.localidad,
                a.provincia,
                a.pais,
                a.imagen_principal
            FROM reservas r
            INNER JOIN alojamientos a ON r.alojamiento_id = a.id
            WHERE r.id = :reserva_id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([':reserva_id' => $reserva_id]);
    $reserva = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reserva) {
        http_response_code(404);
        echo "<h2>Reserva no encontrada</h2><p>La reserva con ID {$reserva_id} no existe.</p>";
        echo '<p><a href="../index.html">Volver al inicio</a></p>';
        exit;
    }

    // Calcular días de estadía
    $fecha_inicio = new DateTime($reserva['fecha_inicio']);
    $fecha_fin = new DateTime($reserva['fecha_fin']);
    $dias_estadia = $fecha_inicio->diff($fecha_fin)->days + 1; // +1 para incluir el último día

    // Formatear fechas para mostrar
    $fecha_inicio_formateada = $fecha_inicio->format('d/m/Y');
    $fecha_fin_formateada = $fecha_fin->format('d/m/Y');
    $fecha_reserva_formateada = (new DateTime($reserva['fecha_reserva']))->format('d/m/Y H:i');

    // Construir dirección completa
    $direccion_completa = '';
    if (!empty($reserva['calle'])) {
        $direccion_completa = $reserva['calle'];
        if (!empty($reserva['altura'])) {
            $direccion_completa .= ' ' . $reserva['altura'];
        }
        if (!empty($reserva['localidad'])) {
            $direccion_completa .= ', ' . $reserva['localidad'];
        }
        if (!empty($reserva['provincia'])) {
            $direccion_completa .= ', ' . $reserva['provincia'];
        }
        if (!empty($reserva['pais'])) {
            $direccion_completa .= ', ' . $reserva['pais'];
        }
    } else {
        $direccion_completa = $reserva['alojamiento_direccion'] ?? 'Dirección no disponible';
    }

    // Retornar datos como JSON para uso en el frontend
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => true,
        'reserva' => [
            'id' => $reserva['reserva_id'],
            'nombre' => $reserva['nombre'],
            'apellido' => $reserva['apellido'],
            'email' => $reserva['email'],
            'telefono' => $reserva['telefono'],
            'fecha_inicio' => $fecha_inicio_formateada,
            'fecha_fin' => $fecha_fin_formateada,
            'fecha_reserva' => $fecha_reserva_formateada,
            'cantidad_personas' => $reserva['cantidad_personas'],
            'precio_noche' => number_format((float)$reserva['precio_noche'], 2, ',', '.'),
            'precio_total' => number_format((float)$reserva['precio_total'], 2, ',', '.'),
            'metodo_pago' => $reserva['metodo_pago'],
            'dias_estadia' => $dias_estadia,
            'alojamiento' => [
                'nombre' => $reserva['alojamiento_nombre'],
                'descripcion' => $reserva['alojamiento_descripcion'],
                'direccion' => $direccion_completa,
                'imagen' => $reserva['imagen_principal']
            ]
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'error' => 'Error al obtener los datos de la reserva: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>
