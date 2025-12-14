<?php
/**
 * LuchaFit - Measurements API
 * 
 * Endpoint: /api/measurements.php
 * Métodos: GET, POST, PUT, DELETE
 * 
 * Incluye cálculos automáticos de:
 * - BMI
 * - Somatotipo (Heath-Carter)
 * - Z-Scores
 * - Composición corporal
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/calculations.php';
require_once __DIR__ . '/../utils/upload.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$uploadHandler = new UploadHandler();

// ========================================
// GET - Obtener mediciones
// ========================================
if ($method === 'GET') {
    $measurementId = $_GET['id'] ?? null;
    $clientId = $_GET['client_id'] ?? null;
    
    if ($measurementId) {
        // Obtener una medición específica
        $stmt = $db->prepare("SELECT * FROM measurements WHERE id = :id");
        $stmt->execute(['id' => $measurementId]);
        $measurement = $stmt->fetch();
        
        if (!$measurement) {
            sendError('Medición no encontrada', 404);
        }
        
        // Decodificar images JSON
        if ($measurement['images']) {
            $measurement['images'] = json_decode($measurement['images'], true);
        }
        
        sendSuccess($measurement);
        
    } elseif ($clientId) {
        // Obtener todas las mediciones de un cliente
        $stmt = $db->prepare("
            SELECT * FROM measurements 
            WHERE client_id = :client_id 
            ORDER BY date DESC
        ");
        $stmt->execute(['client_id' => $clientId]);
        $measurements = $stmt->fetchAll();
        
        // Decodificar images JSON
        foreach ($measurements as &$measurement) {
            if ($measurement['images']) {
                $measurement['images'] = json_decode($measurement['images'], true);
            }
        }
        
        sendSuccess($measurements);
        
    } else {
        // Obtener todas las mediciones
        $stmt = $db->query("
            SELECT m.*, c.name as client_name 
            FROM measurements m 
            LEFT JOIN clients c ON m.client_id = c.id 
            ORDER BY m.date DESC
        ");
        $measurements = $stmt->fetchAll();
        
        foreach ($measurements as &$measurement) {
            if ($measurement['images']) {
                $measurement['images'] = json_decode($measurement['images'], true);
            }
        }
        
        sendSuccess($measurements);
    }
}

// ========================================
// POST - Crear nueva medición
// ========================================
if ($method === 'POST') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'multipart/form-data') !== false) {
        $data = $_POST;
        
        // Procesar múltiples imágenes
        $uploadedImages = [];
        if (isset($_FILES['images'])) {
            $result = $uploadHandler->uploadMultipleImages($_FILES['images'], 'measurements');
            if ($result['success']) {
                $uploadedImages = $result['uploaded'];
            }
        }
        
        $data['images'] = $uploadedImages;
    } else {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Procesar imágenes base64 si existen
        if (isset($data['imagesBase64']) && is_array($data['imagesBase64'])) {
            $uploadedImages = [];
            foreach ($data['imagesBase64'] as $base64Image) {
                $result = $uploadHandler->uploadBase64Image($base64Image, 'measurements');
                if ($result['success']) {
                    $uploadedImages[] = $result['url'];
                }
            }
            $data['images'] = $uploadedImages;
            unset($data['imagesBase64']);
        }
    }
    
    // Validar datos requeridos
    if (empty($data['client_id'])) {
        sendError('client_id es requerido', 400);
    }
    
    // Generar ID único
    $measurementId = 'MED-' . uniqid();
    
    // Calcular valores automáticamente
    $calculatedData = AnthroCalculations::calculateBodyComposition($data);
    $somatotype = AnthroCalculations::calculateSomatotype($data);
    
    try {
        $stmt = $db->prepare("
            INSERT INTO measurements (
                id, client_id, evaluator, date,
                mass, stature, sitting_height, arm_span,
                triceps, subscapular, biceps, iliac_crest, supraspinale, abdominal, thigh, calf,
                arm_relaxed, arm_flexed, waist, hips, mid_thigh, calf_girth,
                humerus, bistyloid, femur,
                bmi, body_fat_percent, somatotype_endo, somatotype_meso, somatotype_ecto,
                images
            ) VALUES (
                :id, :client_id, :evaluator, :date,
                :mass, :stature, :sitting_height, :arm_span,
                :triceps, :subscapular, :biceps, :iliac_crest, :supraspinale, :abdominal, :thigh, :calf,
                :arm_relaxed, :arm_flexed, :waist, :hips, :mid_thigh, :calf_girth,
                :humerus, :bistyloid, :femur,
                :bmi, :body_fat_percent, :somatotype_endo, :somatotype_meso, :somatotype_ecto,
                :images
            )
        ");
        
        $stmt->execute([
            'id' => $measurementId,
            'client_id' => $data['client_id'],
            'evaluator' => $data['evaluator'] ?? 'Luciana Milagros Burgos',
            'date' => $data['date'] ?? date('Y-m-d'),
            
            // Basic
            'mass' => $data['mass'] ?? null,
            'stature' => $data['stature'] ?? null,
            'sitting_height' => $data['sitting_height'] ?? null,
            'arm_span' => $data['arm_span'] ?? null,
            
            // Skinfolds
            'triceps' => $data['triceps'] ?? null,
            'subscapular' => $data['subscapular'] ?? null,
            'biceps' => $data['biceps'] ?? null,
            'iliac_crest' => $data['iliac_crest'] ?? null,
            'supraspinale' => $data['supraspinale'] ?? null,
            'abdominal' => $data['abdominal'] ?? null,
            'thigh' => $data['thigh'] ?? null,
            'calf' => $data['calf'] ?? null,
            
            // Girths
            'arm_relaxed' => $data['arm_relaxed'] ?? null,
            'arm_flexed' => $data['arm_flexed'] ?? null,
            'waist' => $data['waist'] ?? null,
            'hips' => $data['hips'] ?? null,
            'mid_thigh' => $data['mid_thigh'] ?? null,
            'calf_girth' => $data['calf_girth'] ?? null,
            
            // Breadths
            'humerus' => $data['humerus'] ?? null,
            'bistyloid' => $data['bistyloid'] ?? null,
            'femur' => $data['femur'] ?? null,
            
            // Calculated values
            'bmi' => $calculatedData['bmi'],
            'body_fat_percent' => $calculatedData['body_fat_percent'],
            'somatotype_endo' => $somatotype['endomorphy'],
            'somatotype_meso' => $somatotype['mesomorphy'],
            'somatotype_ecto' => $somatotype['ectomorphy'],
            
            // Images
            'images' => !empty($data['images']) ? json_encode($data['images']) : null
        ]);
        
        // Actualizar peso del cliente
        if (isset($data['mass'])) {
            $stmtClient = $db->prepare("UPDATE clients SET weight = :weight, last_visit = :date WHERE id = :id");
            $stmtClient->execute([
                'weight' => $data['mass'],
                'date' => $data['date'] ?? date('Y-m-d'),
                'id' => $data['client_id']
            ]);
        }
        
        sendSuccess([
            'id' => $measurementId,
            'calculations' => array_merge($calculatedData, $somatotype),
            'message' => 'Medición creada exitosamente'
        ], null, 201);
        
    } catch (PDOException $e) {
        sendError('Error al crear medición: ' . $e->getMessage(), 500);
    }
}

// ========================================
// PUT - Actualizar medición
// ========================================
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $measurementId = $_GET['id'] ?? $data['id'] ?? null;
    
    if (!$measurementId) {
        sendError('ID de medición requerido', 400);
    }
    
    // Verificar que existe
    $stmt = $db->prepare("SELECT * FROM measurements WHERE id = :id");
    $stmt->execute(['id' => $measurementId]);
    $existing = $stmt->fetch();
    
    if (!$existing) {
        sendError('Medición no encontrada', 404);
    }
    
    // Recalcular valores si se actualizaron medidas
    $calculatedData = AnthroCalculations::calculateBodyComposition(array_merge($existing, $data));
    $somatotype = AnthroCalculations::calculateSomatotype(array_merge($existing, $data));
    
    // Construir query dinámicamente
    $updateFields = [];
    $params = ['id' => $measurementId];
    
    $allowedFields = [
        'evaluator', 'date',
        'mass', 'stature', 'sitting_height', 'arm_span',
        'triceps', 'subscapular', 'biceps', 'iliac_crest', 'supraspinale', 'abdominal', 'thigh', 'calf',
        'arm_relaxed', 'arm_flexed', 'waist', 'hips', 'mid_thigh', 'calf_girth',
        'humerus', 'bistyloid', 'femur'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateFields[] = "$field = :$field";
            $params[$field] = $data[$field];
        }
    }
    
    // Actualizar valores calculados
    $updateFields[] = "bmi = :bmi";
    $updateFields[] = "body_fat_percent = :body_fat_percent";
    $updateFields[] = "somatotype_endo = :somatotype_endo";
    $updateFields[] = "somatotype_meso = :somatotype_meso";
    $updateFields[] = "somatotype_ecto = :somatotype_ecto";
    
    $params['bmi'] = $calculatedData['bmi'];
    $params['body_fat_percent'] = $calculatedData['body_fat_percent'];
    $params['somatotype_endo'] = $somatotype['endomorphy'];
    $params['somatotype_meso'] = $somatotype['mesomorphy'];
    $params['somatotype_ecto'] = $somatotype['ectomorphy'];
    
    if (empty($updateFields)) {
        sendError('No hay campos para actualizar', 400);
    }
    
    try {
        $query = "UPDATE measurements SET " . implode(', ', $updateFields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        sendSuccess([
            'id' => $measurementId,
            'calculations' => array_merge($calculatedData, $somatotype),
            'message' => 'Medición actualizada exitosamente'
        ]);
        
    } catch (PDOException $e) {
        sendError('Error al actualizar medición: ' . $e->getMessage(), 500);
    }
}

// ========================================
// DELETE - Eliminar medición
// ========================================
if ($method === 'DELETE') {
    $measurementId = $_GET['id'] ?? null;
    
    if (!$measurementId) {
        sendError('ID de medición requerido', 400);
    }
    
    // Obtener imágenes antes de eliminar
    $stmt = $db->prepare("SELECT images FROM measurements WHERE id = :id");
    $stmt->execute(['id' => $measurementId]);
    $measurement = $stmt->fetch();
    
    if (!$measurement) {
        sendError('Medición no encontrada', 404);
    }
    
    try {
        // Eliminar imágenes asociadas
        if ($measurement['images']) {
            $images = json_decode($measurement['images'], true);
            foreach ($images as $imageUrl) {
                $filename = basename($imageUrl);
                $uploadHandler->deleteImage($filename, 'measurements');
            }
        }
        
        // Eliminar medición
        $stmt = $db->prepare("DELETE FROM measurements WHERE id = :id");
        $stmt->execute(['id' => $measurementId]);
        
        sendSuccess(['message' => 'Medición eliminada exitosamente']);
        
    } catch (PDOException $e) {
        sendError('Error al eliminar medición: ' . $e->getMessage(), 500);
    }
}

sendError('Método no permitido', 405);
?>
