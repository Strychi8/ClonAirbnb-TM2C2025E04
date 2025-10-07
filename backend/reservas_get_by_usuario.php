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

    $stmt = $pdo->prepare("
        SELECT 
            r.id, 
            r.alojamiento_id,
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
            a.imagen_principal as alojamiento_imagen,
            a.direccion as alojamiento_direccion
        FROM reservas r
        INNER JOIN alojamientos a ON r.alojamiento_id = a.id
        WHERE r.usuario_id = :usuario_id
        ORDER BY r.fecha_reserva DESC
    ");
    $stmt->execute([':usuario_id' => $usuario_id]);
    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reservas ?: []);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

