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

if (!$functions->isLoggedIn()) {
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Please login to checkout'
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}

$user_id = $_SESSION['user_id'];
$data = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required_fields = ['shipping_address', 'payment_method'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        $functions->jsonResponse([
            'success' => false,
            'message' => ucfirst(str_replace('_', ' ', $field)) . ' is required'
        ]);
    }
}

// Get cart total
$cart_total = $functions->getCartTotal($user_id);

// Check if cart is empty
$cart_items = $functions->getCartItems($user_id);
if (empty($cart_items)) {
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Your cart is empty'
    ]);
}

// Check stock availability
foreach ($cart_items as $item) {
    if ($item['quantity'] > $item['stock_quantity']) {
        $functions->jsonResponse([
            'success' => false,
            'message' => 'Insufficient stock for ' . $item['name']
        ]);
    }
}

// Process order
$shipping_address = $functions->sanitize($data['shipping_address']);
$payment_method = $functions->sanitize($data['payment_method']);

$result = $functions->createOrder($user_id, $cart_total, $shipping_address, $payment_method);

$functions->jsonResponse($result);
?>