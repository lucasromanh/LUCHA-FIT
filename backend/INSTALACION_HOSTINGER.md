# 🚀 Guía de Instalación en Hostinger

## 📋 Checklist de Instalación

### 1️⃣ Subir Archivos

- [x] Subir carpeta `backend/` completa a `public_html/luchafit/`
- [ ] Verificar que PHPMailer esté en `utils/PHPMailer/src/`
- [ ] Verificar permisos de carpeta `uploads/` (755 o 777)

### 2️⃣ Crear Base de Datos

- [ ] Ir a **Bases de Datos MySQL** en Hostinger
- [ ] Crear base de datos: `u895350652_luchafit_db`
- [ ] Usuario: `u895350652_luchafit_db`
- [ ] Contraseña: `Luchafit_db1`
- [ ] Abrir **phpMyAdmin**
- [ ] Seleccionar la base de datos
- [ ] Ir a pestaña **SQL**
- [ ] Copiar TODO el contenido de `database_setup.md`
- [ ] Pegar y hacer clic en **Continuar**

### 3️⃣ Verificar Configuración

✅ **Base de datos** (`config/db.php`):

```php
DB_HOST: localhost
DB_NAME: u895350652_luchafit_db
DB_USER: u895350652_luchafit_db
DB_PASS: Luchafit_db1
```

✅ **Email** (`utils/mail.php`):

```php
SMTP_USER: Luchafit.nut@gmail.com
SMTP_PASS: ifsd cgkd hiht rpqu
```

### 4️⃣ Pruebas

**Paso 1: Verificar Backend**

```
https://saltacoders.com/luchafit/test.php
```

Deberías ver un JSON con información del servidor.

**Paso 2: Verificar Base de Datos**

```
https://saltacoders.com/luchafit/test_db.php
```

Debe mostrar todas las tablas creadas.

**Paso 3: Verificar Email**

```
https://saltacoders.com/luchafit/test_email.php
```

Debe enviar un email de prueba.

**Paso 4: Probar Login**
Usar Postman o Thunder Client:

```http
POST https://saltacoders.com/luchafit/api/auth.php
Content-Type: application/json

{
  "email": "Luchafit.nut@gmail.com",
  "password": "Frijolito01"
}
```

Respuesta esperada:

```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "...",
    "user": { ... }
  }
}
```

---

## 🔧 Solución de Problemas

### Error: "No se puede conectar a la base de datos"

1. Verifica en `config/db.php` que las credenciales sean correctas
2. Asegúrate de que la base de datos exista en phpMyAdmin
3. Verifica que el usuario tenga todos los permisos

### Error: "Class 'PHPMailer\PHPMailer\PHPMailer' not found"

1. Verifica que la carpeta `PHPMailer/` exista en `utils/`
2. Debe tener la estructura: `utils/PHPMailer/src/PHPMailer.php`
3. Descarga desde: https://github.com/PHPMailer/PHPMailer/releases

### Error: "Permission denied" al subir imágenes

```bash
# En el File Manager de Hostinger, clic derecho en uploads/
# Cambiar permisos a 755 o 777
```

### Emails no se envían

1. Verifica que la contraseña de aplicación sea correcta: `ifsd cgkd hiht rpqu`
2. Si Hostinger bloquea Gmail, usa el SMTP de Hostinger:

```php
SMTP_HOST: smtp.hostinger.com
SMTP_PORT: 587
SMTP_USER: tu_email@tu-dominio.com
SMTP_PASS: tu_contraseña_email
```

---

## 📡 URLs de la API

Base URL: `https://saltacoders.com/luchafit/`

### Endpoints:

**Autenticación:**

- `POST /api/auth.php` - Login
- `GET /api/auth.php` - Verificar token

**Clientes:**

- `GET /api/clients.php` - Listar clientes
- `POST /api/clients.php` - Crear cliente
- `PUT /api/clients.php?id=C-1024` - Actualizar cliente
- `DELETE /api/clients.php?id=C-1024` - Eliminar cliente

**Mediciones:**

- `GET /api/measurements.php` - Listar mediciones
- `POST /api/measurements.php` - Crear medición
- `PUT /api/measurements.php?id=MED-123` - Actualizar medición
- `DELETE /api/measurements.php?id=MED-123` - Eliminar medición

**Rutinas:**

- `GET /api/routines.php` - Listar rutinas
- `POST /api/routines.php` - Crear rutina
- `PUT /api/routines.php?id=RTN-123` - Actualizar rutina
- `DELETE /api/routines.php?id=RTN-123` - Eliminar rutina

**Citas:**

- `GET /api/appointments.php` - Listar citas
- `POST /api/appointments.php` - Crear cita
- `PUT /api/appointments.php?id=APT-123` - Actualizar cita
- `DELETE /api/appointments.php?id=APT-123` - Eliminar cita

---

## 🔐 Credenciales de Prueba

**Login:**

```
Email: Luchafit.nut@gmail.com
Contraseña: Frijolito01
```

**Base de Datos:**

```
Host: localhost
Database: u895350652_luchafit_db
Usuario: u895350652_luchafit_db
Contraseña: Luchafit_db1
```

**Email SMTP:**

```
Host: smtp.gmail.com
Port: 587
Usuario: Luchafit.nut@gmail.com
Contraseña App: ifsd cgkd hiht rpqu
```

---

## ✅ Después de la Instalación

1. **Eliminar archivos de prueba** (opcional, después de verificar):

   - `test.php`
   - `test_db.php`
   - `test_email.php`

2. **Configurar el frontend** para usar la API:

   ```javascript
   const API_BASE = "https://saltacoders.com/luchafit/api";
   ```

3. **Verificar permisos** de la carpeta `uploads/`:

   - Debe ser `755` o `777` para permitir subida de imágenes

4. **Probar todas las funcionalidades**:
   - Login
   - Crear cliente
   - Crear medición
   - Crear rutina
   - Agendar cita

---

¡Tu backend está listo para usar! 🎉
