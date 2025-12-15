/**
 * Hook personalizado para manejar clientes/pacientes
 */

import { useState, useEffect } from 'react';
import { clientsApi } from '../services/api';

export interface ClientData {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: 'Masculino' | 'Femenino' | 'Otro';
  birth_date?: string;

  // Datos antropométricos básicos
  weight?: number;
  height?: number;
  weight_diff?: number;

  // Objetivo y actividad
  goal?: string;
  sports?: string[];
  activity_level?: 'Sedentario' | 'Ligero' | 'Moderado' | 'Activo' | 'Muy Activo';
  training_frequency?: string;

  // Datos clínicos
  medical_conditions?: string;
  medications?: string;
  allergies?: string;
  injuries?: string;

  // Profesión y estilo de vida
  occupation?: string;
  sleep_hours?: number;
  stress_level?: 'Bajo' | 'Moderado' | 'Alto';
  hydration?: string;

  // Nutrición
  dietary_restrictions?: string;
  food_preferences?: string;
  supplements?: string;

  // Estado y seguimiento
  status?: 'Activo' | 'Inactivo' | 'En Pausa';
  last_visit?: string;
  next_appointment?: string;
  notes?: string;

  // Imagen
  image_url?: string;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientsApi.getAll();

      if (response.success && response.data) {
        // Map backend snake_case to frontend camelCase
        const mappedClients = response.data.map((client: any) => ({
          ...client,
          // Map snake_case to camelCase for profile fields
          birthDate: client.birth_date,
          handDominance: client.hand_dominance,
          footDominance: client.foot_dominance,
          activityType: client.activity_type,
          activityIntensity: client.activity_intensity,
          activityFrequency: client.activity_frequency,
          competitionLevel: client.competition_level,
          massMax: client.mass_max,
          massMin: client.mass_min,
          lastVisit: client.last_visit,
          bodyFat: client.body_fat,
          weightDiff: client.weight_diff
        }));

        setClients(mappedClients);
      } else {
        setError(response.error || 'Error al cargar clientes');
      }
    } catch (err) {
      setError('Error de conexión al cargar clientes');
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const getClientById = async (id: string): Promise<ClientData | null> => {
    try {
      const response = await clientsApi.getById(id);

      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (err) {
      console.error('Error getting client:', err);
      return null;
    }
  };

  const searchClients = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientsApi.search(query);

      if (response.success && response.data) {
        setClients(response.data);
      } else {
        setError(response.error || 'Error al buscar clientes');
      }
    } catch (err) {
      setError('Error de conexión al buscar clientes');
      console.error('Error searching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (
    data: Omit<ClientData, 'id' | 'created_at' | 'updated_at'>,
    imageFile?: File
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientsApi.create(data, imageFile);

      if (response.success) {
        await loadClients();
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Error al crear cliente');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = 'Error de conexión al crear cliente';
      setError(errorMsg);
      console.error('Error creating client:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (
    id: string,
    data: Partial<ClientData>,
    imageFile?: File
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientsApi.update(id, data, imageFile);

      if (response.success) {
        await loadClients();
        return { success: true, data: response.data };
      } else {
        setError(response.error || 'Error al actualizar cliente');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = 'Error de conexión al actualizar cliente';
      setError(errorMsg);
      console.error('Error updating client:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (id: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await clientsApi.delete(id);

      if (response.success) {
        await loadClients();
        return { success: true };
      } else {
        setError(response.error || 'Error al eliminar cliente');
        return { success: false, error: response.error };
      }
    } catch (err) {
      const errorMsg = 'Error de conexión al eliminar cliente';
      setError(errorMsg);
      console.error('Error deleting client:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  return {
    clients,
    loading,
    error,
    loadClients,
    getClientById,
    searchClients,
    createClient,
    updateClient,
    deleteClient
  };
};
