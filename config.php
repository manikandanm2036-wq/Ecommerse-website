<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'ecommerce_db');
define('DB_USER', 'root');
define('DB_PASS', ''); // Leave empty for XAMPP, 'root' for MAMP

// Site configuration
define('SITE_URL', 'http://localhost/ecommerce-project/backend/');
define('SITE_NAME', 'MyShop');

// JWT Secret (for advanced authentication)
define('JWT_SECRET', 'your-secret-key-here-change-this');

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set default timezone
date_default_timezone_set('Asia/Kolkata');
?>