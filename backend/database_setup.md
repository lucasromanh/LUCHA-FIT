# Script de Creación de Base de Datos - LuchaFit

Este script SQL debe ejecutarse en phpMyAdmin de Hostinger para crear toda la estructura de la base de datos.

## Instrucciones de Instalación

1. Accede a phpMyAdmin en tu panel de Hostinger
2. Crea una nueva base de datos llamada `luchafit_db`
3. Selecciona la base de datos creada
4. Ve a la pestaña "SQL"
5. Copia y pega todo el contenido de abajo
6. Haz clic en "Continuar" para ejecutar

---

## Script SQL Completo

```sql
-- ========================================
-- LUCHAFIT DATABASE SETUP
-- Sistema de Gestión Nutricional y Antropométrica
-- ========================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- ========================================
-- TABLA: users (Usuarios del sistema)
-- ========================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'professional', 'client') DEFAULT 'professional',
  `status` ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (`email`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuario profesional por defecto
INSERT INTO `users` (`id`, `email`, `password`, `name`, `role`, `status`) VALUES
('USR-PROF-001', 'Luchafit.nut@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Luciana Milagros Burgos', 'professional', 'active');
-- Password: Frijolito01 (hasheado con bcrypt)

-- ========================================
-- TABLA: clients (Pacientes/Clientes)
-- ========================================
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(50) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `birth_date` DATE DEFAULT NULL,
  `age` INT DEFAULT NULL,
  `gender` ENUM('Masculino', 'Femenino', 'Otro') DEFAULT 'Otro',
  `image` VARCHAR(500) DEFAULT NULL,
  `weight` DECIMAL(5,2) DEFAULT NULL,
  `weight_diff` DECIMAL(5,2) DEFAULT 0.00,
  `last_visit` DATE DEFAULT NULL,
  `status` ENUM('Activo', 'Inactivo', 'Pendiente') DEFAULT 'Pendiente',
  `goal` VARCHAR(255) DEFAULT NULL,
  `body_fat` DECIMAL(5,2) DEFAULT NULL,

  -- Anthropometry fields
  `race` VARCHAR(100) DEFAULT NULL,
  `hand_dominance` VARCHAR(20) DEFAULT NULL,
  `foot_dominance` VARCHAR(20) DEFAULT NULL,
  `activity_type` VARCHAR(100) DEFAULT NULL,
  `activity_intensity` VARCHAR(100) DEFAULT NULL,
  `activity_frequency` VARCHAR(100) DEFAULT NULL,
  `competition_level` VARCHAR(100) DEFAULT NULL,

  -- Sports
  `sports` JSON DEFAULT NULL,
  `position` VARCHAR(100) DEFAULT NULL,

  -- Mass history
  `mass_max` DECIMAL(5,2) DEFAULT NULL,
  `mass_min` DECIMAL(5,2) DEFAULT NULL,

  -- Clinical
  `nutritionist` VARCHAR(255) DEFAULT NULL,
  `pathologies` TEXT DEFAULT NULL,
  `surgeries` TEXT DEFAULT NULL,
  `medication` TEXT DEFAULT NULL,

  `created_by` VARCHAR(50) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (`status`),
  INDEX idx_created_by (`created_by`),
  INDEX idx_email (`email`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: measurements (Mediciones Antropométricas)
-- ========================================
CREATE TABLE IF NOT EXISTS `measurements` (
  `id` VARCHAR(50) PRIMARY KEY,
  `client_id` VARCHAR(50) NOT NULL,
  `evaluator` VARCHAR(255) NOT NULL,
  `date` DATE NOT NULL,

  -- Basic measurements
  `mass` DECIMAL(5,2) DEFAULT NULL,
  `stature` DECIMAL(5,2) DEFAULT NULL,
  `sitting_height` DECIMAL(5,2) DEFAULT NULL,
  `arm_span` DECIMAL(5,2) DEFAULT NULL,

  -- Skinfolds (mm)
  `triceps` DECIMAL(5,2) DEFAULT NULL,
  `subscapular` DECIMAL(5,2) DEFAULT NULL,
  `biceps` DECIMAL(5,2) DEFAULT NULL,
  `iliac_crest` DECIMAL(5,2) DEFAULT NULL,
  `supraspinale` DECIMAL(5,2) DEFAULT NULL,
  `abdominal` DECIMAL(5,2) DEFAULT NULL,
  `thigh` DECIMAL(5,2) DEFAULT NULL,
  `calf` DECIMAL(5,2) DEFAULT NULL,

  -- Girths/Perimeters (cm)
  `arm_relaxed` DECIMAL(5,2) DEFAULT NULL,
  `arm_flexed` DECIMAL(5,2) DEFAULT NULL,
  `waist` DECIMAL(5,2) DEFAULT NULL,
  `hips` DECIMAL(5,2) DEFAULT NULL,
  `mid_thigh` DECIMAL(5,2) DEFAULT NULL,
  `calf_girth` DECIMAL(5,2) DEFAULT NULL,

  -- Breadths (cm)
  `humerus` DECIMAL(5,2) DEFAULT NULL,
  `bistyloid` DECIMAL(5,2) DEFAULT NULL,
  `femur` DECIMAL(5,2) DEFAULT NULL,

  -- Calculated values (stored for performance)
  `bmi` DECIMAL(5,2) DEFAULT NULL,
  `body_fat_percent` DECIMAL(5,2) DEFAULT NULL,
  `somatotype_endo` DECIMAL(5,2) DEFAULT NULL,
  `somatotype_meso` DECIMAL(5,2) DEFAULT NULL,
  `somatotype_ecto` DECIMAL(5,2) DEFAULT NULL,

  -- Images (JSON array of URLs)
  `images` JSON DEFAULT NULL,

  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_client_id (`client_id`),
  INDEX idx_date (`date`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: routines (Planes de Entrenamiento)
-- ========================================
CREATE TABLE IF NOT EXISTS `routines` (
  `id` VARCHAR(50) PRIMARY KEY,
  `patient_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `objective` TEXT DEFAULT NULL,
  `sport` VARCHAR(100) DEFAULT NULL,
  `level` VARCHAR(50) DEFAULT NULL,
  `frequency` VARCHAR(100) DEFAULT NULL,
  `start_date` DATE DEFAULT NULL,
  `end_date` DATE DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `status` ENUM('draft', 'active', 'archived') DEFAULT 'draft',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_patient_id (`patient_id`),
  INDEX idx_status (`status`),
  FOREIGN KEY (`patient_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: routine_sessions (Sesiones de Entrenamiento)
-- ========================================
CREATE TABLE IF NOT EXISTS `routine_sessions` (
  `id` VARCHAR(50) PRIMARY KEY,
  `routine_id` VARCHAR(50) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `order_index` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_routine_id (`routine_id`),
  FOREIGN KEY (`routine_id`) REFERENCES `routines`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: routine_exercises (Ejercicios)
-- ========================================
CREATE TABLE IF NOT EXISTS `routine_exercises` (
  `id` VARCHAR(50) PRIMARY KEY,
  `session_id` VARCHAR(50) NOT NULL,
  `block` ENUM('warmup', 'main', 'accessory', 'cooldown') DEFAULT 'main',
  `name` VARCHAR(255) NOT NULL,
  `sets` INT DEFAULT 3,
  `reps` VARCHAR(50) DEFAULT NULL,
  `load` VARCHAR(50) DEFAULT NULL,
  `rest` VARCHAR(50) DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `order_index` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_session_id (`session_id`),
  INDEX idx_block (`block`),
  FOREIGN KEY (`session_id`) REFERENCES `routine_sessions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: appointments (Citas/Turnos)
-- ========================================
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` VARCHAR(50) PRIMARY KEY,
  `client_id` VARCHAR(50) DEFAULT NULL,
  `client_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `status` ENUM('pending', 'completed', 'cancelled', 'pending_approval') DEFAULT 'pending',
  `notes` TEXT DEFAULT NULL,
  `color_class` VARCHAR(255) DEFAULT 'bg-primary/10 border-l-4 border-primary text-text-dark',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_client_id (`client_id`),
  INDEX idx_date (`date`),
  INDEX idx_status (`status`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: email_logs (Registro de emails enviados)
-- ========================================
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `recipient` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `body` TEXT NOT NULL,
  `status` ENUM('sent', 'failed') DEFAULT 'sent',
  `error_message` TEXT DEFAULT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_recipient (`recipient`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- DATOS DE PRUEBA (OPCIONALES)
-- ========================================

-- Clientes de ejemplo
INSERT INTO `clients` (`id`, `name`, `email`, `age`, `gender`, `weight`, `status`, `goal`, `body_fat`, `last_visit`) VALUES
('C-1024', 'Juan Pérez', 'juan.perez@email.com', 28, 'Masculino', 78.50, 'Activo', 'Hipertrofia', 12.50, '2023-10-12'),
('C-1025', 'María González', 'maria.gonzalez@email.com', 34, 'Femenino', 62.10, 'Activo', 'Pérdida de grasa', 24.20, '2023-10-05'),
('C-0998', 'Carlos Ruiz', 'carlos.ruiz@email.com', 45, 'Masculino', 90.20, 'Pendiente', 'Mantenimiento', 18.00, '2023-09-28');

-- Citas de ejemplo
INSERT INTO `appointments` (`id`, `client_id`, `client_name`, `type`, `date`, `start_time`, `end_time`, `status`) VALUES
('APT-001', 'C-1024', 'Juan Pérez', 'Evaluación Inicial', '2024-12-20', '14:30:00', '15:30:00', 'pending'),
('APT-002', 'C-1025', 'María González', 'Seguimiento', '2024-12-21', '10:00:00', '11:00:00', 'pending');

COMMIT;

-- ========================================
-- FIN DEL SCRIPT
-- ========================================
```

## Notas Importantes

### Configuración Post-Instalación

1. **Actualizar credenciales en `config/db.php`:**

   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'luchafit_db');
   define('DB_USER', 'tu_usuario_mysql');
   define('DB_PASS', 'tu_contraseña_mysql');
   ```

2. **Cambiar el hash de contraseña:**
   El usuario profesional tiene la contraseña `Frijolito01` hasheada con bcrypt.
   Si necesitas cambiarla, usa este código PHP:

   ```php
   echo password_hash('NuevaContraseña', PASSWORD_BCRYPT);
   ```

3. **Permisos de carpetas:**
   Asegúrate de que la carpeta `backend/uploads/` tenga permisos de escritura (755 o 777).

4. **Configurar CORS:**
   Si el frontend está en un dominio diferente, actualiza el origen permitido en `config/db.php`.

### Estructura de Tablas

- **users**: Usuarios del sistema (profesionales, admins)
- **clients**: Pacientes con todos sus datos personales y clínicos
- **measurements**: Mediciones antropométricas con cálculos almacenados
- **routines**: Planes de entrenamiento
- **routine_sessions**: Sesiones/días de cada rutina
- **routine_exercises**: Ejercicios individuales de cada sesión
- **appointments**: Sistema de citas/calendario
- **email_logs**: Registro de correos enviados

### Índices y Optimización

El script incluye índices en:

- Claves foráneas para joins rápidos
- Campos de búsqueda frecuente (email, status, date)
- Campos de filtrado (client_id, date, status)

### Backup Recomendado

Antes de hacer cambios importantes:

```sql
-- Exportar toda la base de datos
mysqldump -u usuario -p luchafit_db > backup_luchafit.sql

-- Restaurar desde backup
mysql -u usuario -p luchafit_db < backup_luchafit.sql
```
