<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO');
  }

  $zona = isset($_GET['zona']) ? trim($_GET['zona']) : '';
  $min = isset($_GET['min']) ? (int)$_GET['min'] : 0;
  $max = isset($_GET['max']) ? (int)$_GET['max'] : 150000;

  // Validación de parámetros
  if ($min > $max || $min < 0 || $max < 0) {
    http_response_code(400);
    echo json_encode(['error' => 'rango_invalido']);
    exit;
  }

  if ($zona === '') {
    http_response_code(400);
    echo json_encode(['error' => 'zona_invalida']);
    exit;
  }

  // Consulta SQL para filtrar por zona y rango de precios
  $sql = "SELECT id, nombre, descripcion, precio_noche, direccion,
                 calle, altura, localidad, codigo_postal, provincia, pais,
                 servicios, imagen_principal
          FROM alojamientos
          WHERE (provincia LIKE :zona1 OR localidad LIKE :zona2)
            AND CAST(precio_noche AS DECIMAL(10,2)) BETWEEN :min AND :max";
  $params = [
    ':zona1' => "%$zona%",
    ':zona2' => "%$zona%",
    ':min' => $min,
    ':max' => $max,
  ];

  $st = $pdo->prepare($sql);
  $st->execute($params);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}
