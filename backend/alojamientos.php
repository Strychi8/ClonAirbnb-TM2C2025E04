<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';

  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO (revise db.php).');
  }

  $sql = "SELECT id, nombre, descripcion, precio_noche, direccion, servicios, imagen_principal
          FROM alojamientos
          ORDER BY id";
  $st = $pdo->query($sql);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'error' => 'server_error',
    'message' => $e->getMessage()
  ], JSON_UNESCAPED_UNICODE);
}