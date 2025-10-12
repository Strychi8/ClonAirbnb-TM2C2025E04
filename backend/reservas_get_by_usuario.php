<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
    require __DIR__ . '/db.php';
    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('No hay conexión PDO.');
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
        exit;
    }

    $usuario_id = isset($_GET['usuario_id']) ? (int)$_GET['usuario_id'] : 0;
    if ($usuario_id <= 0) {
        throw new InvalidArgumentException('ID de usuario inválido.');
    }

    // --- Actualizar reservas activas a finalizadas si la fecha_fin ya pasó ---
    $hoy = date('Y-m-d');
    $pdo->prepare("
        UPDATE reservas
        SET estado = 'finalizada'
        WHERE estado = 'activa' AND fecha_fin < :hoy AND usuario_id = :usuario_id
    ")->execute([
        ':hoy' => $hoy,
        ':usuario_id' => $usuario_id
    ]);
    // ----------------------------------------------------------------------

    $stmt = $pdo->prepare("
        SELECT 
            r.id, 
            r.alojamiento_id,
            r.nombre, 
            r.apellido, 
            r.email, 
            r.telefono, 
            DATE(r.fecha_inicio) AS fecha_inicio,
            DATE(r.fecha_fin) AS fecha_fin,
            r.cantidad_personas, 
            r.precio_noche,
            r.precio_total, 
            r.metodo_pago,
            DATE(r.fecha_reserva) AS fecha_reserva,
            r.estado,
            a.nombre AS alojamiento_nombre,
            a.imagen_principal AS alojamiento_imagen,
            a.direccion AS alojamiento_direccion
        FROM reservas r
        INNER JOIN alojamientos a ON r.alojamiento_id = a.id
        WHERE r.usuario_id = :usuario_id
        ORDER BY r.fecha_inicio ASC
    ");

    $stmt->execute([':usuario_id' => $usuario_id]);
    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reservas ?: []);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
