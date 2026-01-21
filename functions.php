<?php
require_once 'db.php';

class Functions {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    // ========== USER FUNCTIONS ==========
    public function registerUser($name, $email, $password) {
        // Check if email exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            return ['success' => false, 'message' => 'Email already registered'];
        }
        
        // Hash password
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $this->db->prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
        
        if ($stmt->execute([$name, $email, $hashed_password])) {
            $user_id = $this->db->lastInsertId();
            $_SESSION['user_id'] = $user_id;
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;
            
            return [
                'success' => true,
                'message' => 'Registration successful',
                'user_id' => $user_id,
                'user_name' => $name
            ];
        }
        
        return ['success' => false, 'message' => 'Registration failed'];
    }
    
    public function loginUser($email, $password) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            $_SESSION['user_email'] = $user['email'];
            
            return [
                'success' => true,
                'message' => 'Login successful',
                'user_id' => $user['id'],
                'user_name' => $user['name']
            ];
        }
        
        return ['success' => false, 'message' => 'Invalid email or password'];
    }
    
    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }
    
    public function getCurrentUser() {
        if (!$this->isLoggedIn()) return null;
        
        $stmt = $this->db->prepare("SELECT id, name, email, created_at FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        return $stmt->fetch();
    }
    
    // ========== PRODUCT FUNCTIONS ==========
    public function getProducts($category = null, $limit = null, $page = 1) {
        $sql = "SELECT * FROM products WHERE 1=1";
        $params = [];
        
        if ($category) {
            $sql .= " AND category = ?";
            $params[] = $category;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        if ($limit) {
            $offset = ($page - 1) * $limit;
            $sql .= " LIMIT ? OFFSET ?";
            $params[] = (int)$limit;
            $params[] = (int)$offset;
        }
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    public function getProductById($id) {
        $stmt = $this->db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function searchProducts($keyword) {
        $stmt = $this->db->prepare("
            SELECT * FROM products 
            WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
            ORDER BY created_at DESC
        ");
        $search_term = "%$keyword%";
        $stmt->execute([$search_term, $search_term, $search_term]);
        return $stmt->fetchAll();
    }
    
    // ========== CART FUNCTIONS ==========
    public function addToCart($user_id, $product_id, $quantity = 1) {
        // Check if product exists
        $product = $this->getProductById($product_id);
        if (!$product) {
            return ['success' => false, 'message' => 'Product not found'];
        }
        
        // Check stock
        if ($product['stock_quantity'] < $quantity) {
            return ['success' => false, 'message' => 'Insufficient stock'];
        }
        
        // Check if already in cart
        $stmt = $this->db->prepare("SELECT * FROM cart WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user_id, $product_id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Update quantity
            $new_quantity = $existing['quantity'] + $quantity;
            $stmt = $this->db->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
            $stmt->execute([$new_quantity, $existing['id']]);
        } else {
            // Insert new
            $stmt = $this->db->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)");
            $stmt->execute([$user_id, $product_id, $quantity]);
        }
        
        return ['success' => true, 'message' => 'Product added to cart'];
    }
    
    public function getCartItems($user_id) {
        $stmt = $this->db->prepare("
            SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
            ORDER BY c.added_at DESC
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetchAll();
    }
    
    public function updateCartQuantity($user_id, $product_id, $quantity) {
        if ($quantity <= 0) {
            // Remove item
            $stmt = $this->db->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
            $stmt->execute([$user_id, $product_id]);
            return ['success' => true, 'message' => 'Item removed from cart'];
        }
        
        $stmt = $this->db->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$quantity, $user_id, $product_id]);
        
        return ['success' => true, 'message' => 'Cart updated'];
    }
    
    public function removeFromCart($user_id, $product_id) {
        $stmt = $this->db->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
        $stmt->execute([$user_id, $product_id]);
        return $stmt->rowCount() > 0;
    }
    
    public function clearCart($user_id) {
        $stmt = $this->db->prepare("DELETE FROM cart WHERE user_id = ?");
        return $stmt->execute([$user_id]);
    }
    
    public function getCartTotal($user_id) {
        $items = $this->getCartItems($user_id);
        $total = 0;
        
        foreach ($items as $item) {
            $total += $item['price'] * $item['quantity'];
        }
        
        return $total;
    }
    
    // ========== ORDER FUNCTIONS ==========
    public function createOrder($user_id, $total_amount, $shipping_address, $payment_method) {
        $order_number = 'ORD' . date('Ymd') . strtoupper(uniqid());
        
        $this->db->beginTransaction();
        
        try {
            // Create order
            $stmt = $this->db->prepare("
                INSERT INTO orders (user_id, order_number, total_amount, shipping_address, payment_method) 
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$user_id, $order_number, $total_amount, $shipping_address, $payment_method]);
            $order_id = $this->db->lastInsertId();
            
            // Get cart items
            $cart_items = $this->getCartItems($user_id);
            
            // Create order items and update stock
            foreach ($cart_items as $item) {
                // Insert order item
                $stmt = $this->db->prepare("
                    INSERT INTO order_items (order_id, product_id, quantity, price) 
                    VALUES (?, ?, ?, ?)
                ");
                $stmt->execute([$order_id, $item['product_id'], $item['quantity'], $item['price']]);
                
                // Update product stock
                $stmt = $this->db->prepare("
                    UPDATE products 
                    SET stock_quantity = stock_quantity - ? 
                    WHERE id = ? AND stock_quantity >= ?
                ");
                $stmt->execute([$item['quantity'], $item['product_id'], $item['quantity']]);
            }
            
            // Clear cart
            $this->clearCart($user_id);
            
            $this->db->commit();
            
            return [
                'success' => true,
                'message' => 'Order placed successfully',
                'order_id' => $order_id,
                'order_number' => $order_number
            ];
            
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'message' => 'Order failed: ' . $e->getMessage()];
        }
    }
    
    public function getUserOrders($user_id) {
        $stmt = $this->db->prepare("
            SELECT o.*, 
                   COUNT(oi.id) as item_count,
                   GROUP_CONCAT(p.name SEPARATOR ', ') as product_names
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE o.user_id = ?
            GROUP BY o.id
            ORDER BY o.created_at DESC
        ");
        $stmt->execute([$user_id]);
        return $stmt->fetchAll();
    }
    
    // ========== HELPER FUNCTIONS ==========
    public function jsonResponse($data) {
        header('Content-Type: application/json');
        echo json_encode($data);
        exit();
    }
    
    public function sanitize($input) {
        return htmlspecialchars(strip_tags(trim($input)));
    }
    
    public function validateEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL);
    }
}

// Create global instance
$functions = new Functions();
?>