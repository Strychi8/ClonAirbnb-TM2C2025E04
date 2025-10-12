<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/guardar_propiedad/guardar_propiedad.php
// Metodo: POST
// Funcionalidad: permitir a usuarios autenticados guardar/quitar un alojamiento en sus "guardados/favoritos".
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

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $alojamientoId = $input['alojamiento_id'] ?? $input['id'] ?? null;
    $action = strtolower($input['action'] ?? 'toggle'); // add | remove | toggle

    if (!$alojamientoId || !is_numeric($alojamientoId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de alojamiento inválido']);
        exit;
    }

    $alojamientoId = (int)$alojamientoId;
    $usuarioId = (int)$_SESSION['user_id'];

    // --- NUEVO: comprobar que el alojamiento no pertenece al usuario que intenta guardarlo ---
    $ownerStmt = $pdo->prepare('SELECT usuario_id FROM alojamientos WHERE id = ? LIMIT 1');
    $ownerStmt->execute([$alojamientoId]);
    $ownerRow = $ownerStmt->fetch(PDO::FETCH_ASSOC);
    if ($ownerRow && isset($ownerRow['usuario_id'])) {
        $propietarioId = (int)$ownerRow['usuario_id'];
        if ($propietarioId === $usuarioId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No puedes guardar tu propio alojamiento.']);
            exit;
        }
    }

    // Comprobar si ya existe
    $stmt = $pdo->prepare('SELECT id FROM propiedades_guardadas WHERE usuario_id = ? AND alojamiento_id = ?');
    $stmt->execute([$usuarioId, $alojamientoId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($action === 'add') {
        if ($row) {
            echo json_encode(['success' => true, 'message' => 'Ya guardado']);
            exit;
        }
        $ins = $pdo->prepare('INSERT INTO propiedades_guardadas (usuario_id, alojamiento_id) VALUES (?, ?)');
        $ins->execute([$usuarioId, $alojamientoId]);
        echo json_encode(['success' => true, 'message' => 'Guardado correctamente']);
        exit;
    }

    if ($action === 'remove') {
        if (!$row) {
            echo json_encode(['success' => true, 'message' => 'No estaba guardado']);
            exit;
        }
        $del = $pdo->prepare('DELETE FROM propiedades_guardadas WHERE usuario_id = ? AND alojamiento_id = ?');
        $del->execute([$usuarioId, $alojamientoId]);
        echo json_encode(['success' => true, 'message' => 'Eliminado de guardados']);
        exit;
    }

    // toggle por defecto
    if ($row) {
        $del = $pdo->prepare('DELETE FROM propiedades_guardadas WHERE usuario_id = ? AND alojamiento_id = ?');
        $del->execute([$usuarioId, $alojamientoId]);
        echo json_encode(['success' => true, 'message' => 'Eliminado de guardados', 'saved' => false]);
        exit;
    } else {
        $ins = $pdo->prepare('INSERT INTO propiedades_guardadas (usuario_id, alojamiento_id) VALUES (?, ?)');
        $ins->execute([$usuarioId, $alojamientoId]);
        echo json_encode(['success' => true, 'message' => 'Guardado correctamente', 'saved' => true]);
        exit;
    }

} catch (PDOException $e) {
    error_log('guardar_propiedad error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos']);
} catch (Exception $e) {
    error_log('guardar_propiedad unexpected: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
}

?>
