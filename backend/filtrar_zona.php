<?php
// http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/filtrar_zona.php?zona=Buenos-Aires&pais=Argentina&min=0&max=150000
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

  $params = [
    ':min' => $min,
    ':max' => $max,
    ':zona_pais' => "%$zona%",
    ':zona_provincia' => "%$zona%", 
    ':zona_localidad' => "%$zona%"
  ];

  // Buscar la zona completa en cualquiera de los tres campos
  $whereSql = "(
    LOWER(TRIM(pais)) LIKE LOWER(:zona_pais) OR 
    LOWER(TRIM(provincia)) LIKE LOWER(:zona_provincia) OR
    LOWER(TRIM(localidad)) LIKE LOWER(:zona_localidad)
  )";

  // Consulta SQL para filtrar por zona (buscar el texto en cualquiera de los tres campos) y rango de precios
  $sql = "SELECT id, nombre, descripcion, precio_noche, direccion,
                 calle, altura, localidad, codigo_postal, provincia, pais,
                 servicios, imagen_principal
          FROM alojamientos
          WHERE ($whereSql)
            AND CAST(precio_noche AS DECIMAL(10,2)) BETWEEN :min AND :max";

  $st = $pdo->prepare($sql);
  $st->execute($params);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}
