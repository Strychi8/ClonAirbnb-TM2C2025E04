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

    // Usar el parámetro correcto
    $id_alojamiento = isset($_GET['alojamiento_id']) ? (int)$_GET['alojamiento_id'] : 0;

    if ($id_alojamiento <= 0) {
        throw new InvalidArgumentException('ID de alojamiento inválido.');
    }

    $stmt = $pdo->prepare("
        SELECT id, nombre, apellido, email, telefono, fecha_inicio, fecha_fin, cantidad_personas, precio_total, fecha_reserva 
        FROM reservas 
        WHERE alojamiento_id = :id_alojamiento
        ORDER BY fecha_inicio DESC
    ");
    $stmt->execute([':id_alojamiento' => $id_alojamiento]);
    $reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reservas ?: []);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
