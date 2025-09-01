<?php
// Database connection placeholder
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "erbienbi";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
	die("Error de conexion: " . $conn->connect_error);
}
?>
