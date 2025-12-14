<?php
/**
 * LuchaFit - Appointments API
 * 
 * Endpoint: /api/appointments.php
 * Métodos: GET, POST, PUT, DELETE
 * 
 * Gestiona citas/turnos del calendario
 */

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../utils/mail.php';

$db = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$mailService = new EmailService($db);

// ========================================
// GET - Obtener citas
// ========================================
if ($method === 'GET') {
    $appointmentId = $_GET['id'] ?? null;
    $clientId = $_GET['client_id'] ?? null;
    $date = $_GET['date'] ?? null;
    $status = $_GET['status'] ?? null;
    
    if ($appointmentId) {
        // Obtener cita específica
        $stmt = $db->prepare("SELECT * FROM appointments WHERE id = :id");
        $stmt->execute(['id' => $appointmentId]);
        $appointment = $stmt->fetch();
        
        if (!$appointment) {
            sendError('Cita no encontrada', 404);
        }
        
        sendSuccess($appointment);
        
    } else {
        // Construir query con filtros
        $query = "SELECT * FROM appointments WHERE 1=1";
        $params = [];
        
        if ($clientId) {
            $query .= " AND client_id = :client_id";
            $params['client_id'] = $clientId;
        }
        
        if ($date) {
            $query .= " AND date = :date";
            $params['date'] = $date;
        }
        
        if ($status) {
            $query .= " AND status = :status";
            $params['status'] = $status;
        }
        
        $query .= " ORDER BY date DESC, start_time ASC";
        
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $appointments = $stmt->fetchAll();
        
        sendSuccess($appointments);
    }
}

// ========================================
// POST - Crear nueva cita
// ========================================
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validar datos requeridos
    if (empty($data['client_name']) || empty($data['type']) || empty($data['date']) || 
        empty($data['start_time']) || empty($data['end_time'])) {
        sendError('client_name, type, date, start_time y end_time son requeridos', 400);
    }
    
    // Generar ID único
    $appointmentId = 'APT-' . uniqid();
    
    // Determinar color según tipo
    $colorClass = 'bg-primary/10 border-l-4 border-primary text-text-dark';
    switch ($data['type']) {
        case 'Evaluación Inicial':
            $colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
            break;
        case 'Seguimiento':
            $colorClass = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            break;
        case 'Control':
            $colorClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
            break;
        case 'Medición Antropométrica':
            $colorClass = 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
            break;
    }
    
    try {
        $stmt = $db->prepare("
            INSERT INTO appointments (
                id, client_id, client_name, email, type, date, start_time, end_time,
                status, notes, color_class
            ) VALUES (
                :id, :client_id, :client_name, :email, :type, :date, :start_time, :end_time,
                :status, :notes, :color_class
            )
        ");
        
        $stmt->execute([
            'id' => $appointmentId,
            'client_id' => $data['client_id'] ?? null,
            'client_name' => sanitizeInput($data['client_name']),
            'email' => $data['email'] ?? null,
            'type' => sanitizeInput($data['type']),
            'date' => $data['date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'status' => $data['status'] ?? 'pending',
            'notes' => $data['notes'] ?? null,
            'color_class' => $data['color_class'] ?? $colorClass
        ]);
        
        // Enviar email de confirmación si tiene email
        if (!empty($data['email'])) {
            $mailService->sendAppointmentConfirmation(
                $data['email'],
                $data['client_name'],
                [
                    'type' => $data['type'],
                    'date' => $data['date'],
                    'start_time' => $data['start_time'],
                    'end_time' => $data['end_time']
                ]
            );
        }
        
        sendSuccess([
            'id' => $appointmentId,
            'message' => 'Cita creada exitosamente'
        ], null, 201);
        
    } catch (PDOException $e) {
        sendError('Error al crear cita: ' . $e->getMessage(), 500);
    }
}

// ========================================
// PUT - Actualizar cita
// ========================================
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    $appointmentId = $_GET['id'] ?? $data['id'] ?? null;
    
    if (!$appointmentId) {
        sendError('ID de cita requerido', 400);
    }
    
    // Verificar que existe
    $stmt = $db->prepare("SELECT * FROM appointments WHERE id = :id");
    $stmt->execute(['id' => $appointmentId]);
    $existing = $stmt->fetch();
    
    if (!$existing) {
        sendError('Cita no encontrada', 404);
    }
    
    // Construir query de actualización
    $updateFields = [];
    $params = ['id' => $appointmentId];
    
    $allowedFields = [
        'client_id', 'client_name', 'email', 'type', 'date', 
        'start_time', 'end_time', 'status', 'notes', 'color_class'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updateFields[] = "$field = :$field";
            $params[$field] = $data[$field];
        }
    }
    
    if (empty($updateFields)) {
        sendError('No hay campos para actualizar', 400);
    }
    
    try {
        $query = "UPDATE appointments SET " . implode(', ', $updateFields) . " WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->execute($params);
        
        // Si se confirmó la cita, enviar email
        if (isset($data['status']) && $data['status'] === 'pending' && $existing['status'] === 'pending_approval') {
            if (!empty($existing['email'])) {
                $mailService->sendAppointmentConfirmation(
                    $existing['email'],
                    $existing['client_name'],
                    [
                        'type' => $existing['type'],
                        'date' => $existing['date'],
                        'start_time' => $existing['start_time'],
                        'end_time' => $existing['end_time']
                    ]
                );
            }
        }
        
        sendSuccess([
            'id' => $appointmentId,
            'message' => 'Cita actualizada exitosamente'
        ]);
        
    } catch (PDOException $e) {
        sendError('Error al actualizar cita: ' . $e->getMessage(), 500);
    }
}

// ========================================
// DELETE - Eliminar/Cancelar cita
// ========================================
if ($method === 'DELETE') {
    $appointmentId = $_GET['id'] ?? null;
    $cancel = $_GET['cancel'] ?? false; // Si true, solo cambia status a 'cancelled'
    
    if (!$appointmentId) {
        sendError('ID de cita requerido', 400);
    }
    
    // Verificar que existe
    $stmt = $db->prepare("SELECT * FROM appointments WHERE id = :id");
    $stmt->execute(['id' => $appointmentId]);
    $appointment = $stmt->fetch();
    
    if (!$appointment) {
        sendError('Cita no encontrada', 404);
    }
    
    try {
        if ($cancel) {
            // Solo marcar como cancelada
            $stmt = $db->prepare("UPDATE appointments SET status = 'cancelled' WHERE id = :id");
            $stmt->execute(['id' => $appointmentId]);
            
            sendSuccess(['message' => 'Cita cancelada exitosamente']);
        } else {
            // Eliminar permanentemente
            $stmt = $db->prepare("DELETE FROM appointments WHERE id = :id");
            $stmt->execute(['id' => $appointmentId]);
            
            sendSuccess(['message' => 'Cita eliminada exitosamente']);
        }
        
    } catch (PDOException $e) {
        sendError('Error al procesar cita: ' . $e->getMessage(), 500);
    }
}

sendError('Método no permitido', 405);
?>
