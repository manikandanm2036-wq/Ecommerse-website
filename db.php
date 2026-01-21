<?php
require_once 'config.php';

class Database {
    private $host = DB_HOST;
    private $dbname = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $conn;
    
    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->dbname . ";charset=utf8mb4",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            die("Connection failed: " . $e->getMessage());
        }
        
        return $this->conn;
    }
    
    // Singleton instance
    private static $instance = null;
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance->getConnection();
    }
}

// Global database connection
$db = Database::getInstance();
?>