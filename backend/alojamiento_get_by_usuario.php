<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO');
  }

  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  $usuarioId = isset($_GET['usuario_id']) ? (int)$_GET['usuario_id'] : 0;
  
  if ($usuarioId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'usuario_id_invalido']);
    exit;
  }

  if ($id > 0) {
    // Get specific accommodation by ID and user_id
    $st = $pdo->prepare("SELECT id, nombre, descripcion, precio_noche, direccion,
                                 calle, altura, localidad, codigo_postal, provincia, pais,
                                 servicios, imagen_principal
                          FROM alojamientos WHERE id = :id AND usuario_id = :usuario_id");
    $st->execute([':id' => $id, ':usuario_id' => $usuarioId]);
    $row = $st->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
      http_response_code(404);
      echo json_encode(['error' => 'no_encontrado']);
      exit;
    }
    echo json_encode($row, JSON_UNESCAPED_UNICODE);
  } else {
    // Get all accommodations for the user
    $st = $pdo->prepare("SELECT id, nombre, descripcion, precio_noche, direccion,
                                 calle, altura, localidad, codigo_postal, provincia, pais,
                                 servicios, imagen_principal
                          FROM alojamientos WHERE usuario_id = :usuario_id ORDER BY id DESC");
    $st->execute([':usuario_id' => $usuarioId]);
    $rows = $st->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
  }
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}


