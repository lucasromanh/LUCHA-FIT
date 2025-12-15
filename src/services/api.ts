/**
 * LuchaFit - API Service
 * Servicio centralizado para todas las peticiones al backend
 */

const API_BASE_URL = 'https://luchafit.saltacoders.com/api';
// const API_BASE_URL = 'http://localhost/luchafit/backend/api'; // Use this for local testing if needed

console.log(`%c[API CONFIG] Base URL: ${API_BASE_URL}`, 'background: #222; color: #bada55');

// Tipos de respuesta
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}

// Helper para obtener el token
const getAuthToken = (): string | null => {
  return localStorage.getItem('luchafit_token');
};

// Helper para headers con autenticación
const getHeaders = (isFormData = false): HeadersInit => {
  const headers: HeadersInit = {
    'Authorization': `Bearer ${getAuthToken() || ''}`,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

// ========================================
// AUTENTICACIÓN
// ========================================

export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  verifyToken: async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  logout: () => {
    localStorage.removeItem('luchafit_token');
    localStorage.removeItem('luchafit_user');
  }
};

// ========================================
// CLIENTES/PACIENTES
// ========================================

export const clientsApi = {
  getAll: async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/clients.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getById: async (id: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/clients.php?id=${id}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  search: async (query: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/clients.php?search=${encodeURIComponent(query)}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  create: async (clientData: any, imageFile?: File): Promise<ApiResponse> => {
    if (imageFile) {
      // Enviar como FormData con imagen
      const formData = new FormData();
      Object.keys(clientData).forEach(key => {
        if (clientData[key] !== null && clientData[key] !== undefined) {
          if (Array.isArray(clientData[key])) {
            formData.append(key, JSON.stringify(clientData[key]));
          } else {
            formData.append(key, clientData[key]);
          }
        }
      });
      formData.append('image', imageFile);

      const response = await fetch(`${API_BASE_URL}/clients.php`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
      });
      return response.json();
    } else {
      // Enviar como JSON
      const response = await fetch(`${API_BASE_URL}/clients.php`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(clientData)
      });
      return response.json();
    }
  },

  update: async (id: string, clientData: any, imageFile?: File): Promise<ApiResponse> => {
    if (imageFile) {
      const formData = new FormData();
      Object.keys(clientData).forEach(key => {
        if (clientData[key] !== null && clientData[key] !== undefined) {
          if (Array.isArray(clientData[key])) {
            formData.append(key, JSON.stringify(clientData[key]));
          } else {
            formData.append(key, clientData[key]);
          }
        }
      });
      formData.append('image', imageFile);

      const response = await fetch(`${API_BASE_URL}/clients.php?id=${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: formData
      });
      return response.json();
    } else {
      const response = await fetch(`${API_BASE_URL}/clients.php?id=${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(clientData)
      });
      return response.json();
    }
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/clients.php?id=${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  }
};

// ========================================
// MEDICIONES ANTROPOMÉTRICAS
// ========================================

export const measurementsApi = {
  getAll: async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/measurements.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getById: async (id: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/measurements.php?id=${id}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getByClientId: async (clientId: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/measurements.php?client_id=${clientId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  /**
   * Crear medición con cálculos automáticos
   * El backend calculará automáticamente: BMI, % grasa, somatotipo, Z-Scores
   */
  create: async (measurementData: any, images?: File[]): Promise<ApiResponse> => {
    if (images && images.length > 0) {
      const formData = new FormData();

      // Agregar datos de medición
      Object.keys(measurementData).forEach(key => {
        if (measurementData[key] !== null && measurementData[key] !== undefined) {
          formData.append(key, measurementData[key]);
        }
      });

      // Agregar imágenes
      images.forEach((image, index) => {
        formData.append(`images[]`, image);
      });

      const response = await fetch(`${API_BASE_URL}/measurements.php`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
      });
      return response.json();
    } else {
      const response = await fetch(`${API_BASE_URL}/measurements.php`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(measurementData)
      });
      return response.json();
    }
  },

  update: async (id: string, measurementData: any, images?: File[]): Promise<ApiResponse> => {
    // Si hay imágenes, usar FormData
    if (images && images.length > 0) {
      const formData = new FormData();

      // Agregar todos los campos de measurementData
      Object.keys(measurementData).forEach(key => {
        if (measurementData[key] !== undefined && measurementData[key] !== null) {
          formData.append(key, measurementData[key].toString());
        }
      });

      // Agregar imágenes
      images.forEach((image) => {
        formData.append(`images[]`, image);
      });

      const response = await fetch(`${API_BASE_URL}/measurements.php?id=${id}`, {
        method: 'PUT',
        headers: getHeaders(true),
        body: formData
      });
      return response.json();
    } else {
      const response = await fetch(`${API_BASE_URL}/measurements.php?id=${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(measurementData)
      });
      return response.json();
    }
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/measurements.php?id=${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  }
};

// ========================================
// RUTINAS
// ========================================

export const routinesApi = {
  getAll: async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/routines.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getById: async (id: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/routines.php?id=${id}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getByPatientId: async (patientId: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/routines.php?patient_id=${patientId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  create: async (routineData: any): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/routines.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(routineData)
    });
    return response.json();
  },

  update: async (id: string, routineData: any): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/routines.php?id=${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(routineData)
    });
    return response.json();
  },

  delete: async (id: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/routines.php?id=${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  }
};

// ========================================
// CITAS/APPOINTMENTS
// ========================================

export const appointmentsApi = {
  getAll: async (): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/appointments.php`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getById: async (id: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/appointments.php?id=${id}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getByClientId: async (clientId: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/appointments.php?client_id=${clientId}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  getByDate: async (date: string): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/appointments.php?date=${date}`, {
      headers: getHeaders()
    });
    return response.json();
  },

  create: async (appointmentData: any): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/appointments.php`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return response.json();
  },

  update: async (id: string, appointmentData: any): Promise<ApiResponse> => {
    const response = await fetch(`${API_BASE_URL}/appointments.php?id=${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(appointmentData)
    });
    return response.json();
  },

  delete: async (id: string, cancel = false): Promise<ApiResponse> => {
    const url = cancel
      ? `${API_BASE_URL}/appointments.php?id=${id}&cancel=1`
      : `${API_BASE_URL}/appointments.php?id=${id}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return response.json();
  }
};

// Exportar todo
export default {
  auth: authApi,
  clients: clientsApi,
  measurements: measurementsApi,
  routines: routinesApi,
  appointments: appointmentsApi
};
