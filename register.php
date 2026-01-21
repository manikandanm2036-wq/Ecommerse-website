<?php
require_once '../includes/functions.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Name, email and password are required'
    ]);
}

$name = $functions->sanitize($data['name']);
$email = $functions->sanitize($data['email']);
$password = $data['password'];

// Validate inputs
if (strlen($name) < 2) {
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Name must be at least 2 characters'
    ]);
}

if (!$functions->validateEmail($email)) {
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Invalid email format'
    ]);
}

if (strlen($password) < 6) {
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Password must be at least 6 characters'
    ]);
}

// Attempt registration
$result = $functions->registerUser($name, $email, $password);

$functions->jsonResponse($result);
?>