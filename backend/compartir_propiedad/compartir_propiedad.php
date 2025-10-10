<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/compartir_propiedad/compartir_propiedad.php?id=XX
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

	// Obtener id por GET o POST (JSON body)
	$id = null;
	if ($_SERVER['REQUEST_METHOD'] === 'GET') {
		$id = isset($_GET['id']) ? $_GET['id'] : null;
	} else {
		$input = json_decode(file_get_contents('php://input'), true);
		$id = $input['id'] ?? null;
		// si no viene JSON, revisar form-data / POST normal
		if (!$id && isset($_POST['id'])) $id = $_POST['id'];
	}

	if (!$id || !is_numeric($id)) {
		http_response_code(400);
		echo json_encode(['success' => false, 'message' => 'ID de alojamiento inválido']);
		exit;
	}

	// Consultar alojamiento
	$stmt = $pdo->prepare('SELECT id, nombre FROM alojamientos WHERE id = ?');
	$stmt->execute([(int)$id]);
	$aloj = $stmt->fetch(PDO::FETCH_ASSOC);

	if (!$aloj) {
		http_response_code(404);
		echo json_encode(['success' => false, 'message' => 'Alojamiento no encontrado']);
		exit;
	}

	// Construir URL dinámica basada en host y path
	$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
	$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
	$scriptDir = dirname($_SERVER['SCRIPT_NAME']); // /Clon-Airbnb/.../backend/compartir_propiedad
	$projectPath = dirname(dirname($scriptDir)); // up to project root
	// Ruta pública: /alojamientos/alojamiento.html?id=XX (puedes ajustar según tu routing)
	// Asegurarse que urlencode reciba string (en PHP 8+ pasar un int lanza TypeError)
	$publicPath = $projectPath . '/alojamientos/alojamiento.html?id=' . rawurlencode((string)$aloj['id']);
	$url = $protocol . '://' . $host . $publicPath;

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
