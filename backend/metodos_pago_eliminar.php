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
    $stmt = $pdo->prepare("SELECT es_predeterminado FROM metodos_pago WHERE id = ? AND usuario_id = ?");
    $stmt->execute([$metodo_id, $usuario_id]);
    $metodo = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$metodo) {
        echo json_encode(['success' => false, 'message' => 'Método de pago no encontrado']);
        exit;
    }
    
    $era_predeterminado = $metodo['es_predeterminado'];
    
    // Delete the payment method
    $stmt = $pdo->prepare("DELETE FROM metodos_pago WHERE id = ? AND usuario_id = ?");
    $stmt->execute([$metodo_id, $usuario_id]);
    
    // If the deleted method was default, make another one default
    if ($era_predeterminado) {
        $stmt = $pdo->prepare("
            UPDATE metodos_pago 
            SET es_predeterminado = 1 
            WHERE usuario_id = ? 
            ORDER BY creado_at DESC 
            LIMIT 1
        ");
        $stmt->execute([$usuario_id]);
    }
    
    echo json_encode(['success' => true, 'message' => 'Método de pago eliminado correctamente']);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al eliminar método de pago: ' . $e->getMessage()]);
}
?>

