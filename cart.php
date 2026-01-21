<?php
require_once '../includes/functions.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!$functions->isLoggedIn()) {
    $functions->jsonResponse([
        'success' => false,
        'message' => 'Please login to access cart'
    ]);
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Get cart items
        $cart_items = $functions->getCartItems($user_id);
        $cart_total = $functions->getCartTotal($user_id);
        
        $functions->jsonResponse([
            'success' => true,
            'data' => $cart_items,
            'total' => $cart_total,
            'count' => count($cart_items)
        ]);
        break;
        
    case 'POST':
        // Add to cart
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['product_id'])) {
            $functions->jsonResponse([
                'success' => false,
                'message' => 'Product ID is required'
            ]);
        }
        
        $product_id = (int)$data['product_id'];
        $quantity = isset($data['quantity']) ? (int)$data['quantity'] : 1;
        
        $result = $functions->addToCart($user_id, $product_id, $quantity);
        $functions->jsonResponse($result);
        break;
        
    case 'PUT':
        // Update cart quantity
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['product_id']) || !isset($data['quantity'])) {
            $functions->jsonResponse([
                'success' => false,
                'message' => 'Product ID and quantity are required'
            ]);
        }
        
        $product_id = (int)$data['product_id'];
        $quantity = (int)$data['quantity'];
        
        $result = $functions->updateCartQuantity($user_id, $product_id, $quantity);
        $functions->jsonResponse($result);
        break;
        
    case 'DELETE':
        // Remove from cart or clear cart
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (isset($data['product_id'])) {
            // Remove specific item
            $product_id = (int)$data['product_id'];
            $success = $functions->removeFromCart($user_id, $product_id);
            
            $functions->jsonResponse([
                'success' => $success,
                'message' => $success ? 'Item removed from cart' : 'Item not found in cart'
            ]);
        } else {
            // Clear entire cart
            $success = $functions->clearCart($user_id);
            
            $functions->jsonResponse([
                'success' => $success,
                'message' => 'Cart cleared successfully'
            ]);
        }
        break;
        
    default:
        http_response_code(405);
        $functions->jsonResponse([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
}
?>