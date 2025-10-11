<?php
declare(strict_types=1);

// Seguridad básica
ini_set('default_charset', 'UTF-8');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

// Start session to check authentication
session_start();

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    // Store the current URL to redirect back after login
    $current_url = $_SERVER['REQUEST_URI'];
    $_SESSION['redirect_after_login'] = $current_url;
    
    http_response_code(401);
    echo "<h2>Acceso requerido</h2><p>Debe iniciar sesión para realizar una reserva.</p>";
    echo '<p><a href="../autenticacion/signin.html">Iniciar Sesión</a> | <a href="../autenticacion/signup.html">Registrarse</a></p>';
    exit;
}

try {
    require_once __DIR__ . '/db.php';

    if (!isset($pdo) || !($pdo instanceof PDO)) {
        throw new RuntimeException('No hay conexión PDO disponible. Revise db.php.');
    }
} catch (Throwable $e) {
    http_response_code(500);
    echo "<h2>Error de conexión</h2><pre>{$e->getMessage()}</pre>";
    exit;
}

// Metodo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo "Método no permitido";
    exit;
}

// Tomamos y validamos inputs
$alojamiento_id   = (int)($_POST['alojamiento_id'] ?? 0);
$nombre           = trim((string)($_POST['nombre'] ?? ''));
$apellido         = trim((string)($_POST['apellido'] ?? ''));
$email            = trim((string)($_POST['email'] ?? ''));
$telefono         = preg_replace('/\D+/', '', (string)($_POST['telefono'] ?? ''));
$fechaInicio      = (string)($_POST['fechaInicio'] ?? '');
$fechaFin         = (string)($_POST['fechaFin'] ?? '');
$cantPersonas     = (int)($_POST['cantidadPersonas'] ?? 1);
$precioNocheNum   = (float)($_POST['precio_noche'] ?? 0);
$precioTotalNum   = (float)($_POST['precio_total'] ?? 0);
$metodoPago       = trim((string)($_POST['metodo_pago'] ?? ''));

// Por seguridad no guardamos tarjetas completas.
$numeroTarjetaRaw = (string)($_POST['numeroTarjeta'] ?? ''); // NO se guarda

// Validaciones mínimas
$errores = [];
if ($alojamiento_id <= 0)          $errores[] = "Alojamiento inválido.";
if ($nombre === '')                 $errores[] = "Nombre requerido.";
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errores[] = "Email inválido.";
if ($telefono === '' || strlen($telefono) < 10) $errores[] = "Teléfono inválido.";
if ($cantPersonas < 1)              $errores[] = "Cantidad de personas inválida.";
if ($metodoPago === '')             $errores[] = "Debe seleccionar método de pago.";

// Guardamos Fechas
$fi = DateTime::createFromFormat('Y-m-d', $fechaInicio) ?: false;
$ff = DateTime::createFromFormat('Y-m-d', $fechaFin)    ?: false;
if (!$fi || !$ff) {
    $errores[] = "Fechas inválidas.";
} else {
    if ($ff < $fi) {
        $errores[] = "La fecha fin no puede ser anterior al inicio.";
    }
}

