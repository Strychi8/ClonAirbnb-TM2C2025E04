<?php
// URL: http://localhost/clon-Airbnb/Alquileres-y-alojamientos-/backend/filtrar_servicios.php?servicios=TV,Lavanderia&min=0&max=150000
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO');
  }

  $servicios = isset($_GET['servicios']) ? trim($_GET['servicios']) : '';
  $min = isset($_GET['min']) ? (int)$_GET['min'] : 0;
  $max = isset($_GET['max']) ? (int)$_GET['max'] : 150000;

  if ($min > $max || $min < 0 || $max < 0) {
    http_response_code(400);
    echo json_encode(['error' => 'rango_invalido']);
    exit;
  }

  if ($servicios === '') {
    http_response_code(400);
    echo json_encode(['error' => 'servicios_invalidos']);
    exit;
  }

  // Procesar servicios como array
  $serviciosArray = array_map('trim', explode(',', $servicios));
  $whereServicios = [];
  $params = [
    ':min' => $min,
    ':max' => $max,
  ];

  foreach ($serviciosArray as $i => $servicio) {
    $key = ":servicio$i";
    // Usar JSON_CONTAINS para buscar en el array JSON
    $whereServicios[] = "JSON_CONTAINS(servicios, $key)";
    $params[$key] = json_encode($servicio);
  }

  $whereServiciosSql = implode(' AND ', $whereServicios);

  $sql = "SELECT id, nombre, descripcion, precio_noche, direccion,
                 calle, altura, localidad, codigo_postal, provincia, pais,
                 servicios, imagen_principal
          FROM alojamientos
          WHERE ($whereServiciosSql)
            AND precio_noche BETWEEN :min AND :max";

  $st = $pdo->prepare($sql);
  $st->execute($params);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}