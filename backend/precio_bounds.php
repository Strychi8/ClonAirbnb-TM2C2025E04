<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO');
  }

  $zona = isset($_GET['zona']) ? trim((string)$_GET['zona']) : '';

  if ($zona !== '') {
    $sql = "SELECT MIN(CAST(precio_noche AS DECIMAL(10,2))) AS min_precio,
                   MAX(CAST(precio_noche AS DECIMAL(10,2))) AS max_precio
            FROM alojamientos
            WHERE (provincia LIKE :z1 OR localidad LIKE :z2)";
    $st = $pdo->prepare($sql);
    $st->execute([':z1' => "%$zona%", ':z2' => "%$zona%"]);
  } else {
    $sql = "SELECT MIN(CAST(precio_noche AS DECIMAL(10,2))) AS min_precio,
                   MAX(CAST(precio_noche AS DECIMAL(10,2))) AS max_precio
            FROM alojamientos";
    $st = $pdo->query($sql);
  }

  $row = $st->fetch(PDO::FETCH_ASSOC) ?: [];
  $min = isset($row['min_precio']) ? (float)$row['min_precio'] : 0.0;
  $max = isset($row['max_precio']) ? (float)$row['max_precio'] : 150000.0;

  // Si no hay datos, devolver un rango por defecto
  if ($min <= 0 && $max <= 0) {
    $min = 0.0;
    $max = 150000.0;
  }

  echo json_encode(['min' => $min, 'max' => $max], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}


