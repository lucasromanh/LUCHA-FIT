# Instrucciones de Deploy - LuchaFit

## 📦 Construcción del Frontend

```bash
npm run build
```

Esto generará la carpeta `dist/` con todos los archivos compilados.

## 🚀 Subir al Servidor Hostinger

### Estructura en el servidor:

```
public_html/
└── luchafit/
    ├── .htaccess          # Configuración Apache (ya existe)
    ├── index.html         # Desde dist/
    ├── assets/            # Desde dist/assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    ├── api/               # Backend PHP (ya existe)
    │   ├── auth.php
    │   ├── clients.php
    │   ├── measurements.php
    │   ├── routines.php
    │   └── appointments.php
    └── config/            # Configuración backend
        └── db.php
```

### Pasos para subir el frontend:

1. **Conéctate por FTP/SFTP a Hostinger**

   - Host: Tu dominio o IP del servidor
   - Usuario: Tu usuario de hosting
   - Puerto: 21 (FTP) o 22 (SFTP)

2. **Navega a `/public_html/luchafit/`**

3. **Sube estos archivos desde `dist/`:**

   - `index.html` → Raíz de `/luchafit/`
   - `.htaccess` → Raíz de `/luchafit/`
   - Carpeta `assets/` → `/luchafit/assets/`
   - Si hay `favicon.ico` → `/luchafit/`

4. **Verifica permisos:**
   - Archivos: 644
   - Carpetas: 755

### URLs finales:

- Frontend: `https://saltacoders.com/luchafit/`
- API: `https://saltacoders.com/luchafit/api/`

## ⚠️ IMPORTANTE

- **NO borres** la carpeta `api/` ni `config/` del servidor
- El `.htaccess` redirige todas las rutas al index.html (React Router)
- Los archivos en `assets/` tienen hash en el nombre para evitar caché

## 🧪 Verificar Deploy

Después de subir, prueba:

1. https://saltacoders.com/luchafit/ → Debería cargar el login
2. https://saltacoders.com/luchafit/clients → React Router funciona
3. Login con credenciales de prueba

## 🔧 Solución de problemas

**403 Forbidden:**

- Verifica que `.htaccess` esté en `/luchafit/`
- Verifica permisos: `chmod 644 .htaccess`
- Verifica que `index.html` exista

**Archivos CSS/JS no cargan:**

- Verifica ruta en `index.html` (debe ser relativa: `./assets/...`)
- Verifica que carpeta `assets/` se subió completa

**API no responde:**

- El backend ya está funcionando en `/luchafit/api/`
- Verifica en DevTools → Network que las peticiones vayan a la URL correcta
