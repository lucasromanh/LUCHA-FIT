/**
 * Hook personalizado para manejar mediciones antropométricas
 * Conectado con el backend para guardar y consultar desde la base de datos
 * 
 * IMPORTANTE: El frontend define la estructura de datos (anidada en types.ts)
 * Este hook transforma entre el formato del frontend y el formato plano del backend
 */

import { useState, useEffect } from 'react';
import { measurementsApi } from '../services/api';
import { AnthropometricData } from '../types';

export interface MeasurementRecord {
  id?: string;
  clientId: string;
  client_id?: string; // Alias para backend
  evaluator: string;
  date: string;
  data?: AnthropometricData; // Estructura del frontend (anidada)
  
  // También aceptar campos planos del backend
  mass?: number;
  stature?: number;
  sitting_height?: number;
  arm_span?: number;
  triceps?: number;
  subscapular?: number;
  biceps?: number;
  iliac_crest?: number;
  supraspinale?: number;
  abdominal?: number;
  thigh?: number;
  calf?: number;
  arm_relaxed?: number;
  arm_flexed?: number;
  waist?: number;
  hips?: number;
  mid_thigh?: number;
  calf_girth?: number;
  humerus?: number;
  bistyloid?: number;
  femur?: number;
  
  // Cálculos del backend (NUNCA se calculan en el frontend)
  bmi?: number;
  body_fat_percent?: number;
  somatotype_endo?: number;
  somatotype_meso?: number;
  somatotype_ecto?: number;
  
