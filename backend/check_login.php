<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
    echo json_encode([
        'logged_in' => true,
        'user_name' => $_SESSION['user_name'],
        'user_id' => $_SESSION['user_id']
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
