<?php
/**
 * LuchaFit - Routines API
 * 
 * Endpoint: /api/routines.php
 * Métodos: GET, POST, PUT, DELETE
 * 
 * Gestiona rutinas de entrenamiento con sus sesiones y ejercicios
 */

require_once __DIR__ . '/../config/db.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];

// ========================================
// GET - Obtener rutinas
// ========================================
if ($method === 'GET') {
    $routineId = $_GET['id'] ?? null;
    $patientId = $_GET['patient_id'] ?? null;
    
    if ($routineId) {
        // Obtener rutina específica con sesiones y ejercicios
        $stmt = $db->prepare("SELECT * FROM routines WHERE id = :id");
        $stmt->execute(['id' => $routineId]);
        $routine = $stmt->fetch();
        
        if (!$routine) {
            sendError('Rutina no encontrada', 404);
        }
        
        // Obtener sesiones
        $stmt = $db->prepare("
            SELECT * FROM routine_sessions 
            WHERE routine_id = :routine_id 
            ORDER BY order_index ASC
        ");
        $stmt->execute(['routine_id' => $routineId]);
        $sessions = $stmt->fetchAll();
        
        // Obtener ejercicios de cada sesión
        foreach ($sessions as &$session) {
            $stmt = $db->prepare("
                SELECT * FROM routine_exercises 
                WHERE session_id = :session_id 
                ORDER BY order_index ASC
            ");
            $stmt->execute(['session_id' => $session['id']]);
            $session['exercises'] = $stmt->fetchAll();
        }
        
        $routine['sessions'] = $sessions;
        sendSuccess($routine);
        
    } elseif ($patientId) {
        // Obtener rutinas de un paciente
        $stmt = $db->prepare("
            SELECT * FROM routines 
            WHERE patient_id = :patient_id 
            ORDER BY created_at DESC
        ");
        $stmt->execute(['patient_id' => $patientId]);
        $routines = $stmt->fetchAll();
        
        sendSuccess($routines);
        
    } else {
        // Obtener todas las rutinas
        $stmt = $db->query("
            SELECT r.*, c.name as patient_name 
            FROM routines r 
            LEFT JOIN clients c ON r.patient_id = c.id 
            ORDER BY r.created_at DESC
        ");
        $routines = $stmt->fetchAll();
        
        sendSuccess($routines);
    }
}

// ========================================
// POST - Crear nueva rutina
// ========================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['patient_id']) || empty($data['title'])) {
        sendError('patient_id y title son requeridos', 400);
    }
    
    $routineId = 'RTN-' . uniqid();
    
    try {
        $db->beginTransaction();
        
        // Crear rutina
        $stmt = $db->prepare("
            INSERT INTO routines (
                id, patient_id, title, objective, sport, level, frequency,
                start_date, end_date, notes, status
            ) VALUES (
                :id, :patient_id, :title, :objective, :sport, :level, :frequency,
                :start_date, :end_date, :notes, :status
            )
        ");
        
        $stmt->execute([
            'id' => $routineId,
            'patient_id' => $data['patient_id'],
            'title' => sanitizeInput($data['title']),
            'objective' => $data['objective'] ?? null,
            'sport' => $data['sport'] ?? null,
            'level' => $data['level'] ?? null,
            'frequency' => $data['frequency'] ?? null,
            'start_date' => $data['start_date'] ?? null,
            'end_date' => $data['end_date'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'] ?? 'draft'
        ]);
        
        // Crear sesiones si existen
        if (isset($data['sessions']) && is_array($data['sessions'])) {
            foreach ($data['sessions'] as $index => $sessionData) {
                $sessionId = 'SES-' . uniqid();
                
                $stmt = $db->prepare("
                    INSERT INTO routine_sessions (id, routine_id, label, order_index)
                    VALUES (:id, :routine_id, :label, :order_index)
                ");
                
                $stmt->execute([
                    'id' => $sessionId,
                    'routine_id' => $routineId,
                    'label' => sanitizeInput($sessionData['label']),
                    'order_index' => $index
                ]);
                
                // Crear ejercicios de la sesión
                if (isset($sessionData['exercises']) && is_array($sessionData['exercises'])) {
                    foreach ($sessionData['exercises'] as $exIndex => $exerciseData) {
                        $exerciseId = 'EX-' . uniqid();
                        
                        $stmt = $db->prepare("
                            INSERT INTO routine_exercises (
                                id, session_id, block, name, sets, reps, load, rest, notes, order_index
                            ) VALUES (
                                :id, :session_id, :block, :name, :sets, :reps, :load, :rest, :notes, :order_index
                            )
                        ");
                        
                        $stmt->execute([
                            'id' => $exerciseId,
                            'session_id' => $sessionId,
                            'block' => $exerciseData['block'] ?? 'main',
                            'name' => sanitizeInput($exerciseData['name']),
                            'sets' => $exerciseData['sets'] ?? 3,
                            'reps' => $exerciseData['reps'] ?? '10',
                            'load' => $exerciseData['load'] ?? '',
                            'rest' => $exerciseData['rest'] ?? '60s',
                            'notes' => $exerciseData['notes'] ?? null,
                            'order_index' => $exIndex
                        ]);
                    }
                }
            }
        }
        
        $db->commit();
        
        sendSuccess([
            'id' => $routineId,
            'message' => 'Rutina creada exitosamente'
        ], null, 201);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendError('Error al crear rutina: ' . $e->getMessage(), 500);
    }
}

// ========================================
// PUT - Actualizar rutina
// ========================================
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $routineId = $_GET['id'] ?? $data['id'] ?? null;
    
    if (!$routineId) {
        sendError('ID de rutina requerido', 400);
    }
    
    // Verificar que existe
    $stmt = $db->prepare("SELECT * FROM routines WHERE id = :id");
    $stmt->execute(['id' => $routineId]);
    $existing = $stmt->fetch();
    
    if (!$existing) {
        sendError('Rutina no encontrada', 404);
    }
    
    try {
        $db->beginTransaction();
        
        // Actualizar datos básicos de la rutina
        $updateFields = [];
        $params = ['id' => $routineId];
        
        $allowedFields = ['title', 'objective', 'sport', 'level', 'frequency', 'start_date', 'end_date', 'notes', 'status'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = :$field";
                $params[$field] = $data[$field];
            }
        }
        
        if (!empty($updateFields)) {
            $query = "UPDATE routines SET " . implode(', ', $updateFields) . " WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
        }
        
        // Si se actualizan las sesiones, reemplazarlas completamente
        if (isset($data['sessions']) && is_array($data['sessions'])) {
            // Eliminar sesiones existentes (los ejercicios se eliminan en cascada)
            $stmt = $db->prepare("DELETE FROM routine_sessions WHERE routine_id = :routine_id");
            $stmt->execute(['routine_id' => $routineId]);
            
            // Crear nuevas sesiones
            foreach ($data['sessions'] as $index => $sessionData) {
                $sessionId = $sessionData['id'] ?? 'SES-' . uniqid();
                
                $stmt = $db->prepare("
                    INSERT INTO routine_sessions (id, routine_id, label, order_index)
                    VALUES (:id, :routine_id, :label, :order_index)
                ");
                
                $stmt->execute([
                    'id' => $sessionId,
                    'routine_id' => $routineId,
                    'label' => $sessionData['label'],
                    'order_index' => $index
                ]);
                
                // Crear ejercicios
                if (isset($sessionData['exercises']) && is_array($sessionData['exercises'])) {
                    foreach ($sessionData['exercises'] as $exIndex => $exerciseData) {
                        $exerciseId = $exerciseData['id'] ?? 'EX-' . uniqid();
                        
                        $stmt = $db->prepare("
                            INSERT INTO routine_exercises (
                                id, session_id, block, name, sets, reps, load, rest, notes, order_index
                            ) VALUES (
                                :id, :session_id, :block, :name, :sets, :reps, :load, :rest, :notes, :order_index
                            )
                        ");
                        
                        $stmt->execute([
                            'id' => $exerciseId,
                            'session_id' => $sessionId,
                            'block' => $exerciseData['block'] ?? 'main',
                            'name' => $exerciseData['name'],
                            'sets' => $exerciseData['sets'] ?? 3,
                            'reps' => $exerciseData['reps'] ?? '10',
                            'load' => $exerciseData['load'] ?? '',
                            'rest' => $exerciseData['rest'] ?? '60s',
                            'notes' => $exerciseData['notes'] ?? null,
                            'order_index' => $exIndex
                        ]);
                    }
                }
            }
        }
        
        $db->commit();
        
        sendSuccess([
            'id' => $routineId,
            'message' => 'Rutina actualizada exitosamente'
        ]);
        
    } catch (PDOException $e) {
        $db->rollBack();
        sendError('Error al actualizar rutina: ' . $e->getMessage(), 500);
    }
}

// ========================================
// DELETE - Eliminar rutina
// ========================================
if ($method === 'DELETE') {
    $routineId = $_GET['id'] ?? null;
    
    if (!$routineId) {
        sendError('ID de rutina requerido', 400);
    }
    
    // Verificar que existe
    $stmt = $db->prepare("SELECT * FROM routines WHERE id = :id");
    $stmt->execute(['id' => $routineId]);
    $routine = $stmt->fetch();
    
    if (!$routine) {
        sendError('Rutina no encontrada', 404);
    }
    
    try {
        // Eliminar rutina (sesiones y ejercicios se eliminan en cascada)
        $stmt = $db->prepare("DELETE FROM routines WHERE id = :id");
        $stmt->execute(['id' => $routineId]);
        
        sendSuccess(['message' => 'Rutina eliminada exitosamente']);
        
    } catch (PDOException $e) {
        sendError('Error al eliminar rutina: ' . $e->getMessage(), 500);
    }
}

sendError('Método no permitido', 405);
?>
