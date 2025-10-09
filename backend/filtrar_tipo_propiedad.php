<?php
// URL ejemplo: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/filtrar_tipo_propiedad.php?tipo_propiedad=Departamento,Casa&min=0&max=150000
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO');
  }

  $tipo_propiedad = isset($_GET['tipo_propiedad']) ? trim($_GET['tipo_propiedad']) : '';
  $min = isset($_GET['min']) ? (int)$_GET['min'] : 0;
  $max = isset($_GET['max']) ? (int)$_GET['max'] : 150000;

  if ($min > $max || $min < 0 || $max < 0) {
    http_response_code(400);
    echo json_encode(['error' => 'rango_invalido']);
    exit;
  }

  if ($tipo_propiedad === '') {
    http_response_code(400);
    echo json_encode(['error' => 'tipo_invalido']);
    exit;
  }

  $where = [];
  $params = [
    ':min' => $min,
    ':max' => $max,
  ];

  // Filtro por tipo de propiedad (permite múltiples tipos separados por coma)
  $tipos = array_map('trim', explode(',', $tipo_propiedad));
  $tipoWhere = [];
  foreach ($tipos as $i => $tipo) {
    $key = ":tipo$i";
    $tipoWhere[] = "tipo_alojamiento LIKE $key";
    $params[$key] = "%$tipo%";
  }
  $where[] = '(' . implode(' OR ', $tipoWhere) . ')';

  $whereSql = implode(' AND ', $where);

  $sql = "SELECT id, nombre, descripcion, precio_noche, direccion,
                 calle, altura, localidad, codigo_postal, provincia, pais,
                 servicios, tipo_alojamiento, imagen_principal
          FROM alojamientos
          WHERE $whereSql
            AND precio_noche BETWEEN :min AND :max";

  $st = $pdo->prepare($sql);
  $st->execute($params);
  $rows = $st->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}