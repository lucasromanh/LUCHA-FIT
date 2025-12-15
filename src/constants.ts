import { Client, Appointment, MeasurementRecord, Routine } from './types';

// --- ASSETS CONFIGURATION ---
// Ensure these images are placed in your 'public' folder
export const ASSETS = {
  logo: '/logo.png',       // The LuchaFit Logo (Apple + Text)
  profile: '/profile.jpg', // Luciana's Profile Picture
  body: '/cuerpohumano.png' // Body Anatomy Image
};

export const PROFESSIONAL_PROFILE = {
  name: "Luciana Milagros Burgos",
  isak_level: 1,
  image: ASSETS.profile,
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
      evaluator: 'Luciana Burgos ISAK Nivel 1',
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
      evaluator: 'Luciana Burgos ISAK Nivel 1',
      data: {
        basic: { mass: 81.0, stature: 178, sitting_height: 92, arm_span: 180 },
        skinfolds: { triceps: 14, subscapular: 15, biceps: 5, iliac_crest: 19, supraspinale: 12, abdominal: 22, thigh: 12, calf: 8 },
        girths: { arm_relaxed: 31, arm_flexed: 34, waist: 88, hips: 101, mid_thigh: 58, calf_girth: 39 },
        breadths: { humerus: 7.2, bistyloid: 5.4, femur: 9.8 }
      }
    }
  ]
};

// MOCK ROUTINES DATA (UPDATED WITH 5 EXAMPLES)
export const MOCK_ROUTINES: Record<string, Routine[]> = {
  // JUAN PÉREZ - Hipertrofia
  'C-1024': [
    {
      id: 'r-1024-1',
      patientId: 'C-1024',
      title: 'Hipertrofia - Fase de Acumulación',
      objective: 'Ganancia de masa muscular',
      sport: 'Musculación',
      level: 'Intermedio',
      frequency: '4 días/semana',
      status: 'active',
      createdAt: '2023-10-01',
      sessions: [
        {
          id: 's-1024-1-1',
          routineId: 'r-1024-1',
          label: 'Día 1: Torso (Empuje/Tracción)',
          exercises: [
            { id: 'e-1', block: 'warmup', name: 'Movilidad de Hombros', sets: 1, reps: '3 min', load: 'Banda elástica', rest: '0', notes: 'Enfasis en rotadores' },
            { id: 'e-2', block: 'main', name: 'Press Banca Plano', sets: 4, reps: '6-8', load: 'RPE 8', rest: '3 min', notes: 'Controlar bajada' },
            { id: 'e-3', block: 'main', name: 'Remo con Barra', sets: 4, reps: '8-10', load: 'RPE 8', rest: '2 min', notes: 'Torso a 45 grados' },
            { id: 'e-4', block: 'accessory', name: 'Press Militar Mancuernas', sets: 3, reps: '10-12', load: 'RPE 7-8', rest: '90s', notes: '' },
            { id: 'e-5', block: 'accessory', name: 'Elevaciones Laterales', sets: 3, reps: '15', load: 'RPE 9', rest: '60s', notes: 'Drop set última serie' }
          ]
        },
        {
          id: 's-1024-1-2',
          routineId: 'r-1024-1',
          label: 'Día 2: Pierna Enfasis Cuádriceps',
          exercises: [
            { id: 'e-6', block: 'warmup', name: 'Sentadilla Copa', sets: 2, reps: '15', load: '10kg', rest: '60s', notes: 'Activación' },
            { id: 'e-7', block: 'main', name: 'Sentadilla Barra Alta', sets: 4, reps: '6-8', load: 'RPE 8', rest: '3 min', notes: 'Profunda' },
            { id: 'e-8', block: 'main', name: 'Prensa 45', sets: 3, reps: '12-15', load: 'RPE 9', rest: '2 min', notes: 'Pies cerrados' },
            { id: 'e-9', block: 'accessory', name: 'Sillón Cuádriceps', sets: 3, reps: '15-20', load: 'Fallo', rest: '60s', notes: '3 seg isometría arriba' }
          ]
        }
      ]
    }
  ],
  // MARÍA GONZÁLEZ - Pérdida de Grasa
  'C-1025': [
    {
      id: 'r-1025-1',
      patientId: 'C-1025',
      title: 'Metabólico Full Body',
      objective: 'Pérdida de grasa y tonificación',
      sport: 'Fitness',
      level: 'Intermedio',
      frequency: '3 días/semana',
      status: 'active',
      createdAt: '2023-10-05',
      sessions: [
        {
          id: 's-1025-1-1',
          routineId: 'r-1025-1',
          label: 'Día 1: Circuito A',
          exercises: [
            { id: 'e-1', block: 'warmup', name: 'Cinta Caminata', sets: 1, reps: '5 min', load: 'Nivel 4', rest: '0', notes: 'Inclinación 5%' },
            { id: 'e-2', block: 'main', name: 'Goblet Squat', sets: 4, reps: '15', load: '12kg', rest: '0', notes: 'Circuito continuo' },
            { id: 'e-3', block: 'main', name: 'Flexiones (Push ups)', sets: 4, reps: '10-12', load: 'Peso corporal', rest: '0', notes: 'Rodillas si es necesario' },
            { id: 'e-4', block: 'main', name: 'Remo TRX', sets: 4, reps: '15', load: 'Peso corporal', rest: '90s', notes: 'Descansar al final de la vuelta' },
            { id: 'e-5', block: 'cooldown', name: 'Plancha Abdominal', sets: 3, reps: '30s', load: '-', rest: '30s', notes: '' }
          ]
        }
      ]
    }
  ],
  // CARLOS RUIZ - Mantenimiento +50
  'C-0998': [
    {
      id: 'r-0998-1',
      patientId: 'C-0998',
      title: 'Fuerza General y Movilidad',
      objective: 'Mantenimiento y Salud Articular',
      sport: 'Salud',
      level: 'Principiante',
      frequency: '2 días/semana',
      status: 'active',
      createdAt: '2023-09-28',
      sessions: [
        {
          id: 's-0998-1-1',
          routineId: 'r-0998-1',
          label: 'Sesión Única',
          exercises: [
            { id: 'e-1', block: 'warmup', name: 'Cat-Cow', sets: 2, reps: '10', load: '-', rest: '0', notes: 'Movilidad columna' },
            { id: 'e-2', block: 'main', name: 'Peso Muerto Rumano', sets: 3, reps: '10', load: 'Mancuernas', rest: '90s', notes: 'Cuidar espalda neutra' },
            { id: 'e-3', block: 'main', name: 'Press Pecho Máquina', sets: 3, reps: '12', load: 'Bloques 4', rest: '90s', notes: '' },
            { id: 'e-4', block: 'main', name: 'Jalón al pecho', sets: 3, reps: '12', load: 'Bloques 5', rest: '90s', notes: '' },
            { id: 'e-5', block: 'accessory', name: 'Caminata Granja', sets: 3, reps: '30m', load: '10kg c/u', rest: '60s', notes: 'Postura erguida' }
          ]
        }
      ]
    }
  ],
  // ANA LÓPEZ - Rendimiento Deportivo
  'C-1030': [
    {
      id: 'r-1030-1',
      patientId: 'C-1030',
      title: 'Potencia y Velocidad',
      objective: 'Mejorar salto vertical',
      sport: 'Vóley',
      level: 'Avanzado',
      frequency: '4 días/semana',
      status: 'draft',
      createdAt: '2023-10-15',
      sessions: [
        {
          id: 's-1030-1-1',
          routineId: 'r-1030-1',
          label: 'Día 1: Potencia',
          exercises: [
            { id: 'e-1', block: 'warmup', name: 'Saltos a cajón', sets: 3, reps: '5', load: '-', rest: '60s', notes: 'Altura media' },
            { id: 'e-2', block: 'main', name: 'Power Clean', sets: 5, reps: '3', load: '75%', rest: '3 min', notes: 'Velocidad máxima' },
            { id: 'e-3', block: 'main', name: 'Sentadilla Explosiva', sets: 4, reps: '5', load: '60%', rest: '2 min', notes: 'Subida rápida' }
          ]
        }
      ]
    }
  ],
  // PEDRO SÁNCHEZ - Readaptación
  'C-0850': [
    {
      id: 'r-0850-1',
      patientId: 'C-0850',
      title: 'Readaptación Lumbar',
      objective: 'Fortalecimiento Core',
      sport: 'Rehabilitación',
      level: 'Principiante',
      frequency: '3 días/semana',
      status: 'active',
      createdAt: '2023-08-20',
      sessions: [
        {
          id: 's-0850-1-1',
          routineId: 'r-0850-1',
          label: 'Día A: Estabilidad',
          exercises: [
            { id: 'e-1', block: 'main', name: 'Bird-Dog', sets: 3, reps: '10/lado', load: '-', rest: '60s', notes: 'Lento y controlado' },
            { id: 'e-2', block: 'main', name: 'Plancha lateral', sets: 3, reps: '20s', load: '-', rest: '45s', notes: 'Alinear cadera' },
            { id: 'e-3', block: 'main', name: 'Puente de Glúteo', sets: 3, reps: '15', load: '-', rest: '60s', notes: 'Apretando arriba 2 seg' }
          ]
        }
      ]
    }
  ]
};

