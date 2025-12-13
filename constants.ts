import { Client, Appointment, MeasurementRecord, Routine } from './types';

export const PROFESSIONAL_PROFILE = {
  name: "Luciana Milagros Burgos",
  isak_level: 1,
  get display() { return `${this.name} — ISAK nivel ${this.isak_level}`; }
};

export const CLIENTS: Client[] = [
  {
    id: 'C-1024',
    name: 'Juan Pérez',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxLTVmn6mXei4mhAmPvqQk_iBT7JjMc0789eOT7PnySJt6TpiR4BUneN_dY19_y82wtMPhFa20Bt60F9mPDOucicqUb8-41X_MwNJzChAJ3e1QLgAzAx7oIbIuve5u6qAkS5Fik8ceBXx4HHNGNycNAQG7tmQ9QB2aJ4M4-8EYaZaUFHbwscyizeQjCenrA_6NaR7QM95yOUfq5jPxgeHmYULzeaGPHQHfIE53aL9vFTK3kpK0vrGmVGbxrWi7DMUwY8Qn26k_3RM',
    age: 28,
    gender: 'Masculino',
    weight: 78.5,
    weightDiff: -0.5,
    lastVisit: '12 Oct 2023',
    status: 'Activo',
    goal: 'Hipertrofia',
    bodyFat: 12.5
  },
  {
    id: 'C-1025',
    name: 'María González',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYH5i2rl-ZEXSN01jEfTEX-zxZTiCyUWROcasOIoVAAVAt89dZxkd1o6zIsLDCZoleuJN5pCItKQvX58Ac1RCb7V3tx6yCKqXsmyuaAcMqMpnFahkiJfc2aTjHz4-BaAf8sjYeyvX--Q0-DLKUp7Mn4emYk0aSvea-nSMND7j-Vgk9l0JVbyHllxsh6LFNjnMnxtRH9JejCFi6pv210-9qAbRexjhGjWnx5su4cfOK9GZJ8-KMSNxtw_lIW9bh7jnFJrNZTsWYVY0',
    age: 34,
    gender: 'Femenino',
    weight: 62.1,
    weightDiff: 1.2,
    lastVisit: '05 Oct 2023',
    status: 'Activo',
    goal: 'Pérdida de grasa',
    bodyFat: 24.2
  },
  {
    id: 'C-0998',
    name: 'Carlos Ruiz',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaXLGsBVp7LstshBfZtGD5Bo5S_qqvbT82ACg1yZTyCxMQ-rMFSI0VaOuKQBluZtQJLscmogLifzq8cKb57gvFOmBX8Ynf9Wd36tAqZWSIcWr59Dasfs97mfhPkaxW50vsmQ0HRg15uIgYHd-vK6noOUy1bJzU_jMhD0nHurCgBUt_p2X4Ihr-PhbR8BzxuDgfb8_ZpJckhFfME4mKPCHNz_HIXHpuqQSQFAse82MpVos6KiXYkNvw2_disttpCg9Iwh3W5mzZhdk',
    age: 45,
    gender: 'Masculino',
    weight: 90.2,
    weightDiff: 0,
    lastVisit: '28 Sep 2023',
    status: 'Pendiente',
    goal: 'Mantenimiento',
    bodyFat: 18.0
  },
  {
    id: 'C-1030',
    name: 'Ana López',
    image: '', 
    age: 22,
    gender: 'Femenino',
    weight: 55.0,
    weightDiff: -1.2,
    lastVisit: '15 Oct 2023',
    status: 'Activo',
    goal: 'Rendimiento',
    bodyFat: 19.5
  },
   {
    id: 'C-0850',
    name: 'Pedro Sánchez',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7ODsUnE_Nk2Al_JVwv3rmqzWH2RuCTW1VNovmqH8xqiuUHtIH_tB8aG9VQuAXrtgbeeTuf3zjRZ4qeB3fdM1rIsJB5sX0zu8pa1ytH96oiTl32lObtY9xlbWBPbXyWJdB7Cdu6bv3VJRXUVi7fpch6hhNLjaUtOOh66WxBEpn84GfdYF_EHONO2_LVyG6uasqvJRz9A9hGPHsTmnr33lm2jCpHDH5G9gR0U7d2O24tq_bMJ2Z8ldt97JCw9hsQemgkZ-d1p3jKsw',
    age: 31,
    gender: 'Masculino',
    weight: 82.3,
    weightDiff: 0,
    lastVisit: '20 Ago 2023',
    status: 'Inactivo',
    goal: 'Salud general',
    bodyFat: 22.1
  }
];

