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

    // Tomar datos desde multipart/form-data (con archivo) o JSON
    $src = $_POST;
    if (empty($src)) {
        $raw = file_get_contents('php://input');
        $asJson = json_decode($raw, true);
        if (is_array($asJson)) $src = $asJson;
    }

    $usuarioId        = (int)($src['usuario_id'] ?? 0);
    $nombre           = trim((string)($src['nombre'] ?? ''));
    $precioRaw        = (string)($src['precio'] ?? '');
    $descripcion      = trim((string)($src['descripcion'] ?? ''));
    $calle            = trim((string)($src['calle'] ?? ''));
    $altura           = trim((string)($src['altura'] ?? ''));
    $localidad        = trim((string)($src['localidad'] ?? ''));
    $codigoPostal     = trim((string)($src['codigoPostal'] ?? ''));
    $provincia        = trim((string)($src['provincia'] ?? ''));
    $pais             = trim((string)($src['pais'] ?? ''));
    $tipoAlojamiento  = trim((string)($src['tipo_alojamiento'] ?? ''));
    $serviciosArr     = $src['servicios'] ?? [];

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
    if ($usuarioId <= 0) $errores[] = 'usuario_id_requerido';
    if ($nombre === '') $errores[] = 'nombre_requerido';
    if ($precioNum <= 0) $errores[] = 'precio_invalido';
    if ($tipoAlojamiento === '') $errores[] = 'tipo_alojamiento_requerido';

    if (!empty($errores)) {
        http_response_code(400);
        echo json_encode(['error' => 'validation_error', 'details' => $errores], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Derivar campos según schema.sql
    $precio_noche = $precioNum;
    $direccion = trim($calle . ' ' . $altura . ', ' . $localidad . ' ' . $codigoPostal . ', ' . $provincia . ', ' . $pais);
    $servicios = json_encode(array_values(array_unique($serviciosArr)), JSON_UNESCAPED_UNICODE);

    // Manejo simple de imagen (opcional)
    $imagenPath = null;
    if (isset($_FILES['imagen']) && is_uploaded_file($_FILES['imagen']['tmp_name'])) {
        $uploadsDir = __DIR__ . '/../uploads';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0775, true);
        }
        $ext = pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION);
        $safeName = 'aloj_' . date('Ymd_His') . '_' . bin2hex(random_bytes(4)) . ($ext ? ('.' . strtolower($ext)) : '');
        $dest = $uploadsDir . '/' . $safeName;
        if (move_uploaded_file($_FILES['imagen']['tmp_name'], $dest)) {
            // Ruta relativa para guardar en DB
            $imagenPath = 'uploads/' . $safeName;
        }
    }

    $sql = "INSERT INTO alojamientos (
                usuario_id, nombre, descripcion, precio_noche, direccion,
                calle, altura, localidad, codigo_postal, provincia, pais,
                tipo_alojamiento, servicios, imagen_principal
            )
            VALUES (
                :usuario_id, :nombre, :descripcion, :precio_noche, :direccion,
                :calle, :altura, :localidad, :codigo_postal, :provincia, :pais,
                :tipo_alojamiento, :servicios, :imagen_principal
            )";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':usuario_id'       => $usuarioId,
        ':nombre'           => $nombre,
        ':descripcion'      => $descripcion,
        ':precio_noche'     => $precio_noche,
        ':direccion'        => $direccion,
        ':calle'            => $calle,
        ':altura'           => $altura,
        ':localidad'        => $localidad,
        ':codigo_postal'    => $codigoPostal,
        ':provincia'        => $provincia,
        ':pais'             => $pais,
        ':tipo_alojamiento' => $tipoAlojamiento,
        ':servicios'        => $servicios,
        ':imagen_principal' => $imagenPath,
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