// Confirmar precio_noche desde DB
try {
    $stmt = $pdo->prepare("SELECT precio_noche, activo, usuario_id FROM alojamientos WHERE id = :id");
    $stmt->execute([':id' => $alojamiento_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        $errores[] = "El alojamiento no existe.";
    } else {
        if (isset($row['activo']) && !$row['activo']) {
            $errores[] = "Este alojamiento está actualmente deshabilitado y no puede ser reservado.";
        } elseif (isset($_SESSION['user_id']) && (int)$row['usuario_id'] === (int)$_SESSION['user_id']) {
            $errores[] = "No puedes reservar tu propio alojamiento.";
        } else {
            $precioOficial = (float)$row['precio_noche'];
        }
    }
} catch (Throwable $e) {
    $errores[] = "Error consultando el alojamiento.";
}

if (!empty($errores)) {
    http_response_code(400);
    echo "<h2>Error en la reserva</h2><ul><li>" . implode("</li><li>", array_map('htmlspecialchars', $errores)) . "</li></ul>";
    echo '<p><a href="../reservas/reserva.html">Volver</a></p>';
    exit;
}

// Recalculamos el total
$diffDays = (int)$fi->diff($ff)->format('%a') + 1; // inclusivo
$precioCalculado = $precioOficial;
$totalCalculado  = $diffDays * $precioCalculado * max(1, $cantPersonas);

try {
    $pdo->beginTransaction();

    // ✅ Verificar si hay reservas activas que se solapen
    $stmtCheck = $pdo->prepare("
        SELECT COUNT(*) 
        FROM reservas 
        WHERE alojamiento_id = :alojamiento_id
          AND estado = 'activa'
          AND fecha_inicio <= :fechaFin
          AND fecha_fin >= :fechaInicio
    ");
    $stmtCheck->execute([
        ':alojamiento_id' => $alojamiento_id,
        ':fechaInicio' => $fi->format('Y-m-d'),
        ':fechaFin' => $ff->format('Y-m-d')
    ]);
    $overlapping = (int)$stmtCheck->fetchColumn();
    if ($overlapping > 0) {
        http_response_code(400);
        echo "<h2>Fechas ocupadas</h2><p>Ya existe una reserva activa en esas fechas.</p>";
        echo '<p><a href="../reservas/reserva.html">Volver</a></p>';
        exit;
    }

    // Insertar reserva
    $sql = "INSERT INTO reservas 
        (alojamiento_id, usuario_id, nombre, apellido, email, telefono, fecha_inicio, fecha_fin, cantidad_personas, precio_noche, precio_total, metodo_pago, estado)
        VALUES
        (:aloj, :usuario_id, :nom, :ape, :email, :tel, :fi, :ff, :cant, :precio_noche, :precio_total, :metodo, 'activa')";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':aloj'         => $alojamiento_id,
        ':usuario_id'   => $_SESSION['user_id'],
        ':nom'          => $nombre,
        ':ape'          => $apellido,
        ':email'        => $email,
        ':tel'          => $telefono,
        ':fi'           => $fi->format('Y-m-d'),
        ':ff'           => $ff->format('Y-m-d'),
        ':cant'         => $cantPersonas,
        ':precio_noche' => $precioCalculado,
        ':precio_total' => $totalCalculado,
        ':metodo'       => $metodoPago,
    ]);

    $reserva_id = $pdo->lastInsertId();
    $pdo->commit();

    // Enviar email al dueño del alojamiento
    try {
        require_once __DIR__ . '/email_service.php';
        $stmt = $pdo->prepare("
            SELECT u.nombre, u.email, a.nombre as alojamiento_nombre 
            FROM usuarios u 
            INNER JOIN alojamientos a ON u.id = a.usuario_id 
            WHERE a.id = :alojamiento_id
        ");
        $stmt->execute([':alojamiento_id' => $alojamiento_id]);
        $ownerData = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($ownerData) {
            $emailService = new EmailService();
            $reservationData = [
                'nombre' => $nombre,
                'apellido' => $apellido,
                'email' => $email,
                'telefono' => $telefono,
                'fecha_inicio' => $fi->format('Y-m-d'),
                'fecha_fin' => $ff->format('Y-m-d'),
                'cantidad_personas' => $cantPersonas,
                'precio_noche' => $precioCalculado,
                'precio_total' => $totalCalculado,
                'metodo_pago' => $metodoPago,
                'fecha_reserva' => date('Y-m-d H:i:s'),
                'alojamiento_nombre' => $ownerData['alojamiento_nombre']
            ];
            $emailService->sendNewReservationNotification($reservationData, $ownerData);
        }
    } catch (Exception $e) {
        error_log("Email notification error: " . $e->getMessage());
    }

    header("Location: ../reservas/comprobante.html?id={$reserva_id}", true, 303);
    exit;

} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    echo "<h2>No se pudo registrar la reserva</h2><pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
    echo '<p><a href="../reservas/reserva.html">Volver</a></p>';
    exit;
}
