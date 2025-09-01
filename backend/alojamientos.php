<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

require __DIR__ . '/db.php';

// Traer todos los alojamientos
$sql = "SELECT 
          id,
          nombre,
          direccion,
          descripcion,
          precio_noche,
          direccion,
          servicios,
          imagen_principal
        FROM alojamientos
        ORDER BY id";

$res = $conn->query($sql);
$alojamientos = [];

// Aca tengo que procesar las imagenes secundarias para las publicaciones pero antes revisando el formato, puedo hacerlo en array o en una tabla aparte.

// if ($res) {
//   while ($row = $res->fetch_assoc()) {
//     $row['precio_noche'] = isset($row['precio_noche']) ? (float)$row['precio_noche'] : 0.0;

//     if (!empty($row['imagenes_secundarias'])) {
//       $row['imagenes_secundarias'] = array_map('trim', explode(',', $row['imagenes_secundarias']));
//     } else {
//       $row['imagenes_secundarias'] = [];
//     }

//     $alojamientos[] = $row;
//   }
// }

header('Content-Type: application/json; charset=utf-8');
echo json_encode($alojamientos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);