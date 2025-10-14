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

try {
    $stmt = $pdo->prepare("
        SELECT id, metodo_pago, numero_tarjeta, es_predeterminado, creado_at
        FROM metodos_pago
        WHERE usuario_id = ?
        ORDER BY es_predeterminado DESC, creado_at DESC
    ");
    
    $stmt->execute([$usuario_id]);
    $metodos = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'metodos' => $metodos]);
    
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error al obtener métodos de pago: ' . $e->getMessage()]);
}
?>

