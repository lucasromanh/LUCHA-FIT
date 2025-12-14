<?php
/**
 * LuchaFit - Prueba de Conexión a Base de Datos
 * 
 * Verifica que la conexión a MySQL funcione
 * Accede a: https://saltacoders.com/luchafit/test_db.php
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// Configuración de base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'u895350652_luchafit_db');
define('DB_USER', 'u895350652_luchafit_db');
define('DB_PASS', 'Luchafit_db1');

try {
    // Conectar a la base de datos
    $db = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );
    
    // Verificar conexión
    $stmt = $db->query("SELECT VERSION() as version");
    $mysqlVersion = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Verificar tablas
    $stmt = $db->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $expectedTables = [
        'users',
        'clients',
        'measurements',
        'routines',
        'routine_sessions',
        'routine_exercises',
        'appointments',
        'email_logs'
    ];
    
    $missingTables = array_diff($expectedTables, $tables);
    
    echo json_encode([
        'success' => true,
        'message' => 'Conexión a base de datos exitosa',
        'mysql_version' => $mysqlVersion['version'],
        'database' => DB_NAME,
        'tables_found' => count($tables),
        'tables' => $tables,
        'expected_tables' => $expectedTables,
        'missing_tables' => array_values($missingTables),
        'status' => count($missingTables) === 0 ? 'Todas las tablas creadas ✓' : 'Faltan ' . count($missingTables) . ' tablas ⚠️',
        'instructions' => count($missingTables) > 0 ? [
            '1. Abre phpMyAdmin en Hostinger',
            '2. Selecciona la base de datos: ' . DB_NAME,
            '3. Ve a la pestaña SQL',
            '4. Copia y pega el contenido de database_setup.md',
            '5. Haz clic en Continuar'
        ] : []
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Error de conexión a la base de datos',
        'details' => $e->getMessage(),
        'config' => [
            'DB_HOST' => DB_HOST,
            'DB_NAME' => DB_NAME,
            'DB_USER' => DB_USER
        ],
        'help' => [
            '1. Verifica las credenciales en config/db.php',
            '2. Asegúrate de que la base de datos exista en phpMyAdmin',
            '3. Verifica que el usuario tenga permisos',
            '4. El error específico está arriba en "details"'
        ]
    ], JSON_PRETTY_PRINT);
}
?>
