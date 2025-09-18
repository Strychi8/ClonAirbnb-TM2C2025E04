<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO (revise db.php).');
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
  }
  $input = json_decode(file_get_contents('php://input'), true);
  $id = (int)($input['id'] ?? 0);
  $usuarioId = (int)($input['usuario_id'] ?? 0);

  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'id_invalido']);
    exit;
  }

  if ($usuarioId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'usuario_id_requerido']);
    exit;
  }

  // Verificar que el alojamiento pertenece al usuario
  $checkSql = "SELECT id FROM alojamientos WHERE id = :id AND usuario_id = :usuario_id";
  $checkStmt = $pdo->prepare($checkSql);
  $checkStmt->execute([':id' => $id, ':usuario_id' => $usuarioId]);
  $row = $checkStmt->fetch(PDO::FETCH_ASSOC);

  if (!$row) {
    http_response_code(403);
    echo json_encode(['error' => 'no_autorizado', 'message' => 'No tienes permisos para eliminar este alojamiento']);
    exit;
  }

  // Eliminar el registro
  $delSql = "DELETE FROM alojamientos WHERE id = :id AND usuario_id = :usuario_id";
  $delStmt = $pdo->prepare($delSql);
  $delStmt->execute([':id' => $id, ':usuario_id' => $usuarioId]);

  echo json_encode(['ok' => true, 'id' => $id]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}
