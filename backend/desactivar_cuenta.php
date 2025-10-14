<?php
// backend/desactivar_cuenta.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'message' => 'Método no permitido']); exit;
}

try {
  require __DIR__ . '/db.php';

  $in = json_decode(file_get_contents('php://input'), true);
  if (!$in) $in = $_POST;

  $usuarioId = isset($in['usuario_id']) ? (int)$in['usuario_id'] : 0;
  $motivo    = trim((string)($in['motivo']  ?? ''));
  $detalle   = trim((string)($in['detalle'] ?? ''));

  if ($usuarioId <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de usuario inválido']); exit;
  }

  // Seguridad: solo el propio usuario
  if (empty($_SESSION['user_id']) || (int)$_SESSION['user_id'] !== $usuarioId) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'No autorizado']); exit;
  }

  // Traer usuario
  $u = $pdo->prepare("SELECT id, email, estado FROM usuarios WHERE id = ? LIMIT 1");
  $u->execute([$usuarioId]);
  $usuario = $u->fetch(PDO::FETCH_ASSOC);
  if (!$usuario) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']); exit;
  }
  if ($usuario['estado'] === 'eliminado') {
    http_response_code(409);
    echo json_encode(['success' => false, 'message' => 'La cuenta está eliminada definitivamente']); exit;
  }
  if ($usuario['estado'] === 'desactivado') {
    echo json_encode(['success' => true, 'message' => 'La cuenta ya está desactivada']); exit;
  }

  // Verificar reservas futuras como HUÉSPED (NO cancelar automático)
  // Usa ambas vías: por usuario_id y por email, y estado distinto de cancelada
  $q = $pdo->prepare("
    SELECT r.id, r.fecha_inicio, r.fecha_fin, r.alojamiento_id
      FROM reservas r
     WHERE (r.usuario_id = :uid OR r.email = :email)
       AND r.fecha_inicio >= CURDATE()
       AND (r.estado IS NULL OR r.estado = 'activa')
     ORDER BY r.fecha_inicio ASC
  ");
  $q->execute([':uid' => $usuarioId, ':email' => $usuario['email']]);
  $reservasFuturas = $q->fetchAll(PDO::FETCH_ASSOC);

  if (!empty($reservasFuturas)) {
    http_response_code(409);
    echo json_encode([
      'success' => false,
      'code'    => 'reservas_pendientes',
      'count'   => count($reservasFuturas),
      'message' => 'Tenés reservas futuras como huésped. Debés cancelarlas en "Mis Reservas" antes de desactivar tu cuenta.'
    ]);
    exit;
  }

  // Si no hay reservas futuras → desactivar
  $pdo->beginTransaction();

  $upd = $pdo->prepare("
    UPDATE usuarios
       SET estado = 'desactivado',
           desactivado_at = NOW(),
           desactivado_motivo = :motivo,
           desactivado_detalle = :detalle
     WHERE id = :uid
  ");
  $upd->execute([':motivo' => $motivo, ':detalle' => $detalle, ':uid' => $usuarioId]);

  // Registro de auditoría
  $pdo->prepare("INSERT INTO usuario_desactivaciones (usuario_id, accion, motivo, detalle) VALUES (?, 'desactivar', ?, ?)")
      ->execute([$usuarioId, $motivo ?: null, $detalle ?: null]);

  // Ocultar publicaciones del usuario mientras esté desactivado
  $pdo->prepare("UPDATE alojamientos SET activo = 0 WHERE usuario_id = ?")->execute([$usuarioId]);

  $pdo->commit();

  // Cerrar sesión
  session_destroy();
  setcookie('logged_in', '', time() - 3600, '/');

  echo json_encode(['success' => true, 'message' => 'Cuenta desactivada. Podrás reactivarla cuando quieras.']);
} catch (Throwable $e) {
  if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
  error_log('desactivar_cuenta.php: '.$e->getMessage());
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => 'Error interno del servidor']);
}