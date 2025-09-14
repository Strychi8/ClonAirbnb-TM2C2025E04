<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';

  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO (revise db.php).');
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
  }

  // Permitir JSON o formulario clásico
  $raw = file_get_contents('php://input');
  $asJson = json_decode($raw, true);

  $src = is_array($asJson) ? $asJson : $_POST;

  $nombre       = trim((string)($src['nombre'] ?? ''));
  $precioRaw    = (string)($src['precio'] ?? '');
  $descripcion  = trim((string)($src['descripcion'] ?? ''));
  $calle        = trim((string)($src['calle'] ?? ''));
  $altura       = trim((string)($src['altura'] ?? ''));
  $localidad    = trim((string)($src['localidad'] ?? ''));
  $codigoPostal = trim((string)($src['codigoPostal'] ?? ''));
  $provincia    = trim((string)($src['provincia'] ?? ''));
  $pais         = trim((string)($src['pais'] ?? ''));
  $serviciosArr = $src['servicios'] ?? [];

  if (!is_array($serviciosArr)) {
    $serviciosArr = [];
  }

  // Normalizo precio: extrae números y punto/coma
  $precioNum = 0.0;
  if ($precioRaw !== '') {
    $precioSan = str_replace(['$', ' ', ','], ['', '', '.'], $precioRaw);
    $precioNum = (float)$precioSan;
  }

  $errores = [];
  if ($nombre === '') $errores[] = 'nombre_requerido';
  if ($precioNum <= 0) $errores[] = 'precio_invalido';

  if (!empty($errores)) {
    http_response_code(400);
    echo json_encode(['error' => 'validation_error', 'details' => $errores], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // Derivar campos según schema.sql
  $precio_noche = $precioNum;
  $direccion = trim($calle . ' ' . $altura . ', ' . $localidad . ' ' . $codigoPostal . ', ' . $provincia . ', ' . $pais);
  $servicios = json_encode(array_values(array_unique($serviciosArr)), JSON_UNESCAPED_UNICODE);

  $sql = "INSERT INTO alojamientos (nombre, ubicacion, descripcion, precio_noche, direccion, servicios, imagen_principal)
          VALUES (:nombre, :ubicacion, :descripcion, :precio_noche, :direccion, :servicios, :imagen_principal)";
  $stmt = $pdo->prepare($sql);
  $stmt->execute([
    ':nombre'           => $nombre,
    ':ubicacion'        => $localidad, // o provincia/pais si lo prefieren
    ':descripcion'      => $descripcion,
    ':precio_noche'     => $precio_noche,
    ':direccion'        => $direccion,
    ':servicios'        => $servicios,
    ':imagen_principal' => null,
  ]);

  $id = (int)$pdo->lastInsertId();
  echo json_encode(['ok' => true, 'id' => $id], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode([
    'error' => 'server_error',
    'message' => $e->getMessage(),
  ], JSON_UNESCAPED_UNICODE);
}


