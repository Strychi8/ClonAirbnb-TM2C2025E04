<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO');
  }

  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'id_invalido']);
    exit;
  }

  $st = $pdo->prepare("SELECT id, nombre, descripcion, precio_noche, direccion,
                               calle, altura, localidad, codigo_postal, provincia, pais,
                               servicios, imagen_principal
                        FROM alojamientos WHERE id = :id");
  $st->execute([':id' => $id]);
  $row = $st->fetch(PDO::FETCH_ASSOC);
  if (!$row) {
    http_response_code(404);
    echo json_encode(['error' => 'no_encontrado']);
    exit;
  }

  echo json_encode($row, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}


