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
$metodo_id = $data['id'] ?? 0;

if (empty($metodo_id)) {
    echo json_encode(['success' => false, 'message' => 'ID de método de pago no válido']);
    exit;
}

try {
    // Check if the payment method belongs to the user
    $stmt = $pdo->prepare("SELECT id FROM metodos_pago WHERE id = ? AND usuario_id = ?");
    $stmt->execute([$metodo_id, $usuario_id]);
    
    if (!$stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Método de pago no encontrado']);
        exit;
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Unset all default payment methods for this user
    $stmt = $pdo->prepare("UPDATE metodos_pago SET es_predeterminado = 0 WHERE usuario_id = ?");
    $stmt->execute([$usuario_id]);
    
    // Set the selected method as default
    $stmt = $pdo->prepare("UPDATE metodos_pago SET es_predeterminado = 1 WHERE id = ? AND usuario_id = ?");
    $stmt->execute([$metodo_id, $usuario_id]);
    
    $pdo->commit();
    
    echo json_encode(['success' => true, 'message' => 'Método de pago predeterminado actualizado']);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Error al actualizar método predeterminado: ' . $e->getMessage()]);
}
?>

