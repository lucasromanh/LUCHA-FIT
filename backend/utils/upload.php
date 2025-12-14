<?php
/**
 * LuchaFit - Upload Utility
 * 
 * Manejo de uploads de imágenes (perfil, mediciones)
 */

class UploadHandler {
    
    private $uploadDir;
    private $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    private $maxFileSize = 5 * 1024 * 1024; // 5MB
    
    public function __construct($uploadDir = null) {
        $this->uploadDir = $uploadDir ?? __DIR__ . '/../uploads/';
        
        // Crear directorio si no existe
        if (!file_exists($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    /**
     * Subir una imagen
     */
    public function uploadImage($file, $subfolder = '') {
        try {
            // Validar que existe el archivo
            if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
                return [
                    'success' => false,
                    'error' => 'No se recibió ningún archivo'
                ];
            }
            
            // Validar errores de PHP
            if ($file['error'] !== UPLOAD_ERR_OK) {
                return [
                    'success' => false,
                    'error' => 'Error al subir el archivo: ' . $this->getUploadError($file['error'])
                ];
            }
            
            // Validar tipo de archivo
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $this->allowedTypes)) {
                return [
                    'success' => false,
                    'error' => 'Tipo de archivo no permitido. Solo se aceptan imágenes (JPG, PNG, GIF, WEBP)'
                ];
            }
            
            // Validar tamaño
            if ($file['size'] > $this->maxFileSize) {
                return [
                    'success' => false,
                    'error' => 'El archivo es demasiado grande. Máximo 5MB'
                ];
            }
            
            // Generar nombre único
            $extension = $this->getExtension($file['name']);
            $filename = uniqid() . '_' . time() . '.' . $extension;
            
            // Crear subdirectorio si se especifica
            $targetDir = $this->uploadDir;
            if (!empty($subfolder)) {
                $targetDir .= rtrim($subfolder, '/') . '/';
                if (!file_exists($targetDir)) {
                    mkdir($targetDir, 0755, true);
                }
            }
            
            $targetPath = $targetDir . $filename;
            
            // Mover archivo
            if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
                return [
                    'success' => false,
                    'error' => 'Error al guardar el archivo'
                ];
            }
            
            // Retornar URL relativa
            $relativeUrl = 'uploads/' . ($subfolder ? $subfolder . '/' : '') . $filename;
            
            return [
                'success' => true,
                'filename' => $filename,
                'url' => $relativeUrl,
                'path' => $targetPath,
                'size' => $file['size'],
                'mime_type' => $mimeType
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => 'Error inesperado: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Subir múltiples imágenes
     */
    public function uploadMultipleImages($files, $subfolder = '') {
        $results = [];
        $uploadedFiles = [];
        
        // Normalizar array de archivos
        if (isset($files['name']) && is_array($files['name'])) {
            $fileCount = count($files['name']);
            for ($i = 0; $i < $fileCount; $i++) {
                $file = [
                    'name' => $files['name'][$i],
                    'type' => $files['type'][$i],
                    'tmp_name' => $files['tmp_name'][$i],
                    'error' => $files['error'][$i],
                    'size' => $files['size'][$i]
                ];
                
                $result = $this->uploadImage($file, $subfolder);
                $results[] = $result;
                
                if ($result['success']) {
                    $uploadedFiles[] = $result['url'];
                }
            }
        }
        
        return [
            'success' => count($uploadedFiles) > 0,
            'uploaded' => $uploadedFiles,
            'results' => $results,
            'total' => count($results),
            'successful' => count($uploadedFiles)
        ];
    }
    
    /**
     * Eliminar una imagen
     */
    public function deleteImage($filename, $subfolder = '') {
        try {
            $filepath = $this->uploadDir . ($subfolder ? $subfolder . '/' : '') . $filename;
            
            if (file_exists($filepath)) {
                if (unlink($filepath)) {
                    return ['success' => true, 'message' => 'Imagen eliminada'];
                } else {
                    return ['success' => false, 'error' => 'No se pudo eliminar la imagen'];
                }
            } else {
                return ['success' => false, 'error' => 'La imagen no existe'];
            }
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Procesar imagen base64
     */
    public function uploadBase64Image($base64String, $subfolder = '') {
        try {
            // Extraer tipo MIME y datos
            if (preg_match('/^data:image\/(\w+);base64,/', $base64String, $matches)) {
                $imageType = strtolower($matches[1]);
                $base64String = substr($base64String, strpos($base64String, ',') + 1);
            } else {
                return ['success' => false, 'error' => 'Formato base64 inválido'];
            }
            
            // Validar tipo de imagen
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
            if (!in_array($imageType, $allowedExtensions)) {
                return ['success' => false, 'error' => 'Tipo de imagen no permitido'];
            }
            
            // Decodificar
            $imageData = base64_decode($base64String);
            if ($imageData === false) {
                return ['success' => false, 'error' => 'Error al decodificar la imagen'];
            }
            
            // Validar tamaño
            if (strlen($imageData) > $this->maxFileSize) {
                return ['success' => false, 'error' => 'La imagen es demasiado grande'];
            }
            
            // Generar nombre único
            $filename = uniqid() . '_' . time() . '.' . $imageType;
            
            // Crear subdirectorio si se especifica
            $targetDir = $this->uploadDir;
            if (!empty($subfolder)) {
                $targetDir .= rtrim($subfolder, '/') . '/';
                if (!file_exists($targetDir)) {
                    mkdir($targetDir, 0755, true);
                }
            }
            
            $targetPath = $targetDir . $filename;
            
            // Guardar archivo
            if (file_put_contents($targetPath, $imageData) === false) {
                return ['success' => false, 'error' => 'Error al guardar la imagen'];
            }
            
            // Retornar URL relativa
            $relativeUrl = 'uploads/' . ($subfolder ? $subfolder . '/' : '') . $filename;
            
            return [
                'success' => true,
                'filename' => $filename,
                'url' => $relativeUrl,
                'path' => $targetPath,
                'size' => strlen($imageData)
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Obtener extensión de archivo
     */
    private function getExtension($filename) {
        return strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    }
    
    /**
     * Obtener mensaje de error de PHP upload
     */
    private function getUploadError($errorCode) {
        $errors = [
            UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño máximo permitido por el servidor',
            UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño máximo del formulario',
            UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente',
            UPLOAD_ERR_NO_FILE => 'No se subió ningún archivo',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta carpeta temporal',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo en disco',
            UPLOAD_ERR_EXTENSION => 'Una extensión de PHP detuvo la subida'
        ];
        
        return $errors[$errorCode] ?? 'Error desconocido';
    }
    
    /**
     * Redimensionar imagen (opcional, requiere GD)
     */
    public function resizeImage($sourcePath, $maxWidth = 1200, $maxHeight = 1200) {
        try {
            list($width, $height, $type) = getimagesize($sourcePath);
            
            // Calcular nuevas dimensiones manteniendo aspecto
            $ratio = min($maxWidth / $width, $maxHeight / $height);
            
            if ($ratio >= 1) {
                return ['success' => true, 'message' => 'No requiere redimensión'];
            }
            
            $newWidth = floor($width * $ratio);
            $newHeight = floor($height * $ratio);
            
            // Crear imagen según tipo
            switch ($type) {
                case IMAGETYPE_JPEG:
                    $source = imagecreatefromjpeg($sourcePath);
                    break;
                case IMAGETYPE_PNG:
                    $source = imagecreatefrompng($sourcePath);
                    break;
                case IMAGETYPE_GIF:
                    $source = imagecreatefromgif($sourcePath);
                    break;
                default:
                    return ['success' => false, 'error' => 'Tipo de imagen no soportado'];
            }
            
            // Crear imagen redimensionada
            $resized = imagecreatetruecolor($newWidth, $newHeight);
            
            // Mantener transparencia para PNG
            if ($type == IMAGETYPE_PNG) {
                imagealphablending($resized, false);
                imagesavealpha($resized, true);
            }
            
            imagecopyresampled($resized, $source, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            
            // Guardar según tipo
            switch ($type) {
                case IMAGETYPE_JPEG:
                    imagejpeg($resized, $sourcePath, 85);
                    break;
                case IMAGETYPE_PNG:
                    imagepng($resized, $sourcePath, 8);
                    break;
                case IMAGETYPE_GIF:
                    imagegif($resized, $sourcePath);
                    break;
            }
            
            imagedestroy($source);
            imagedestroy($resized);
            
            return [
                'success' => true,
                'message' => 'Imagen redimensionada',
                'new_dimensions' => ['width' => $newWidth, 'height' => $newHeight]
            ];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
}
?>
