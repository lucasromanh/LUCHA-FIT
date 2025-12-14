<?php
/**
 * LuchaFit - Email Utility
 * 
 * Envío de emails usando Gmail SMTP
 * Requiere: PHPMailer (composer require phpmailer/phpmailer)
 * 
 * Si no tienes Composer en Hostinger, puedes descargar PHPMailer manualmente
 * desde: https://github.com/PHPMailer/PHPMailer/releases
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Si instalaste con Composer:
// require_once __DIR__ . '/../../vendor/autoload.php';

// Si descargaste manualmente, descomenta estas líneas:
require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

class EmailService {
    
    private $mailer;
    private $db;
    
    // Configuración de Gmail
    private const SMTP_HOST = 'smtp.gmail.com';
    private const SMTP_PORT = 587;
    private const SMTP_USER = 'Luchafit.nut@gmail.com';
    private const SMTP_PASS = 'ifsd cgkd hiht rpqu'; // Contraseña de aplicación de Google
    private const FROM_EMAIL = 'Luchafit.nut@gmail.com';
    private const FROM_NAME = 'LuchaFit - Nutrición Deportiva';
    
    public function __construct($dbConnection = null) {
        $this->db = $dbConnection;
        $this->mailer = new PHPMailer(true);
        $this->setupMailer();
    }
    
    /**
     * Configurar PHPMailer con credenciales de Gmail
     */
    private function setupMailer() {
        $this->mailer->isSMTP();
        $this->mailer->Host = self::SMTP_HOST;
        $this->mailer->SMTPAuth = true;
        $this->mailer->Username = self::SMTP_USER;
        $this->mailer->Password = self::SMTP_PASS;
        $this->mailer->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $this->mailer->Port = self::SMTP_PORT;
        $this->mailer->CharSet = 'UTF-8';
        $this->mailer->setFrom(self::FROM_EMAIL, self::FROM_NAME);
    }
    
    /**
     * Enviar email genérico
     */
    public function sendEmail($to, $subject, $body, $isHTML = true) {
        try {
            $this->mailer->clearAddresses();
            $this->mailer->addAddress($to);
            $this->mailer->isHTML($isHTML);
            $this->mailer->Subject = $subject;
            $this->mailer->Body = $body;
            
            $result = $this->mailer->send();
            
            // Registrar en base de datos si existe conexión
            if ($this->db) {
                $this->logEmail($to, $subject, $body, 'sent', null);
            }
            
            return ['success' => true, 'message' => 'Email enviado correctamente'];
            
        } catch (Exception $e) {
            $errorMsg = $this->mailer->ErrorInfo;
            
            // Registrar error en base de datos
            if ($this->db) {
                $this->logEmail($to, $subject, $body, 'failed', $errorMsg);
            }
            
            return [
                'success' => false,
                'error' => 'Error al enviar email',
                'details' => $errorMsg
            ];
        }
    }
    
    /**
     * Registrar email enviado en base de datos
     */
    private function logEmail($recipient, $subject, $body, $status, $error) {
        try {
            $stmt = $this->db->prepare("
                INSERT INTO email_logs (recipient, subject, body, status, error_message)
                VALUES (:recipient, :subject, :body, :status, :error)
            ");
            
            $stmt->execute([
                'recipient' => $recipient,
                'subject' => $subject,
                'body' => $body,
                'status' => $status,
                'error' => $error
            ]);
        } catch (Exception $e) {
            // Silenciar errores de log para no interrumpir el flujo
        }
    }
    
    /**
     * Enviar confirmación de cita
     */
    public function sendAppointmentConfirmation($clientEmail, $clientName, $appointmentData) {
        $subject = "Confirmación de Turno - LuchaFit";
        
        $body = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4ade80; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
                strong { color: #22c55e; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>✓ Turno Confirmado</h1>
                </div>
                <div class='content'>
                    <p>Hola <strong>{$clientName}</strong>,</p>
                    <p>Tu turno ha sido confirmado exitosamente.</p>
                    
                    <div class='info-box'>
                        <h3>📅 Detalles del Turno</h3>
                        <p><strong>Tipo:</strong> {$appointmentData['type']}</p>
                        <p><strong>Fecha:</strong> {$appointmentData['date']}</p>
                        <p><strong>Horario:</strong> {$appointmentData['start_time']} - {$appointmentData['end_time']}</p>
                    </div>
                    
                    <p>Por favor, llega 5 minutos antes de tu cita.</p>
                    <p>Si necesitas reprogramar o cancelar, contáctanos con al menos 24 horas de anticipación.</p>
                    
                    <p>¡Te esperamos!</p>
                    <p><strong>Equipo LuchaFit</strong></p>
                </div>
                <div class='footer'>
                    <p>LuchaFit - Nutrición Deportiva y Antropometría</p>
                    <p>Luciana Milagros Burgos - ISAK Nivel 1</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        return $this->sendEmail($clientEmail, $subject, $body);
    }
    
    /**
     * Enviar recordatorio de cita (24 horas antes)
     */
    public function sendAppointmentReminder($clientEmail, $clientName, $appointmentData) {
        $subject = "Recordatorio: Turno Mañana - LuchaFit";
        
        $body = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; }
                .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>⏰ Recordatorio de Turno</h1>
                </div>
                <div class='content'>
                    <p>Hola <strong>{$clientName}</strong>,</p>
                    <p>Te recordamos que tienes un turno programado para mañana:</p>
                    
                    <div class='info-box'>
                        <h3>📅 Detalles</h3>
                        <p><strong>Tipo:</strong> {$appointmentData['type']}</p>
                        <p><strong>Fecha:</strong> {$appointmentData['date']}</p>
                        <p><strong>Horario:</strong> {$appointmentData['start_time']} - {$appointmentData['end_time']}</p>
                    </div>
                    
                    <p>¡Nos vemos pronto!</p>
                    <p><strong>Equipo LuchaFit</strong></p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        return $this->sendEmail($clientEmail, $subject, $body);
    }
    
    /**
     * Enviar informe antropométrico por email
     */
    public function sendAnthropometricReport($clientEmail, $clientName, $pdfUrl) {
        $subject = "Tu Informe Antropométrico - LuchaFit";
        
        $body = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .btn { display: inline-block; background: #4ade80; color: white; padding: 15px 30px;
                       text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
                .btn:hover { background: #22c55e; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>📊 Informe Antropométrico</h1>
                </div>
                <div class='content'>
                    <p>Hola <strong>{$clientName}</strong>,</p>
                    <p>Adjunto encontrarás tu informe antropométrico completo con todas las mediciones y análisis realizados.</p>
                    
                    <p style='text-align: center;'>
                        <a href='{$pdfUrl}' class='btn'>Descargar Informe PDF</a>
                    </p>
                    
                    <p>Este informe incluye:</p>
                    <ul>
                        <li>Mediciones antropométricas completas</li>
                        <li>Análisis de composición corporal</li>
                        <li>Somatotipo y Z-Scores</li>
                        <li>Gráficos comparativos</li>
                        <li>Interpretaciones y recomendaciones</li>
                    </ul>
                    
                    <p>Si tienes alguna consulta sobre los resultados, no dudes en contactarnos.</p>
                    
                    <p>Saludos,</p>
                    <p><strong>Luciana Milagros Burgos</strong><br>
                    ISAK Nivel 1</p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        return $this->sendEmail($clientEmail, $subject, $body);
    }
    
    /**
     * Enviar bienvenida a nuevo cliente
     */
    public function sendWelcomeEmail($clientEmail, $clientName) {
        $subject = "¡Bienvenido a LuchaFit!";
        
        $body = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); 
                          color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h1>🎉 ¡Bienvenido!</h1>
                </div>
                <div class='content'>
                    <p>Hola <strong>{$clientName}</strong>,</p>
                    <p>¡Bienvenido a LuchaFit! Estamos muy contentos de que hayas decidido comenzar este camino hacia una mejor salud y rendimiento.</p>
                    
                    <p>En LuchaFit ofrecemos:</p>
                    <ul>
                        <li>Evaluaciones antropométricas ISAK</li>
                        <li>Planes nutricionales personalizados</li>
                        <li>Rutinas de entrenamiento adaptadas</li>
                        <li>Seguimiento continuo de tu progreso</li>
                    </ul>
                    
                    <p>Pronto nos pondremos en contacto contigo para agendar tu primera evaluación.</p>
                    
                    <p>¡Nos vemos pronto!</p>
                    <p><strong>Equipo LuchaFit</strong></p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        return $this->sendEmail($clientEmail, $subject, $body);
    }
}

/**
 * IMPORTANTE: Configuración de Gmail
 * 
 * Para que funcione el envío de emails con Gmail, debes:
 * 
 * 1. Activar la "Verificación en 2 pasos" en tu cuenta de Gmail
 * 2. Generar una "Contraseña de aplicación" específica:
 *    - Ve a: https://myaccount.google.com/apppasswords
 *    - Selecciona "Correo" y "Otro (nombre personalizado)"
 *    - Copia la contraseña generada (16 caracteres sin espacios)
 *    - Reemplaza 'Frijolito01' con esa contraseña en SMTP_PASS
 * 
 * 3. Si Hostinger no permite Gmail SMTP, alternativas:
 *    - Usar el SMTP de Hostinger directamente
 *    - Usar servicios como SendGrid, Mailgun, o Amazon SES
 */
?>
