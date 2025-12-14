<?php
/**
 * LuchaFit - Prueba de Email
 * 
 * Prueba el envío de emails con Gmail SMTP
 * Accede a: https://saltacoders.com/luchafit/test_email.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Verificar que PHPMailer exista
$phpmailerPath = __DIR__ . '/utils/PHPMailer/src/PHPMailer.php';

if (!file_exists($phpmailerPath)) {
    echo json_encode([
        'success' => false,
        'error' => 'PHPMailer no encontrado',
        'path_checked' => $phpmailerPath,
        'help' => [
            '1. Descarga PHPMailer desde: https://github.com/PHPMailer/PHPMailer/releases',
            '2. Extrae la carpeta "src" dentro de utils/PHPMailer/',
            '3. Debe quedar: utils/PHPMailer/src/PHPMailer.php'
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// Cargar PHPMailer
require_once __DIR__ . '/utils/PHPMailer/src/Exception.php';
require_once __DIR__ . '/utils/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/utils/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

try {
    
    // Crear instancia de PHPMailer
    $mail = new PHPMailer(true);
    
    // Configurar SMTP
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'Luchafit.nut@gmail.com';
    $mail->Password = 'ifsd cgkd hiht rpqu';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;
    $mail->CharSet = 'UTF-8';
    
    // Configurar email
    $mail->setFrom('Luchafit.nut@gmail.com', 'LuchaFit');
    $mail->addAddress('Luchafit.nut@gmail.com');
    $mail->isHTML(true);
    $mail->Subject = 'Prueba de Email - LuchaFit Backend';
    $mail->Body = '<h1>¡Funciona!</h1><p>El backend de LuchaFit está enviando emails correctamente.</p><p>Fecha: ' . date('Y-m-d H:i:s') . '</p>';
    
    // Enviar email
    $mail->send();
    
    echo json_encode([
        'success' => true,
        'message' => 'Email enviado correctamente',
        'timestamp' => date('Y-m-d H:i:s'),
        'smtp_config' => [
            'host' => 'smtp.gmail.com',
            'port' => 587,
            'user' => 'Luchafit.nut@gmail.com',
            'encryption' => 'STARTTLS',
            'password_length' => strlen('ifsd cgkd hiht rpqu')
        ]
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error en la prueba de email',
        'details' => $e->getMessage(),
        'help' => [
            '1. Verifica que PHPMailer esté en utils/PHPMailer/src/',
            '2. Asegúrate de que la contraseña de aplicación sea correcta',
            '3. Verifica que Hostinger permita conexiones SMTP salientes'
        ]
    ], JSON_PRETTY_PRINT);
}
?>
