
export interface Client {
  id: string;
  name: string;
  email?: string; // Added
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
  email?: string; // Added for notifications
  type: string; // e.g., 'Consulta Inicial', 'Seguimiento'
  date: string; // ISO format YYYY-MM-DD preferred for logic, but UI uses display strings
  rawDate?: string; // YYYY-MM-DD for logic
  startTime: string;
  endTime: string;
  status: 'pending' | 'completed' | 'cancelled' | 'pending_approval'; // Added pending_approval
  colorClass: string; // Tailwind class for badge color
}

export interface Measurement {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  height: number;
  muscleMass: number;
  bodyFat: number;
  metrics: {
    waist: number;
    hip: number;
    armRelaxed: number;
    thigh: number;
  };
}
