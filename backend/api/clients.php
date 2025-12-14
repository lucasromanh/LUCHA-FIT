<?php
/**
 * LuchaFit - Clients API
 * 
 * Endpoint: /api/clients.php
 * Métodos: GET, POST, PUT, DELETE
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/upload.php';
require_once __DIR__ . '/../utils/mail.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$uploadHandler = new UploadHandler();
$mailService = new EmailService($db);

// ========================================
// GET - Obtener clientes
// ========================================
if ($method === 'GET') {
    $clientId = $_GET['id'] ?? null;
    
    if ($clientId) {
        // Obtener un cliente específico
        $stmt = $db->prepare("SELECT * FROM clients WHERE id = :id");
        $stmt->execute(['id' => $clientId]);
        $client = $stmt->fetch();
        
        if (!$client) {
            sendError('Cliente no encontrado', 404);
        }
        
        // Decodificar JSON fields
        if ($client['sports']) {
            $client['sports'] = json_decode($client['sports'], true);
        }
        
        sendSuccess($client);
    } else {
        // Obtener todos los clientes
        $status = $_GET['status'] ?? null;
        $search = $_GET['search'] ?? null;
        
        $query = "SELECT * FROM clients WHERE 1=1";
        $params = [];
        
        if ($status) {
            $query .= " AND status = :status";
            $params['status'] = $status;
        }
        
        if ($search) {
            $query .= " AND (name LIKE :search OR email LIKE :search)";
            $params['search'] = "%{$search}%";
        }
        
        $query .= " ORDER BY created_at DESC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $clients = $stmt->fetchAll();
        
        // Decodificar JSON fields
        foreach ($clients as &$client) {
            if ($client['sports']) {
                $client['sports'] = json_decode($client['sports'], true);
            }
        }
        
        sendSuccess($clients);
    }
}

// ========================================
// POST - Crear nuevo cliente
// ========================================
if ($method === 'POST') {
    // Verificar si es multipart/form-data (con imagen)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'multipart/form-data') !== false) {
        // Datos del formulario
        $data = $_POST;
        
        // Procesar imagen si existe
        if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
            $uploadResult = $uploadHandler->uploadImage($_FILES['image'], 'profiles');
            
            if ($uploadResult['success']) {
                $data['image'] = $uploadResult['url'];
            } else {
                sendError($uploadResult['error'], 400);
            }
        }
    } else {
        // JSON regular
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Si hay imagen en base64
        if (isset($data['imageBase64']) && !empty($data['imageBase64'])) {
            $uploadResult = $uploadHandler->uploadBase64Image($data['imageBase64'], 'profiles');
            
            if ($uploadResult['success']) {
                $data['image'] = $uploadResult['url'];
            } else {
                sendError($uploadResult['error'], 400);
            }
            
            unset($data['imageBase64']);
        }
    }
    
    // Validar datos requeridos
    if (empty($data['name'])) {
        sendError('El nombre es requerido', 400);
    }
    
    // Generar ID único
    $clientId = 'C-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    // Preparar datos
    $sports = isset($data['sports']) ? json_encode($data['sports']) : null;
    
    try {
        $stmt = $db->prepare("
            INSERT INTO clients (
                id, name, email, phone, address, birth_date, age, gender, image,
                weight, weight_diff, last_visit, status, goal, body_fat,
                race, hand_dominance, foot_dominance, activity_type, activity_intensity,
                activity_frequency, competition_level, sports, position,
                mass_max, mass_min, nutritionist, pathologies, surgeries, medication
            ) VALUES (
                :id, :name, :email, :phone, :address, :birth_date, :age, :gender, :image,
                :weight, :weight_diff, :last_visit, :status, :goal, :body_fat,
                :race, :hand_dominance, :foot_dominance, :activity_type, :activity_intensity,
                :activity_frequency, :competition_level, :sports, :position,
                :mass_max, :mass_min, :nutritionist, :pathologies, :surgeries, :medication
            )
        ");
        
        $stmt->execute([
            'id' => $clientId,
            'name' => sanitizeInput($data['name']),
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'birth_date' => $data['birth_date'] ?? null,
            'age' => $data['age'] ?? null,
            'gender' => $data['gender'] ?? 'Otro',
            'image' => $data['image'] ?? null,
            'weight' => $data['weight'] ?? null,
            'weight_diff' => $data['weight_diff'] ?? 0,
            'last_visit' => $data['last_visit'] ?? date('Y-m-d'),
            'status' => $data['status'] ?? 'Pendiente',
            'goal' => $data['goal'] ?? null,
            'body_fat' => $data['body_fat'] ?? null,
            'race' => $data['race'] ?? null,
            'hand_dominance' => $data['hand_dominance'] ?? null,
            'foot_dominance' => $data['foot_dominance'] ?? null,
            'activity_type' => $data['activity_type'] ?? null,
            'activity_intensity' => $data['activity_intensity'] ?? null,
            'activity_frequency' => $data['activity_frequency'] ?? null,
            'competition_level' => $data['competition_level'] ?? null,
            'sports' => $sports,
            'position' => $data['position'] ?? null,
            'mass_max' => $data['mass_max'] ?? null,
            'mass_min' => $data['mass_min'] ?? null,
            'nutritionist' => $data['nutritionist'] ?? null,
            'pathologies' => $data['pathologies'] ?? null,
            'surgeries' => $data['surgeries'] ?? null,
            'medication' => $data['medication'] ?? null
        ]);
        
        // Enviar email de bienvenida si tiene email
        if (!empty($data['email'])) {
            $mailService->sendWelcomeEmail($data['email'], $data['name']);
        }
        
        sendSuccess([
            'id' => $clientId,
            'message' => 'Cliente creado exitosamente'
        ], null, 201);
        
    } catch (PDOException $e) {
        sendError('Error al crear cliente: ' . $e->getMessage(), 500);
    }
}

// ========================================
// PUT - Actualizar cliente
// ========================================
if ($method === 'PUT') {
    parse_str(file_get_contents('php://input'), $_PUT);
    $data = json_decode(file_get_contents('php://input'), true) ?? $_PUT;
    
    $clientId = $_GET['id'] ?? $data['id'] ?? null;
    
    if (!$clientId) {
        sendError('ID de cliente requerido', 400);
    }
    
    // Verificar que el cliente existe
    $stmt = $db->prepare("SELECT * FROM clients WHERE id = :id");
    $stmt->execute(['id' => $clientId]);
    $existingClient = $stmt->fetch();
    
    if (!$existingClient) {
        sendError('Cliente no encontrado', 404);
    }
    
    // Procesar imagen si viene en base64
    if (isset($data['imageBase64']) && !empty($data['imageBase64'])) {
        $uploadResult = $uploadHandler->uploadBase64Image($data['imageBase64'], 'profiles');
        
        if ($uploadResult['success']) {
            $data['image'] = $uploadResult['url'];
            
            // Eliminar imagen anterior si existe
            if ($existingClient['image']) {
                $oldFilename = basename($existingClient['image']);
                $uploadHandler->deleteImage($oldFilename, 'profiles');
            }
        }
        
        unset($data['imageBase64']);
    }
    
    // Construir query de actualización dinámicamente
    $updateFields = [];
    $params = ['id' => $clientId];
    
    $allowedFields = [
        'name', 'email', 'phone', 'address', 'birth_date', 'age', 'gender', 'image',
        'weight', 'weight_diff', 'last_visit', 'status', 'goal', 'body_fat',
        'race', 'hand_dominance', 'foot_dominance', 'activity_type', 'activity_intensity',
        'activity_frequency', 'competition_level', 'position',
        'mass_max', 'mass_min', 'nutritionist', 'pathologies', 'surgeries', 'medication'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateFields[] = "$field = :$field";
            $params[$field] = $data[$field];
        }
    }
    
    // Sports (JSON)
    if (isset($data['sports'])) {
        $updateFields[] = "sports = :sports";
        $params['sports'] = json_encode($data['sports']);
    }
    
    if (empty($updateFields)) {
        sendError('No hay campos para actualizar', 400);
    }
    
    try {
        $query = "UPDATE clients SET " . implode(', ', $updateFields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        sendSuccess([
            'id' => $clientId,
            'message' => 'Cliente actualizado exitosamente'
        ]);
        
    } catch (PDOException $e) {
        sendError('Error al actualizar cliente: ' . $e->getMessage(), 500);
    }
}

// ========================================
// DELETE - Eliminar cliente
// ========================================
if ($method === 'DELETE') {
    $clientId = $_GET['id'] ?? null;
    
    if (!$clientId) {
        sendError('ID de cliente requerido', 400);
    }
    
    // Verificar que el cliente existe
    $stmt = $db->prepare("SELECT image FROM clients WHERE id = :id");
    $stmt->execute(['id' => $clientId]);
    $client = $stmt->fetch();
    
    if (!$client) {
        sendError('Cliente no encontrado', 404);
    }
    
    try {
        // Eliminar imagen si existe
        if ($client['image']) {
            $filename = basename($client['image']);
            $uploadHandler->deleteImage($filename, 'profiles');
        }
        
        // Eliminar cliente (las relaciones se eliminan en cascada)
        $stmt = $db->prepare("DELETE FROM clients WHERE id = :id");
        $stmt->execute(['id' => $clientId]);
        
        sendSuccess([
            'message' => 'Cliente eliminado exitosamente'
        ]);
        
    } catch (PDOException $e) {
        sendError('Error al eliminar cliente: ' . $e->getMessage(), 500);
    }
}

sendError('Método no permitido', 405);
?>
