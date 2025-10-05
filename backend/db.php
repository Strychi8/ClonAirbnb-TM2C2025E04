<?php
declare(strict_types=1);

$DB_HOST   = 'localhost';
$DB_NAME   = 'erbienbi';
$DB_USER   = 'root';
$DB_PASS   = 'root';
$DB_CHAR   = 'utf8mb4';

$dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset={$DB_CHAR}";

$options = [
  PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
  PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
  $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (Throwable $e) {
  http_response_code(500);
  echo "No se pudo conectar a la base de datos.";
  error_log("DB connection error: ".$e->getMessage());
  exit;
}