export const EXERCISE_CATALOG = [
  "Sentadilla Libre", "Sentadilla Goblet", "Sentadilla Frontal", "Prensa 45°", "Sillón de Cuádriceps", "Estocadas", "Sentadilla Búlgara", "Peso Muerto Convencional", "Peso Muerto Rumano", "Peso Muerto Sumo", "Hip Thrust", "Puente de Glúteo", "Camilla de Isquios", "Gemelos en Prensa", "Gemelos Parado",
  "Press Banca Plano", "Press Banca Inclinado", "Press Banca Declinado", "Aperturas con Mancuernas", "Cruce de Poleas", "Flexiones de Brazos", "Fondos en Paralelas",
  "Dominadas", "Jalón al Pecho", "Remo con Barra", "Remo con Mancuerna", "Remo en Polea Baja", "Face Pull", "Pull Over",
  "Press Militar", "Press de Hombros con Mancuernas", "Vuelos Laterales", "Vuelos Frontales", "Pájaros (Posterior)", "Remo al Mentón",
  "Curl de Bíceps con Barra", "Curl Martillo", "Curl Banco Scott", "Tríceps en Polea", "Press Francés", "Extensiones Trasnuca",
  "Plancha Abdominal", "Crunch Abdominal", "Elevación de Piernas", "Rueda Abdominal", "Russian Twist", "Superman (Lumbares)",
  "Burpees", "Saltos al Cajón", "Kettlebell Swing", "Mountain Climbers", "Slam Ball"
].sort();