<?php
require __DIR__ . '/db.php'; // conexión PDO
header('Content-Type: application/json');

$alojamientoId = $_GET['alojamiento_id'] ?? null;
$fechaInicio   = $_GET['fecha_inicio'] ?? null;

if (!$alojamientoId || !$fechaInicio) {
    echo json_encode(['error' => 'Datos incompletos']);
    exit;
}

// 1) Verificar si la fecha de inicio ya está ocupada (solo reservas activas)
$sqlOcupado = "SELECT 1 
               FROM reservas
               WHERE alojamiento_id = :alojamiento_id
                 AND estado = 'activa'
                 AND :fecha_inicio BETWEEN fecha_inicio AND fecha_fin
               LIMIT 1";
$stmt = $pdo->prepare($sqlOcupado);
$stmt->execute([
    ':alojamiento_id' => $alojamientoId,
    ':fecha_inicio'   => $fechaInicio
]);
$ocupado = $stmt->fetch();

if ($ocupado) {
    echo json_encode([
        'disponible' => false,
        'motivo'     => 'fecha_inicio_ocupada',
        'max_fecha'  => null
    ]);
    exit;
}

// 2) Buscar la primera reserva activa posterior a la fecha de inicio
$sqlProxima = "SELECT fecha_inicio 
               FROM reservas
               WHERE alojamiento_id = :alojamiento_id
                 AND estado = 'activa'
                 AND fecha_inicio >= :fecha_inicio
               ORDER BY fecha_inicio ASC
               LIMIT 1";
$stmt = $pdo->prepare($sqlProxima);
$stmt->execute([
    ':alojamiento_id' => $alojamientoId,
    ':fecha_inicio'   => $fechaInicio
]);
$reserva = $stmt->fetch(PDO::FETCH_ASSOC);

if ($reserva) {
    $maxDisponible = date('Y-m-d', strtotime($reserva['fecha_inicio'] . ' -1 day'));
    echo json_encode([
        'disponible' => true,
        'max_fecha'  => $maxDisponible
    ]);
} else {
    // No hay reservas activas posteriores → se puede reservar libremente
    echo json_encode([
        'disponible' => true,
        'max_fecha'  => null
    ]);
}
