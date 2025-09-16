<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO');
  }

  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'method_not_allowed']);
    exit;
  }

  $id = (int)($_POST['id'] ?? 0);
  $usuarioId = (int)($_POST['usuario_id'] ?? 0);
  
  if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'id_invalido']);
    exit;
  }
  
  if ($usuarioId <= 0) {
    http_response_code(400);
    echo json_encode(['error' => 'usuario_id_requerido']);
    exit;
  }
  
  // Verificar que el alojamiento pertenece al usuario
  $checkSql = "SELECT id FROM alojamientos WHERE id = :id AND usuario_id = :usuario_id";
  $checkStmt = $pdo->prepare($checkSql);
  $checkStmt->execute([':id' => $id, ':usuario_id' => $usuarioId]);
  
  if (!$checkStmt->fetch()) {
    http_response_code(403);
    echo json_encode(['error' => 'no_autorizado', 'message' => 'No tienes permisos para editar este alojamiento']);
    exit;
  }

  $nombre       = trim((string)($_POST['nombre'] ?? ''));
  $precioNum    = (float)($_POST['precio'] ?? 0);
  $descripcion  = trim((string)($_POST['descripcion'] ?? ''));
  $calle        = trim((string)($_POST['calle'] ?? ''));
  $altura       = trim((string)($_POST['altura'] ?? ''));
  $localidad    = trim((string)($_POST['localidad'] ?? ''));
  $codigoPostal = trim((string)($_POST['codigoPostal'] ?? ''));
  $provincia    = trim((string)($_POST['provincia'] ?? ''));
  $pais         = trim((string)($_POST['pais'] ?? ''));
  $serviciosArr = $_POST['servicios'] ?? $_POST['servicios'] ?? [];
  if (!is_array($serviciosArr)) $serviciosArr = [];

  $errores = [];
  if ($nombre === '') $errores[] = 'nombre_requerido';
  if ($precioNum <= 0) $errores[] = 'precio_invalido';
  if (!empty($errores)) {
    http_response_code(400);
    echo json_encode(['error' => 'validation_error', 'details' => $errores]);
    exit;
  }

  $precio_noche = $precioNum;
  $direccion = trim($calle . ' ' . $altura . ', ' . $localidad . ' ' . $codigoPostal . ', ' . $provincia . ', ' . $pais);
  $servicios = json_encode(array_values(array_unique($serviciosArr)), JSON_UNESCAPED_UNICODE);

  // Imagen opcional
  $imagenSet = '';
  $params = [
    ':id'              => $id,
    ':nombre'          => $nombre,
    ':descripcion'     => $descripcion,
    ':precio_noche'    => $precio_noche,
    ':direccion'       => $direccion,
    ':servicios'       => $servicios,
  ];

  if (isset($_FILES['imagen']) && is_uploaded_file($_FILES['imagen']['tmp_name'])) {
    $uploadsDir = __DIR__ . '/../uploads';
    if (!is_dir($uploadsDir)) @mkdir($uploadsDir, 0775, true);
    $ext = pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION);
    $safeName = 'aloj_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . ($ext ? ('.' . strtolower($ext)) : '');
    $dest = $uploadsDir . '/' . $safeName;
    if (move_uploaded_file($_FILES['imagen']['tmp_name'], $dest)) {
      $params[':imagen_principal'] = 'uploads/' . $safeName;
      $imagenSet = ', imagen_principal = :imagen_principal';
    }
  }

  $sql = "UPDATE alojamientos
          SET nombre = :nombre,
              descripcion = :descripcion,
              precio_noche = :precio_noche,
              direccion = :direccion,
              calle = :calle,
              altura = :altura,
              localidad = :localidad,
              codigo_postal = :codigo_postal,
              provincia = :provincia,
              pais = :pais,
              servicios = :servicios
              $imagenSet
          WHERE id = :id";

  $params[':calle'] = $calle;
  $params[':altura'] = $altura;
  $params[':localidad'] = $localidad;
  $params[':codigo_postal'] = $codigoPostal;
  $params[':provincia'] = $provincia;
  $params[':pais'] = $pais;

  $st = $pdo->prepare($sql);
  $st->execute($params);

  echo json_encode(['ok' => true, 'id' => $id]);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['error' => 'server_error', 'message' => $e->getMessage()]);
}


