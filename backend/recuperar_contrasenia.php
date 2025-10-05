<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/recuperar_contrasenia.php
declare(strict_types=1);
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido. Use POST']);
    exit;
}

try {
    require __DIR__ . '/db.php';
    require __DIR__ . '/email_service.php';
    
    // Leer datos JSON del cuerpo de la petición
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new InvalidArgumentException('Datos JSON inválidos');
    }
    
    $email = trim($input['email'] ?? '');
    
    // Validaciones
    if (empty($email)) {
        throw new InvalidArgumentException('El email es requerido');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new InvalidArgumentException('Email inválido');
    }
    
    // Verificar que el usuario existe
    $stmt = $pdo->prepare('SELECT id, nombre, email FROM usuarios WHERE email = ?');
    $stmt->execute([$email]);
    $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario) {
        // Por seguridad, siempre responder con éxito aunque el email no exista
        echo json_encode([
            'success' => true, 
            'message' => 'Si el email está registrado, recibirás un enlace de recuperación'
        ]);
        exit;
    }
    
    
    // Generar token de recuperación
    $token = bin2hex(random_bytes(32));
    $expiracion = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token válido por 1 hora
    
    // Guardar token en la base de datos
    $stmt = $pdo->prepare('
        INSERT INTO password_reset_tokens (usuario_id, token, expiracion) 
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE token = VALUES(token), expiracion = VALUES(expiracion)
    ');
    $stmt->execute([$usuario['id'], $token, $expiracion]);
    
    // Construir enlace de recuperación dinámico
    $protocolo = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'
                  || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST']; // localhost, 127.0.0.1 o dominio real
    $base = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/\\'); // carpeta /backend
    
    // Ir un nivel arriba para apuntar a /autenticacion/
    $enlaceRecuperacion = $protocolo . $host . $base . "/../autenticacion/restablecer_contrasenia.html?token=" . $token;
    
    
    $asunto = "Recuperación de contraseña - Erbienbi";
    $mensaje = "
    <html>
    <head>
        <title>Recuperación de contraseña</title>
    </head>
    <body>
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #e0b84c;'>Recuperación de contraseña</h2>
            <p>Hola {$usuario['nombre']},</p>
            <p>Has solicitado restablecer tu contraseña en Erbienbi.</p>
            <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
            <p style='margin: 20px 0;'>
                <a href='{$enlaceRecuperacion}' 
                   style='background: linear-gradient(135deg, #e0b84c, #c49a3a); 
                          color: white; 
                          padding: 12px 24px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          display: inline-block;'>
                    Restablecer contraseña
                </a>
            </p>
            <p><strong>Este enlace es válido por 1 hora.</strong></p>
            <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
            <hr style='margin: 30px 0; border: none; border-top: 1px solid #eee;'>
            <p style='color: #666; font-size: 14px;'>
                Este es un email automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </body>
    </html>
    ";
    
    // Crear instancia del servicio de email y enviar
    $emailService = new EmailService();
    $emailEnviado = $emailService->sendEmail($email, $usuario['nombre'], $asunto, $mensaje);
    
    if ($emailEnviado) {
        echo json_encode([
            'success' => true, 
            'message' => 'Si el email está registrado, recibirás un enlace de recuperación'
        ]);
    } else {
        throw new RuntimeException('Error al enviar el email de recuperación');
    }
    
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log('Error en recuperar_contrasenia.php: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error interno del servidor'
    ]);
}
?>
