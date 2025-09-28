<?php
// URL: http://localhost/clon-Airbnb/Alquileres-y-alojamientos-/backend/ubicacion_maps.php?id=6
declare(strict_types=1);
header('Content-Type: text/html; charset=utf-8');

try {
  require __DIR__ . '/db.php';
  if (!isset($pdo) || !($pdo instanceof PDO)) {
    throw new RuntimeException('No hay conexión PDO');
  }

  $id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
  if ($id <= 0) {
    echo "<h2>ID de alojamiento inválido</h2>";
    exit;
  }

  $st = $pdo->prepare("SELECT nombre, calle, altura, localidad, provincia, pais FROM alojamientos WHERE id = :id");
  $st->execute([':id' => $id]);
  $row = $st->fetch(PDO::FETCH_ASSOC);

  if (!$row) {
    echo "<h2>Alojamiento no encontrado</h2>";
    exit;
  }

  // Construir dirección completa
  $direccion = "{$row['calle']} {$row['altura']}, {$row['localidad']}, {$row['provincia']}, {$row['pais']}";
  $maps_url = "https://www.google.com/maps/search/?api=1&query=" . urlencode($direccion);

  // Mostrar resultado
  echo "<h2>{$row['nombre']}</h2>";
  echo "<p><strong>Dirección:</strong> {$direccion}</p>";
  echo "<a href='{$maps_url}' target='_blank' class='btn btn-primary'>Ver en Google Maps</a>";
} catch (Throwable $e) {
  echo "<h2>Error de servidor</h2>";
  echo "<pre>{$e->getMessage()}</pre>";
}