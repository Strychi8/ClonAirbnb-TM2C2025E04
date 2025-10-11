<?php
declare(strict_types=1);
session_start();

error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');

try {
    require_once __DIR__ . '/db.php';

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['error' => 'Usuario no autenticado']);
        exit;
    }
    $usuario_id = $_SESSION['user_id'];

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['error' => 'Método no permitido']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['reserva_id'])) {
        echo json_encode(['error' => 'Datos incompletos']);
        exit;
    }

    $reserva_id = (int)$data['reserva_id'];

    // Buscar la reserva
    $stmt = $pdo->prepare("SELECT * FROM reservas WHERE id = :id AND usuario_id = :usuario_id");
    $stmt->execute([':id' => $reserva_id, ':usuario_id' => $usuario_id]);
    $reserva = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$reserva) {
        echo json_encode(['error' => 'Reserva no encontrada o no pertenece a tu cuenta']);
        exit;
    }

    $fecha_inicio = new DateTime($reserva['fecha_inicio']);
    $fecha_fin = new DateTime($reserva['fecha_fin']);
    $hoy = new DateTime('today');

    if ($hoy >= $fecha_inicio && $hoy <= $fecha_fin) {
        echo json_encode(['error' => 'No se puede cancelar una reserva en curso']);
        exit;
    }
    if ($hoy > $fecha_fin) {
        echo json_encode(['error' => 'No se puede cancelar una reserva pasada']);
        exit;
    }
    $diff = $hoy->diff($fecha_inicio)->days;
    if ($diff < 2) {
        echo json_encode(['error' => 'Solo se puede cancelar hasta 2 días antes del inicio']);
        exit;
    }

    // Actualizar estado dentro de transacción
    $pdo->beginTransaction();
    $stmt_update = $pdo->prepare("UPDATE reservas SET estado = 'cancelada' WHERE id = :id");
    $stmt_update->execute([':id' => $reserva_id]);
    $pdo->commit();

    // Opcional: devolver estado actualizado
    echo json_encode(['success' => true, 'estado' => 'cancelada']);

} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    error_log('Error cancelar reserva: ' . $e->getMessage());
    echo json_encode(['error' => 'Error del servidor: ' . $e->getMessage()]);
}
