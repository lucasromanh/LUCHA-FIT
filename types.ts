
export interface Client {
  id: string;
  name: string;
  email?: string; 
  image: string;
  age: number;
  gender: 'Masculino' | 'Femenino';
  weight: number;
  weightDiff: number;
  lastVisit: string;
  status: 'Activo' | 'Inactivo' | 'Pendiente';
  goal: string;
  bodyFat: number;
}

export interface Appointment {
  id: string;
  clientName: string;
  email?: string;
  type: string;
  date: string;
  rawDate?: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled' | 'pending_approval';
  colorClass: string;
}

export interface AnthropometricData {
  basic: {
    mass: number;
    stature: number;
    sitting_height: number;
    arm_span: number;
  };
  skinfolds: {
    triceps: number;
    subscapular: number;
    biceps: number;
    iliac_crest: number;
    supraspinale: number;
    abdominal: number;
    thigh: number;
    calf: number;
  };
  girths: {
    arm_relaxed: number;
    arm_flexed: number;
    waist: number;
    hips: number;
    mid_thigh: number;
    calf_girth: number;
  };
  breadths: {
    humerus: number;
    bistyloid: number;
    femur: number;
  };
}

export interface MeasurementRecord {
  id: string;
  clientId: string;
  date: string;
  evaluator: string;
  data: AnthropometricData;
}
