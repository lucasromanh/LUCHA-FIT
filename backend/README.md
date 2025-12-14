# LuchaFit Backend API

Backend completo en PHP para el sistema LuchaFit de gestión nutricional y antropométrica.

## 📋 Tabla de Contenidos

- [Estructura de Archivos](#estructura-de-archivos)
- [Instalación en Hostinger](#instalación-en-hostinger)
- [Configuración](#configuración)
- [Endpoints de API](#endpoints-de-api)
- [Base de Datos](#base-de-datos)
- [Autenticación](#autenticación)
- [Manejo de Archivos](#manejo-de-archivos)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## 📁 Estructura de Archivos

```
backend/
├── config/
│   └── db.php                 # Configuración de base de datos y funciones helper
├── api/
│   ├── auth.php              # Autenticación y login
│   ├── clients.php           # CRUD de pacientes/clientes
│   ├── measurements.php      # CRUD de mediciones antropométricas
│   ├── routines.php          # CRUD de rutinas de entrenamiento
│   └── appointments.php      # CRUD de citas/calendario
├── utils/
│   ├── calculations.php      # Cálculos antropométricos (BMI, Somatotipo, Z-Scores)
│   ├── mail.php              # Envío de emails con Gmail SMTP
│   └── upload.php            # Manejo de uploads de imágenes
├── uploads/
│   ├── profiles/             # Imágenes de perfil de clientes
│   └── measurements/         # Imágenes de mediciones
├── database_setup.md         # Script SQL para crear la base de datos
└── README.md                 # Este archivo
```

---

## 🚀 Instalación en Hostinger

### Paso 1: Subir Archivos

1. Accede a tu panel de Hostinger
2. Abre el **Administrador de Archivos** (File Manager)
3. Navega a la carpeta `public_html/` o donde quieras instalar el backend
4. Crea una carpeta llamada `api/` (o `backend/`)
5. Sube todos los archivos de la carpeta `backend/` manteniendo la estructura

### Paso 2: Crear Base de Datos

1. En el panel de Hostinger, ve a **Bases de Datos MySQL**
2. Haz clic en **Crear nueva base de datos**
3. Nombre: `luchafit_db` (o el que prefieras)
4. Anota el **nombre de usuario** y **contraseña** de MySQL
5. Haz clic en **phpMyAdmin**
6. Selecciona la base de datos creada
7. Ve a la pestaña **SQL**
8. Abre el archivo `database_setup.md` de este repositorio
9. Copia todo el código SQL del archivo
10. Pégalo en phpMyAdmin y haz clic en **Continuar**

### Paso 3: Configurar Conexión a Base de Datos

1. Abre el archivo `config/db.php`
2. Edita las siguientes líneas con tus credenciales:

```php
define('DB_HOST', 'localhost');          // Generalmente es 'localhost'
define('DB_NAME', 'luchafit_db');        // Tu nombre de base de datos
define('DB_USER', 'tu_usuario_mysql');   // Tu usuario de MySQL
define('DB_PASS', 'tu_contraseña_mysql');// Tu contraseña de MySQL
```

### Paso 4: Configurar Permisos de Carpetas

En el Administrador de Archivos, cambia los permisos de la carpeta `uploads/`:

1. Haz clic derecho en la carpeta `uploads/`
2. Selecciona **Permisos**
3. Establece **755** o **777** (para permitir escritura)

### Paso 5: Probar la Instalación

Accede a: `https://tu-dominio.com/api/auth.php` (método GET)

Deberías ver un error de "Token no proporcionado" (esto es normal y significa que la API está funcionando).

---

## ⚙️ Configuración

### Configurar Email (Gmail SMTP)

Para que funcione el envío de correos, necesitas configurar Gmail:

1. **Activa la verificación en 2 pasos** en tu cuenta de Gmail
2. **Genera una contraseña de aplicación**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro"
   - Copia la contraseña generada (16 caracteres)
3. Abre `utils/mail.php` y reemplaza:

```php
private const SMTP_PASS = 'Frijolito01'; // ⚠️ Reemplazar con la contraseña de aplicación
```

**Alternativa**: Si Hostinger bloquea Gmail SMTP, usa el SMTP de Hostinger:

- Host: `smtp.hostinger.com`
- Puerto: `587`
- Usuario: tu email de Hostinger
- Contraseña: tu contraseña de email

### Configurar CORS (si el frontend está en otro dominio)

En `config/db.php`, cambia:

```php
header('Access-Control-Allow-Origin: *'); // Cambiar * por tu dominio
```

A:

```php
header('Access-Control-Allow-Origin: https://tu-dominio.com');
```

---

## 🔌 Endpoints de API

Todas las respuestas son en formato JSON.

### 🔐 Autenticación

#### POST `/api/auth.php` - Login

```json
// Request
{
  "email": "Luchafit.nut@gmail.com",
  "password": "Frijolito01"
}

// Response
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "USR-PROF-001",
      "email": "Luchafit.nut@gmail.com",
      "name": "Luciana Milagros Burgos",
      "role": "professional"
    }
  }
}
```

#### GET `/api/auth.php` - Verificar Token

```http
GET /api/auth.php
Authorization: Bearer <token>

// Response
{
  "success": true,
  "data": {
    "user": { ... },
    "valid": true
  }
}
```

---

### 👥 Clientes/Pacientes

#### GET `/api/clients.php` - Listar todos los clientes

```http
GET /api/clients.php

// Filtros opcionales:
GET /api/clients.php?status=Activo
GET /api/clients.php?search=Juan
```

#### GET `/api/clients.php?id=C-1024` - Obtener un cliente

```http
GET /api/clients.php?id=C-1024
```

#### POST `/api/clients.php` - Crear cliente

```json
{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "phone": "+54 9 11 1234-5678",
  "age": 28,
  "gender": "Masculino",
  "weight": 78.5,
  "goal": "Hipertrofia",
  "status": "Activo",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Opcional
}
```

**Con imagen multipart/form-data:**

```http
POST /api/clients.php
Content-Type: multipart/form-data

name=Juan Pérez
email=juan@email.com
image=<file>
```

#### PUT `/api/clients.php?id=C-1024` - Actualizar cliente

```json
{
  "weight": 79.0,
  "weight_diff": 0.5,
  "status": "Activo"
}
```

#### DELETE `/api/clients.php?id=C-1024` - Eliminar cliente

---

### 📏 Mediciones Antropométricas

#### GET `/api/measurements.php` - Listar mediciones

```http
GET /api/measurements.php
GET /api/measurements.php?client_id=C-1024
GET /api/measurements.php?id=MED-123
```

#### POST `/api/measurements.php` - Crear medición

```json
{
  "client_id": "C-1024",
  "evaluator": "Luciana Milagros Burgos",
  "date": "2024-12-14",
  "mass": 78.5,
  "stature": 175.0,
  "sitting_height": 92.0,
  "arm_span": 177.0,
  "triceps": 12.5,
  "subscapular": 15.2,
  "biceps": 6.8,
  "iliac_crest": 18.5,
  "supraspinale": 12.0,
  "abdominal": 22.5,
  "thigh": 20.0,
  "calf": 10.5,
  "arm_relaxed": 28.0,
  "arm_flexed": 30.5,
  "waist": 80.0,
  "hips": 96.0,
  "mid_thigh": 55.0,
  "calf_girth": 37.0,
  "humerus": 6.5,
  "bistyloid": 5.2,
  "femur": 9.0,
  "imagesBase64": ["data:image/jpeg;base64,..."] // Opcional
}

// Response incluye cálculos automáticos:
{
  "success": true,
  "data": {
    "id": "MED-xyz123",
    "calculations": {
      "bmi": 25.63,
      "body_fat_percent": 18.45,
      "fat_mass": 14.48,
      "lean_mass": 64.02,
      "endomorphy": 4.2,
      "mesomorphy": 5.8,
      "ectomorphy": 2.1,
      "x": -2.1,
      "y": 5.4
    }
  }
}
```

#### PUT `/api/measurements.php?id=MED-123` - Actualizar medición

```json
{
  "mass": 79.0,
  "triceps": 12.0
}
// Los cálculos se actualizan automáticamente
```

#### DELETE `/api/measurements.php?id=MED-123` - Eliminar medición

---

### 💪 Rutinas de Entrenamiento

#### GET `/api/routines.php` - Listar rutinas

```http
GET /api/routines.php
GET /api/routines.php?patient_id=C-1024
GET /api/routines.php?id=RTN-123
```

#### POST `/api/routines.php` - Crear rutina

```json
{
  "patient_id": "C-1024",
  "title": "Hipertrofia Full Body",
  "objective": "Ganancia de masa muscular",
  "sport": "Culturismo",
  "level": "Intermedio",
  "frequency": "4x semana",
  "start_date": "2024-12-15",
  "status": "active",
  "sessions": [
    {
      "label": "Lunes - Tren Superior",
      "exercises": [
        {
          "block": "warmup",
          "name": "Movilidad articular",
          "sets": 1,
          "reps": "5 min",
          "load": "-",
          "rest": "-"
        },
        {
          "block": "main",
          "name": "Press Banca",
          "sets": 4,
          "reps": "8-10",
          "load": "80kg",
          "rest": "120s",
          "notes": "Tempo 2-0-1-0"
        },
        {
          "block": "main",
          "name": "Remo con Barra",
          "sets": 4,
          "reps": "8-10",
          "load": "70kg",
          "rest": "120s"
        }
      ]
    },
    {
      "label": "Miércoles - Tren Inferior",
      "exercises": [
        {
          "block": "main",
          "name": "Sentadilla",
          "sets": 5,
          "reps": "6-8",
          "load": "100kg",
          "rest": "180s"
        }
      ]
    }
  ]
}
```

#### PUT `/api/routines.php?id=RTN-123` - Actualizar rutina

```json
{
  "title": "Nuevo título",
  "status": "archived",
  "sessions": [ ... ] // Se reemplazan completamente
}
```

#### DELETE `/api/routines.php?id=RTN-123` - Eliminar rutina

---

### 📅 Citas/Calendario

#### GET `/api/appointments.php` - Listar citas

```http
GET /api/appointments.php
GET /api/appointments.php?client_id=C-1024
GET /api/appointments.php?date=2024-12-15
GET /api/appointments.php?status=pending
```

#### POST `/api/appointments.php` - Crear cita

```json
{
  "client_id": "C-1024",
  "client_name": "Juan Pérez",
  "email": "juan@email.com",
  "type": "Evaluación Inicial",
  "date": "2024-12-20",
  "start_time": "14:30:00",
  "end_time": "15:30:00",
  "status": "pending",
  "notes": "Primera consulta"
}

// Se envía email de confirmación automáticamente si tiene email
```

#### PUT `/api/appointments.php?id=APT-123` - Actualizar cita

```json
{
  "status": "completed",
  "notes": "Cita realizada exitosamente"
}
```

#### DELETE `/api/appointments.php?id=APT-123` - Eliminar cita

```http
DELETE /api/appointments.php?id=APT-123           // Elimina permanentemente
DELETE /api/appointments.php?id=APT-123&cancel=1  // Solo marca como cancelada
```

---

## 🗄️ Base de Datos

### Tablas Principales

- **users**: Usuarios del sistema (profesionales, admins)
- **clients**: Pacientes con datos personales, clínicos y antropométricos
- **measurements**: Mediciones antropométricas con cálculos automáticos
- **routines**: Planes de entrenamiento
- **routine_sessions**: Sesiones/días de cada rutina
- **routine_exercises**: Ejercicios individuales
- **appointments**: Sistema de citas/calendario
- **email_logs**: Registro de correos enviados

Ver el archivo `database_setup.md` para el esquema completo.

---

## 🔒 Autenticación

### Credenciales Hardcodeadas (como solicitado)

```
Email: Luchafit.nut@gmail.com
Contraseña: Frijolito01
```

### Uso del Token

Una vez autenticado, incluye el token en todas las peticiones:

```http
Authorization: Bearer <token>
```

**Nota**: El sistema actual usa un token simple basado en base64. Para producción, se recomienda implementar JWT.

---

## 📤 Manejo de Archivos

### Subir Imágenes

**Método 1: Multipart/Form-Data**

```javascript
const formData = new FormData();
formData.append("name", "Juan Pérez");
formData.append("image", fileInput.files[0]);

fetch("https://tu-dominio.com/api/clients.php", {
  method: "POST",
  body: formData,
});
```

**Método 2: Base64 en JSON**

```javascript
const base64Image = await convertToBase64(file);

fetch("https://tu-dominio.com/api/clients.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Juan Pérez",
    imageBase64: base64Image,
  }),
});
```

### Rutas de Imágenes

Las imágenes se guardan en:

- Perfiles: `uploads/profiles/`
- Mediciones: `uploads/measurements/`

URL de acceso: `https://tu-dominio.com/api/uploads/profiles/filename.jpg`

---

## 💡 Ejemplos de Uso

### JavaScript/Fetch

```javascript
// Login
const login = async (email, password) => {
  const response = await fetch("https://tu-dominio.com/api/auth.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem("token", data.data.token);
  }
  return data;
};

// Obtener clientes
const getClients = async () => {
  const token = localStorage.getItem("token");
  const response = await fetch("https://tu-dominio.com/api/clients.php", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
};

// Crear medición
const createMeasurement = async (data) => {
  const token = localStorage.getItem("token");
  const response = await fetch("https://tu-dominio.com/api/measurements.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return await response.json();
};
```

### React/TypeScript

```typescript
const API_BASE = "https://tu-dominio.com/api";

const api = {
  async get(endpoint: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async post(endpoint: string, data: any) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

// Uso
const clients = await api.get("clients.php");
const newClient = await api.post("clients.php", { name: "Juan" });
```

---

## 🛠️ Utilidades Incluidas

### Cálculos Antropométricos (`utils/calculations.php`)

```php
// BMI
AnthroCalculations::calculateBMI($mass, $stature);

// Somatotipo
AnthroCalculations::calculateSomatotype($data);

// Z-Score
AnthroCalculations::calculateZScore($value, 'triceps');

// Composición corporal completa
AnthroCalculations::calculateBodyComposition($data);

// Distribución adiposa
AnthroCalculations::calculateAdiposeDistribution($data);

// Gasto energético
AnthroCalculations::calculateBMR($mass, $stature, $age, $gender);
AnthroCalculations::calculateTDEE($bmr, 'moderate');
```

### Envío de Emails (`utils/mail.php`)

```php
$mailService = new EmailService($db);

// Email genérico
$mailService->sendEmail($to, $subject, $body);

// Confirmación de cita
$mailService->sendAppointmentConfirmation($email, $name, $appointmentData);

// Recordatorio de cita
$mailService->sendAppointmentReminder($email, $name, $appointmentData);

// Informe antropométrico
$mailService->sendAnthropometricReport($email, $name, $pdfUrl);

// Bienvenida
$mailService->sendWelcomeEmail($email, $name);
```

---

## 🐛 Solución de Problemas

### Error de conexión a base de datos

- Verifica las credenciales en `config/db.php`
- Asegúrate de que la base de datos existe
- Verifica que el usuario tiene permisos

### Error al subir imágenes

- Verifica permisos de carpeta `uploads/` (755 o 777)
- Verifica que existe la carpeta `uploads/profiles/` y `uploads/measurements/`
- Revisa el límite de tamaño en `php.ini` (`upload_max_filesize`)

### Emails no se envían

- Genera una contraseña de aplicación de Gmail
- Si Hostinger bloquea Gmail, usa el SMTP de Hostinger
- Verifica que PHPMailer esté instalado

### CORS errors

- Actualiza el header `Access-Control-Allow-Origin` en `config/db.php`
- Asegúrate de que el dominio del frontend está permitido

---

## 📞 Soporte

Para problemas o consultas:

- Email: Luchafit.nut@gmail.com

---

## ✅ Checklist de Instalación

- [ ] Archivos subidos a Hostinger
- [ ] Base de datos creada
- [ ] Script SQL ejecutado
- [ ] Credenciales configuradas en `config/db.php`
- [ ] Permisos de carpeta `uploads/` configurados
- [ ] Email SMTP configurado en `utils/mail.php`
- [ ] Prueba de login exitosa
- [ ] Prueba de creación de cliente exitosa

---

¡Tu backend LuchaFit está listo para usar! 🚀
