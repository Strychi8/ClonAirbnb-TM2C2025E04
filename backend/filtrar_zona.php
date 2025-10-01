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

  // Divide la zona en palabras
  $palabras = preg_split('/\s+/', $zona);
  $where = [];
  $params = [
    ':min' => $min,
    ':max' => $max,
  ];

  $i = 0;
  foreach ($palabras as $palabra) {
    $keyPais = ":zona_pais_$i";
    $keyProv = ":zona_provincia_$i";
    $keyLoc = ":zona_localidad_$i";
    $where[] = "pais LIKE $keyPais OR provincia LIKE $keyProv OR localidad LIKE $keyLoc";
    $params[$keyPais] = "%$palabra%";
    $params[$keyProv] = "%$palabra%";
    $params[$keyLoc] = "%$palabra%";
    $i++;
  }

  $whereSql = implode(' AND ', $where);

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
