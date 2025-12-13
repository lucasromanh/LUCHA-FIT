
export interface Client {
  id: string;
  name: string;
  email?: string;
  image: string;
  age: number;
  gender: 'Masculino' | 'Femenino' | 'Otro';
  weight: number;
  weightDiff: number;
  lastVisit: string;
  status: 'Activo' | 'Inactivo' | 'Pendiente';
  goal: string;
  bodyFat: number;

  // Extended Profile Fields
  phone?: string;
  address?: string;
  birthDate?: string;

  // Anthropometry
  race?: string;
  handDominance?: string;
  footDominance?: string;
  activityType?: string;
  activityIntensity?: string;
  activityFrequency?: string;
  competitionLevel?: string;

  // Sports
  sports?: string[];
  position?: string;

  // Mass History
  massMax?: number;
  massMin?: number;

  // Clinical
  nutritionist?: string;
  pathologies?: string;
  surgeries?: string;
  medication?: string;
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

// --- ROUTINE TYPES ---

export type ExerciseBlock = 'warmup' | 'main' | 'accessory' | 'cooldown';

export interface RoutineExercise {
  id: string;
  block: ExerciseBlock;
  name: string;
  sets: number;
  reps: string;
  load: string;
  rest: string;
  notes?: string;
}

export interface RoutineSession {
  id: string;
  routineId: string;
  label: string; // e.g., "Lunes", "Día 1"
  exercises: RoutineExercise[];
}

export interface Routine {
  id: string;
  patientId: string;
  title: string;
  objective: string;
  sport: string;
  level: string;
  frequency: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  sessions: RoutineSession[];
}