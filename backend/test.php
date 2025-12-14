<?php
/**
 * LuchaFit Backend - Archivo de prueba
 * 
 * Accede a este archivo para verificar que el backend está funcionando:
 * https://saltacoders.com/luchafit/test.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

echo json_encode([
    'success' => true,
    'message' => '¡Backend LuchaFit funcionando correctamente!',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'endpoints' => [
        'auth' => 'https://saltacoders.com/luchafit/api/auth.php',
        'clients' => 'https://saltacoders.com/luchafit/api/clients.php',
        'measurements' => 'https://saltacoders.com/luchafit/api/measurements.php',
        'routines' => 'https://saltacoders.com/luchafit/api/routines.php',
        'appointments' => 'https://saltacoders.com/luchafit/api/appointments.php'
    ],
    'instructions' => [
        '1. Prueba el login' => 'POST a /api/auth.php con email y password',
        '2. Verifica la base de datos' => 'Asegúrate de que las tablas existan en phpMyAdmin',
        '3. Revisa los permisos' => 'La carpeta uploads/ debe tener permisos 755 o 777'
    ]
], JSON_PRETTY_PRINT);
?>
