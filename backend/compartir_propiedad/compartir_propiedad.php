<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/compartir_propiedad/compartir_propiedad.php?id=XX
// Metodo: GET
// Funcionalidad: generar y devolver una URL pública para compartir un alojamiento específico.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    require __DIR__ . '/../../backend/db.php';

    $id = null;
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $id = $_GET['id'] ?? null;
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? ($_POST['id'] ?? null);
    }

    if (!$id || !is_numeric($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de alojamiento inválido']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, nombre FROM alojamientos WHERE id = ?');
    $stmt->execute([(int)$id]);
    $aloj = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$aloj) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Alojamiento no encontrado']);
        exit;
    }

    // ✅ Construcción de URL corregida
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $basePath = '/Alquileres-y-alojamientos--main';
    $publicPath = $basePath . '/alojamientos/alojamiento.html?id=' . rawurlencode((string)$aloj['id']);
    $url = "{$protocol}://{$host}{$publicPath}";

    echo json_encode([
        'success' => true,
        'message' => 'URL generada',
        'url' => $url,
        'title' => $aloj['nombre'] ?? null
    ]);

} catch (Exception $e) {
    error_log('Error compartir_propiedad: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
}
?>
