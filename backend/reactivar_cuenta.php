<?php
// backend/reactivar_cuenta.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success'=>false,'message'=>'Método no permitido']); exit;
}

require __DIR__ . '/db.php';

try {
  $in = $_POST;
  if (!$in || !isset($in['email'])) {
    $in = json_decode(file_get_contents('php://input'), true) ?: [];
  }

  // Si hay sesión y no vinieron credenciales, usarla
  if (!empty($_SESSION['user_id']) && empty($in['email']) && empty($in['password'])) {
    $uid = (int)$_SESSION['user_id'];
    $stmt = $pdo->prepare("SELECT id, nombre, email, estado FROM usuarios WHERE id=? LIMIT 1");
    $stmt->execute([$uid]);
    $u = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$u) { throw new RuntimeException('Usuario no encontrado'); }
    if ($u['estado'] === 'eliminado') { http_response_code(409); echo json_encode(['success'=>false,'message'=>'La cuenta fue eliminada']); exit; }
    if ($u['estado'] === 'activo') {
      // bandera para el login
      $_SESSION['logged_in'] = true; 
      setcookie('logged_in', 'true', [
        'expires'  => 0,
        'path'     => '/',            
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => false,
        'samesite' => 'Lax',
      ]);                             
      echo json_encode(['success'=>true,'message'=>'La cuenta ya está activa']); exit;
    }

    $pdo->beginTransaction();
    $pdo->prepare("UPDATE usuarios SET estado='activo', desactivado_at=NULL, desactivado_motivo=NULL, desactivado_detalle=NULL WHERE id=?")->execute([$uid]);
    $pdo->prepare("INSERT INTO usuario_desactivaciones (usuario_id, accion) VALUES (?, 'reactivar')")->execute([$uid]);
    $pdo->commit();

    // asegurar datos de sesión + bandera
    $_SESSION['user_id']    = (int)$u['id'];      
    $_SESSION['user_name']  = $u['nombre'];       
    $_SESSION['user_email'] = $u['email'];        
    $_SESSION['logged_in']  = true;               
    setcookie('logged_in', 'true', [
      'expires'  => 0,
      'path'     => '/',                        
      'secure'   => !empty($_SERVER['HTTPS']),
      'httponly' => false,
      'samesite' => 'Lax',
    ]);                                         

    echo json_encode(['success'=>true,'message'=>'Cuenta reactivada']); exit;
  }

  // Sin sesión: reactivar con credenciales
  $email = trim((string)($in['email'] ?? ''));
  $pass  = (string)($in['password'] ?? '');
  if ($email === '' || $pass === '') {
    http_response_code(400);
    echo json_encode(['success'=>false,'message'=>'Se requieren email y contraseña']); exit;
  }

  $stmt = $pdo->prepare("SELECT id, nombre, email, contrasenia, estado FROM usuarios WHERE email=? LIMIT 1");
  $stmt->execute([$email]);
  $u = $stmt->fetch(PDO::FETCH_ASSOC);

  if (!$u || !password_verify($pass, $u['contrasenia'])) {
    http_response_code(401);
    echo json_encode(['success'=>false,'message'=>'Credenciales inválidas']); exit;
  }
  if ($u['estado'] === 'eliminado') {
    http_response_code(409);
    echo json_encode(['success'=>false,'message'=>'La cuenta fue eliminada y no puede reactivarse.']); exit;
  }
  if ($u['estado'] === 'activo') {
    // ya está activa: crear sesión y devolver OK
    session_regenerate_id(true);
    $_SESSION['user_id']    = (int)$u['id'];
    $_SESSION['user_name']  = $u['nombre'];
    $_SESSION['user_email'] = $u['email'];
    $_SESSION['logged_in']  = true;               
    setcookie('logged_in', 'true', [
      'expires'  => 0,
      'path'     => '/',                         
      'secure'   => !empty($_SERVER['HTTPS']),
      'httponly' => false,
      'samesite' => 'Lax',
    ]);                                           
    echo json_encode(['success'=>true,'message'=>'Cuenta ya activa']); exit;
  }

  $pdo->beginTransaction();
  $pdo->prepare("UPDATE usuarios SET estado='activo', desactivado_at=NULL, desactivado_motivo=NULL, desactivado_detalle=NULL WHERE id=?")
      ->execute([(int)$u['id']]);
  $pdo->prepare("INSERT INTO usuario_desactivaciones (usuario_id, accion) VALUES (?, 'reactivar')")
      ->execute([(int)$u['id']]);
  $pdo->commit();

  // crear sesión para entrar directo
  session_regenerate_id(true);
  $_SESSION['user_id']    = (int)$u['id'];
  $_SESSION['user_name']  = $u['nombre'];
  $_SESSION['user_email'] = $u['email'];
  $_SESSION['logged_in']  = true;                 
  setcookie('logged_in', 'true', [
    'expires'  => 0,
    'path'     => '/',                            
    'secure'   => !empty($_SERVER['HTTPS']),
    'httponly' => false,
    'samesite' => 'Lax',
  ]);                                             

  echo json_encode(['success'=>true,'message'=>'Cuenta reactivada']);
} catch (Throwable $e) {
  if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
  error_log('reactivar_cuenta.php: '.$e->getMessage());
  http_response_code(500);
  echo json_encode(['success'=>false,'message'=>'Error interno del servidor']);
}