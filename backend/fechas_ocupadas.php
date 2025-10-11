<?php
require __DIR__ . '/db.php';
header('Content-Type: application/json');

$alojamientoId = $_GET['alojamiento_id'] ?? null;
if (!$alojamientoId) {
    echo json_encode([]);
    exit;
}

// Trae solo reservas activas
$sql = "SELECT fecha_inicio, fecha_fin 
        FROM reservas 
        WHERE alojamiento_id = :aid 
          AND estado = 'activa'"; // <-- solo activas
$stmt = $pdo->prepare($sql);
$stmt->execute([':aid' => $alojamientoId]);
$reservas = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Generar array con cada día ocupado
$dias_ocupados = [];
foreach($reservas as $r) {
    $inicio = new DateTime($r['fecha_inicio']);
    $fin = new DateTime($r['fecha_fin']);
    while($inicio <= $fin) {
        $dias_ocupados[] = $inicio->format('Y-m-d');
        $inicio->modify('+1 day');
    }
}

echo json_encode($dias_ocupados);
