<?php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

$usuario_id = $_SESSION['user_id'];

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);
$metodo_pago = $data['metodo_pago'] ?? '';
$numero_tarjeta = $data['numero_tarjeta'] ?? '';

// Validate input
if (empty($metodo_pago) || empty($numero_tarjeta)) {
    echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios']);
    exit;
}

// Validate card number length
if (strlen($numero_tarjeta) != 16) {
    echo json_encode(['success' => false, 'message' => 'El número de tarjeta debe tener 16 dígitos']);
    exit;
}

try {
    // Check if user already has 3 payment methods
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM metodos_pago WHERE usuario_id = ?");
    $stmt->execute([$usuario_id]);
    $count = $stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    if ($count >= 3) {
        echo json_encode(['success' => false, 'message' => 'Ya tienes el máximo de 3 métodos de pago guardados']);
        exit;
    }
    
    // If this is the first payment method, make it default
    $es_predeterminado = ($count == 0) ? 1 : 0;
    
    // Insert new payment method
    $stmt = $pdo->prepare("
        INSERT INTO metodos_pago (usuario_id, metodo_pago, numero_tarjeta, es_predeterminado)
        VALUES (?, ?, ?, ?)
    ");
    
    $stmt->execute([$usuario_id, $metodo_pago, $numero_tarjeta, $es_predeterminado]);
    
    echo json_encode(['success' => true, 'message' => 'Método de pago agregado correctamente']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al agregar método de pago: ' . $e->getMessage()]);
}
?>

