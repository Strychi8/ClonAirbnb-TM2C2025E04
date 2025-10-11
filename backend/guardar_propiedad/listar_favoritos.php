<?php
// POSTMAN: http://localhost/Clon-Airbnb/Alquileres-y-alojamientos-/backend/guardar_propiedad/listar_favoritos.php
// Metodo: GET
// Funcionalidad: listar los alojamientos guardados en los favoritos del usuario autenticado.
// Requisitos: tabla `propiedades_guardadas` en la base de datos.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

try {
    session_start();

    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuario no autenticado']);
        exit;
    }

    require __DIR__ . '/../../backend/db.php';

    $usuarioId = (int)$_SESSION['user_id'];

    // Seleccionamos los datos mínimos del alojamiento para mostrar en la lista de favoritos
    $sql = "SELECT a.id, a.nombre, a.descripcion, a.precio_noche AS precio, a.imagen_principal AS imagen
        FROM propiedades_guardadas pg
            JOIN alojamientos a ON a.id = pg.alojamiento_id
            WHERE pg.usuario_id = ?
            ORDER BY pg.creado_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([$usuarioId]);
    $favoritos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'favoritos' => $favoritos]);
    exit;

} catch (PDOException $e) {
    error_log('listar_favoritos error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error de base de datos']);
} catch (Exception $e) {
    error_log('listar_favoritos unexpected: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error interno']);
}

?>
