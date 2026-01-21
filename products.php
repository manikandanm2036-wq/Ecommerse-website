<?php
require_once '../includes/functions.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $category = isset($_GET['category']) ? $functions->sanitize($_GET['category']) : null;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : null;
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        
        $products = $functions->getProducts($category, $limit, $page);
        
        $functions->jsonResponse([
            'success' => true,
            'data' => $products,
            'count' => count($products),
            'message' => 'Products retrieved successfully'
        ]);
        break;
        
    case 'POST':
        // For admin to add products (protected endpoint)
        if (!$functions->isLoggedIn()) {
            $functions->jsonResponse([
                'success' => false,
                'message' => 'Authentication required'
            ]);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Add product logic here
        $functions->jsonResponse([
            'success' => false,
            'message' => 'Product creation endpoint not implemented'
        ]);
        break;
        
    default:
        http_response_code(405);
        $functions->jsonResponse([
            'success' => false,
            'message' => 'Method not allowed'
        ]);
}
?>