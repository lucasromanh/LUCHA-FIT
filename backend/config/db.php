<?php
/**
 * LuchaFit - Database Configuration
 * 
 * Configuración de conexión a la base de datos MySQL
 * Para usar en Hostinger o cualquier servidor PHP/MySQL
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');          // Cambiar si Hostinger usa otro host
define('DB_NAME', 'u895350652_luchafit_db');        // Nombre de tu base de datos
define('DB_USER', 'u895350652_luchafit_db');         // Tu usuario de MySQL
define('DB_PASS', 'Luchafit_db1');      // Tu contraseña de MySQL
define('DB_CHARSET', 'utf8mb4');

// Configuración CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Función para obtener la conexión PDO
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Error de conexión a la base de datos',
            'message' => $e->getMessage()
        ]);
        exit();
    }
}

// Función para responder con JSON
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// Función para responder con error
function sendError($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'error' => $message
    ];
    
    if ($details !== null) {
        $response['details'] = $details;
    }
    
    sendJSON($response, $statusCode);
}

// Función para responder con éxito
function sendSuccess($data = null, $message = null) {
    $response = ['success' => true];
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    sendJSON($response);
}

// Función para validar y sanitizar inputs
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)));
}

// Función para generar ID único
function generateUniqueId($prefix = '') {
    return $prefix . uniqid() . bin2hex(random_bytes(4));
}
?>