  images?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Transformar datos del frontend (anidados) al formato del backend (plano)
 * El frontend usa AnthropometricData con estructura: {basic, skinfolds, girths, breadths}
 * El backend espera campos planos: mass, stature, triceps, etc.
 */
const transformToBackend = (data: Partial<MeasurementRecord>): any => {
  // Si ya viene en formato plano, retornar tal cual
  if (!data.data) {
    return data;
  }
  
  // Transformar de anidado a plano
  const anthroData = data.data;
  return {
    client_id: data.clientId || data.client_id,
    evaluator: data.evaluator,
    date: data.date,
    
    // Basic measurements (4 campos)
    mass: anthroData.basic?.mass,
    stature: anthroData.basic?.stature,
    sitting_height: anthroData.basic?.sitting_height,
    arm_span: anthroData.basic?.arm_span,
    
    // Skinfolds (8 campos)
    triceps: anthroData.skinfolds?.triceps,
    subscapular: anthroData.skinfolds?.subscapular,
    biceps: anthroData.skinfolds?.biceps,
    iliac_crest: anthroData.skinfolds?.iliac_crest,
    supraspinale: anthroData.skinfolds?.supraspinale,
    abdominal: anthroData.skinfolds?.abdominal,
    thigh: anthroData.skinfolds?.thigh,
    calf: anthroData.skinfolds?.calf,
    
    // Girths (6 campos)
    arm_relaxed: anthroData.girths?.arm_relaxed,
    arm_flexed: anthroData.girths?.arm_flexed,
    waist: anthroData.girths?.waist,
    hips: anthroData.girths?.hips,
    mid_thigh: anthroData.girths?.mid_thigh,
    calf_girth: anthroData.girths?.calf_girth,
    
    // Breadths (3 campos)
    humerus: anthroData.breadths?.humerus,
    bistyloid: anthroData.breadths?.bistyloid,
    femur: anthroData.breadths?.femur
  };
};

/**
 * Transformar datos del backend (plano) al formato del frontend (anidado)
 * El backend retorna campos planos + cálculos
 * El frontend necesita estructura AnthropometricData anidada
 */
const transformToFrontend = (backendData: any): MeasurementRecord => {
  return {
    id: backendData.id,
    clientId: backendData.client_id,
    evaluator: backendData.evaluator,
    date: backendData.date,
    data: {
      basic: {
        mass: parseFloat(backendData.mass) || 0,
        stature: parseFloat(backendData.stature) || 0,
        sitting_height: parseFloat(backendData.sitting_height) || 0,
        arm_span: parseFloat(backendData.arm_span) || 0
      },
      skinfolds: {
        triceps: parseFloat(backendData.triceps) || 0,
        subscapular: parseFloat(backendData.subscapular) || 0,
        biceps: parseFloat(backendData.biceps) || 0,
        iliac_crest: parseFloat(backendData.iliac_crest) || 0,
        supraspinale: parseFloat(backendData.supraspinale) || 0,
        abdominal: parseFloat(backendData.abdominal) || 0,
        thigh: parseFloat(backendData.thigh) || 0,
        calf: parseFloat(backendData.calf) || 0
      },
      girths: {
        arm_relaxed: parseFloat(backendData.arm_relaxed) || 0,
        arm_flexed: parseFloat(backendData.arm_flexed) || 0,
        waist: parseFloat(backendData.waist) || 0,
        hips: parseFloat(backendData.hips) || 0,
        mid_thigh: parseFloat(backendData.mid_thigh) || 0,
        calf_girth: parseFloat(backendData.calf_girth) || 0
      },
      breadths: {
        humerus: parseFloat(backendData.humerus) || 0,
        bistyloid: parseFloat(backendData.bistyloid) || 0,
        femur: parseFloat(backendData.femur) || 0
      }
    },
    // Cálculos del backend (estos VIENEN del servidor, NO se calculan aquí)
    bmi: backendData.bmi,
    body_fat_percent: backendData.body_fat_percent,
    somatotype_endo: backendData.somatotype_endo,
    somatotype_meso: backendData.somatotype_meso,
    somatotype_ecto: backendData.somatotype_ecto,
    images: backendData.images,
    created_at: backendData.created_at,
    updated_at: backendData.updated_at
  };
};

export const useMeasurements = (clientId?: string) => {
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Cargar mediciones desde la base de datos
   * Si se proporciona clientId, carga solo las de ese cliente
   */
  const loadMeasurements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = clientId 
        ? await measurementsApi.getByClientId(clientId)
        : await measurementsApi.getAll();
      
      // Transformar cada medición del backend al formato del frontend
      const transformed = Array.isArray(data) ? data.map(transformToFrontend) : [];
      setMeasurements(transformed);
    } catch (err: any) {
      setError(err.message || 'Error al cargar mediciones');
      console.error('Error loading measurements:', err);
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Cargar al montar el componente
   */
  useEffect(() => {
    loadMeasurements();
  }, [clientId]);
  
  /**
   * Crear nueva medición
   * 
   * IMPORTANTE: El backend calcula automáticamente:
   * - BMI (Índice de Masa Corporal)
   * - Porcentaje de grasa corporal (Fórmula de Faulkner)
   * - Somatotipo (Heath-Carter): Endomorfia, Mesomorfia, Ectomorfia
   * - Z-Scores para comparación con poblaciones de referencia
   * 
   * El frontend NUNCA debe calcular estos valores, solo enviar las mediciones
   * y mostrar lo que retorna la API.
   */
  const createMeasurement = async (
    measurementData: Partial<MeasurementRecord>,
    images?: File[]
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Transformar datos del frontend (anidados) al formato del backend (plano)
      const backendData = transformToBackend(measurementData);
      
      // Enviar al backend - El servidor calculará BMI, % grasa, somatotipo, Z-Scores
      const result = await measurementsApi.create(backendData, images);
      
      // Recargar mediciones para obtener los valores calculados por el backend
      await loadMeasurements();
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Error al crear medición');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Actualizar medición existente
   * El backend recalculará automáticamente todos los valores derivados
   */
  const updateMeasurement = async (
    id: string,
    measurementData: Partial<MeasurementRecord>,
    images?: File[]
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Transformar datos del frontend al formato del backend
      const backendData = transformToBackend(measurementData);
      
      // Ahora el API acepta imágenes en el update
      const result = await measurementsApi.update(id, backendData, images);
      
      // Recargar mediciones
      await loadMeasurements();
      
      return result;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar medición');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Eliminar medición
   */
  const deleteMeasurement = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await measurementsApi.delete(id);
      
      // Recargar mediciones
      await loadMeasurements();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar medición');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Obtener la medición más reciente de un cliente
   */
  const getLatestMeasurement = (): MeasurementRecord | null => {
    if (measurements.length === 0) return null;
    
    return measurements.reduce((latest, current) => {
      const latestDate = new Date(latest.date);
      const currentDate = new Date(current.date);
      return currentDate > latestDate ? current : latest;
    });
  };
  
  /**
   * Obtener historial de mediciones ordenado por fecha (más reciente primero)
   */
  const getMeasurementHistory = (): MeasurementRecord[] => {
    return [...measurements].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  };
  
  return {
    measurements,
    loading,
    error,
    createMeasurement,
    updateMeasurement,
    deleteMeasurement,
    getLatestMeasurement,
    getMeasurementHistory,
    reload: loadMeasurements
  };
};
