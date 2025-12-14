<?php
/**
 * LuchaFit - Authentication API
 * 
 * Endpoint: /api/auth.php
 * Métodos: POST (login), GET (verify)
 */

require_once __DIR__ . '/../config/db.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// ========================================
// LOGIN
// ========================================
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        sendError('Email y contraseña son requeridos', 400);
    }
    
    // HARDCODED CREDENTIALS (como solicitado)
    $VALID_EMAIL = 'Luchafit.nut@gmail.com';
    $VALID_PASSWORD = 'Frijolito01';
    
    // Verificar credenciales
    if ($email === $VALID_EMAIL && $password === $VALID_PASSWORD) {
        // Buscar usuario en base de datos
        $stmt = $db->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();
        
        if (!$user) {
            // Si no existe, crearlo
            $userId = 'USR-' . uniqid();
            $stmt = $db->prepare("
                INSERT INTO users (id, email, password, name, role, status)
                VALUES (:id, :email, :password, :name, 'professional', 'active')
            ");
            $stmt->execute([
                'id' => $userId,
                'email' => $VALID_EMAIL,
                'password' => password_hash($VALID_PASSWORD, PASSWORD_BCRYPT),
                'name' => 'Luciana Milagros Burgos'
            ]);
            
            $user = [
                'id' => $userId,
                'email' => $VALID_EMAIL,
                'name' => 'Luciana Milagros Burgos',
                'role' => 'professional',
                'status' => 'active'
            ];
        }
        
        // Generar token simple (en producción usar JWT)
        $token = base64_encode(json_encode([
            'user_id' => $user['id'],
            'email' => $user['email'],
            'timestamp' => time()
        ]));
        
        sendSuccess([
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'role' => $user['role']
            ]
        ], 'Login exitoso');
        
    } else {
        sendError('Credenciales inválidas', 401);
    }
}

// ========================================
// VERIFY TOKEN
// ========================================
if ($method === 'GET') {
    $headers = getallheaders();
    $token = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (empty($token)) {
        sendError('Token no proporcionado', 401);
    }
    
    // Remover "Bearer " si existe
    $token = str_replace('Bearer ', '', $token);
    
    try {
        $decoded = json_decode(base64_decode($token), true);
        
        if (!$decoded || !isset($decoded['user_id'])) {
            sendError('Token inválido', 401);
        }
        
        // Verificar que el usuario existe
        $stmt = $db->prepare("SELECT id, email, name, role, status FROM users WHERE id = :id");
        $stmt->execute(['id' => $decoded['user_id']]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Usuario no encontrado', 401);
        }
        
        if ($user['status'] !== 'active') {
            sendError('Usuario inactivo', 403);
        }
        
        sendSuccess([
            'user' => $user,
            'valid' => true
        ]);
        
    } catch (Exception $e) {
        sendError('Token inválido', 401);
    }
}

sendError('Método no permitido', 405);
?>