export const UPCOMING_APPOINTMENTS: Appointment[] = [
  {
    id: '1',
    clientName: 'Juan Pérez', 
    type: 'Consulta Inicial',
    date: '24 Oct, 2023',
    startTime: '14:30',
    endTime: '15:30',
    status: 'pending',
    colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  },
  {
    id: '2',
    clientName: 'María González', 
    type: 'Seguimiento',
    date: '24 Oct, 2023',
    startTime: '16:00',
    endTime: '16:30',
    status: 'pending',
    colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
  }
];

export const CHART_DATA = [
  { month: 'Ene', peso: 82.5, grasa: 21 },
  { month: 'Feb', peso: 81.2, grasa: 20 },
  { month: 'Mar', peso: 80.0, grasa: 19.5 },
  { month: 'Abr', peso: 79.2, grasa: 19 },
  { month: 'May', peso: 78.5, grasa: 18.5 },
];

// MOCK MEASUREMENT HISTORY FOR REPORTS
export const MOCK_HISTORY: Record<string, MeasurementRecord[]> = {
  'C-1024': [
    {
      id: 'm-2',
      clientId: 'C-1024',
      date: '2024-04-15', // Current
      evaluator: 'Dr. Lucha',
      data: {
        basic: { mass: 78.5, stature: 178, sitting_height: 92, arm_span: 180 },
        skinfolds: { triceps: 11, subscapular: 12, biceps: 4, iliac_crest: 15, supraspinale: 9, abdominal: 18, thigh: 10, calf: 6 },
        girths: { arm_relaxed: 32, arm_flexed: 35.5, waist: 82, hips: 98, mid_thigh: 56, calf_girth: 38 },
        breadths: { humerus: 7.2, bistyloid: 5.4, femur: 9.8 }
      }
    },
    {
      id: 'm-1',
      clientId: 'C-1024',
      date: '2024-01-15', // Previous
      evaluator: 'Dr. Lucha',
      data: {
        basic: { mass: 81.0, stature: 178, sitting_height: 92, arm_span: 180 },
        skinfolds: { triceps: 14, subscapular: 15, biceps: 5, iliac_crest: 19, supraspinale: 12, abdominal: 22, thigh: 12, calf: 8 },
        girths: { arm_relaxed: 31, arm_flexed: 34, waist: 88, hips: 101, mid_thigh: 58, calf_girth: 39 },
        breadths: { humerus: 7.2, bistyloid: 5.4, femur: 9.8 }
      }
    }
  ]
};

// MOCK ROUTINES DATA
export const MOCK_ROUTINES: Record<string, Routine[]> = {
  'C-1024': [
    {
      id: 'r-1',
      patientId: 'C-1024',
      title: 'Hipertrofia Fase 1',
      objective: 'Ganancia muscular',
      sport: 'Musculación',
      level: 'Intermedio',
      frequency: '4 días',
      status: 'active',
      createdAt: '2023-10-01',
      sessions: [
        {
          id: 's-1',
          routineId: 'r-1',
          label: 'Día 1: Torso',
          exercises: [
            { id: 'e-1', block: 'main', name: 'Press Banca', sets: 4, reps: '8-10', load: 'RPE 8', rest: '2 min', notes: '' },
            { id: 'e-2', block: 'main', name: 'Remo con Barra', sets: 4, reps: '8-10', load: 'RPE 8', rest: '2 min', notes: '' }
          ]
        }
      ]
    }
  ]
};