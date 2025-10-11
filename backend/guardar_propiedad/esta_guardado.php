<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/guardar_propiedad/esta_guardado.php?id=XX
// Metodo: GET
// Funcionalidad: verificar si un alojamiento está guardado en los favoritos del usuario autenticado.
// Requisitos: tabla `propiedades_guardadas` en la base de datos.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
    session_start();

    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }

    require __DIR__ . '/../../backend/db.php';

    $alojamientoId = $_GET['id'] ?? null;
    if (!$alojamientoId || !is_numeric($alojamientoId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de alojamiento inválido']);
        exit;
    }

    $alojamientoId = (int)$alojamientoId;
    $usuarioId = (int)$_SESSION['user_id'];

    $stmt = $pdo->prepare('SELECT 1 FROM propiedades_guardadas WHERE usuario_id = ? AND alojamiento_id = ? LIMIT 1');
    $stmt->execute([$usuarioId, $alojamientoId]);
    $exists = (bool)$stmt->fetchColumn();

    echo json_encode(['success' => true, 'saved' => $exists]);
    exit;

} catch (PDOException $e) {
    error_log('esta_guardado error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos']);
} catch (Exception $e) {
    error_log('esta_guardado unexpected: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
}

?>
