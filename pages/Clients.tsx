import React, { useState, useMemo, useEffect } from 'react';
import { CLIENTS } from '../constants';
import { Client } from '../types';

const SPORTS_LIST = {
  "Deportes Básicos": ["Fútbol", "Fútbol sala", "Fútbol 5 / 7 / 11", "Básquet", "Vóley", "Handball", "Hockey", "Rugby", "Tenis", "Pádel", "Ping pong", "Atletismo", "Natación", "Ciclismo", "Running", "Trail running", "Caminata recreativa"],
  "Fuerza y Fitness": ["Musculación", "Fitness general", "CrossFit", "Cross Training", "Hyrox", "Halterofilia", "Powerlifting", "Strongman", "Calistenia", "Street workout", "Bodybuilding", "Funcional", "Entrenamiento militar"],
  "Artes Marciales y Combate": ["Boxeo", "Kickboxing", "Muay Thai", "MMA", "Judo", "Karate", "Taekwondo", "Jiu Jitsu", "Lucha olímpica", "Lucha grecorromana", "Esgrima"],
  "Outdoor": ["Escalada", "Montañismo", "Trekking", "Esquí", "Snowboard", "Surf", "Kitesurf", "Windsurf", "Skate", "Longboard", "BMX", "Mountain bike"],
  "Bienestar": ["Yoga", "Pilates", "Stretching", "Movilidad", "Reeducación postural", "Gimnasia terapéutica"]
};

// Helper to parse dates like "12 Oct 2023" for sorting
const parseDateStr = (dateStr: string) => {
    const months: {[key: string]: number} = { 
        'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5, 
        'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11 
    };
    const parts = dateStr.split(' ');
    if (parts.length < 3) return new Date(0).getTime();
    const day = parseInt(parts[0]);
    const month = months[parts[1]] || 0;
    const year = parseInt(parts[2]);
    return new Date(year, month, day).getTime();
};

const Clients: React.FC = () => {
  // State for Clients Data (Initialized with Constant)
  const [clientsData, setClientsData] = useState<Client[]>(CLIENTS);
  
  // Filtering & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Form State
  const initialFormState = {
    // Personal
    nombre: '', apellido: '', nacimiento: '', sexo: 'Masculino', email: '', telefono: '', direccion: '', foto: null as any,
    // Fisicas
    raza: 'Caucásico/latino', mano: 'Diestra', pie: 'Diestro',
    actividadTipo: 'Activa', actividadIntensidad: 'Moderada', actividadFrecuencia: '3-5 veces por semana', nivelCompetencia: 'Recreativo',
    // Deporte
    deporte: '', posicion: '',
    // Masas
    masaMax: '', masaMin: '', masaHabitual: '',
    // Clinico
    nutricionista: 'No', patologias: '', cirugias: '', medicacion: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- LOGIC: Filter & Sort ---
  const processedClients = useMemo(() => {
    let result = [...clientsData];

    // 1. Filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        result = result.filter(c => 
            c.name.toLowerCase().includes(term) || 
            c.id.toLowerCase().includes(term) ||
            c.email?.toLowerCase().includes(term) 
        );
    }
    if (filterStatus) {
        result = result.filter(c => c.status.toLowerCase() === filterStatus.toLowerCase());
    }

    // 2. Sort (Newest / Recently Updated First)
    // We sort by 'lastVisit' descending to show the most recent first
    result.sort((a, b) => parseDateStr(b.lastVisit) - parseDateStr(a.lastVisit));

    return result;
  }, [clientsData, searchTerm, filterStatus]);

  // --- LOGIC: Pagination ---
  const totalPages = Math.max(1, Math.ceil(processedClients.length / itemsPerPage));
  
  const paginatedClients = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      // Ensure we get exactly itemsPerPage (5) items if available
      return processedClients.slice(startIndex, startIndex + itemsPerPage);
  }, [processedClients, currentPage]);

  // Reset page when filter changes
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  // --- ACTIONS ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenNew = () => {
      setEditingClientId(null);
      setFormData(initialFormState);
      setIsModalOpen(true);
  };

  // Used for both "Edit" and "Ver Ficha"
  const handleEdit = (client: Client) => {
      setEditingClientId(client.id);
      
      // Map existing basic client data to form (Partial mapping since full data isn't in simple Client type)
      const [firstName, ...restName] = client.name.split(' ');
      
      setFormData({
          ...initialFormState,
          nombre: firstName,
          apellido: restName.join(' '),
          email: client.email || '',
          sexo: client.gender,
          masaHabitual: client.weight.toString(),
          // In a real app, you would fetch the full profile details here
      });
      setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('¿Estás seguro de eliminar este perfil? Esta acción no se puede deshacer.')) {
          setClientsData(prev => prev.filter(c => c.id !== id));
          // Adjust pagination if deleting the last item on a page
          if (paginatedClients.length === 1 && currentPage > 1) {
              setCurrentPage(prev => prev - 1);
          }
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const todayStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
    const fullName = `${formData.nombre} ${formData.apellido}`;

    if (editingClientId) {
        // UPDATE Existing
        setClientsData(prev => prev.map(c => {
            if (c.id === editingClientId) {
                return {
                    ...c,
                    name: fullName,
                    email: formData.email,
                    gender: formData.sexo as any,
                    weight: parseFloat(formData.masaHabitual) || c.weight,
                    lastVisit: todayStr, // Update date moves it to top
                };
            }
            return c;
        }));
    } else {
        // CREATE New
        const newClient: Client = {
            id: `C-${Math.floor(Math.random() * 10000)}`,
            name: fullName,
            email: formData.email,
            image: '', // Placeholder or uploaded
            age: new Date().getFullYear() - new Date(formData.nacimiento).getFullYear() || 25,
            gender: formData.sexo as any,
            weight: parseFloat(formData.masaHabitual) || 70,
            weightDiff: 0,
            lastVisit: todayStr, // New date moves it to top
            status: 'Activo',
            goal: 'Evaluación',
            bodyFat: 0
        };
        setClientsData(prev => [newClient, ...prev]);
    }

    setIsModalOpen(false);
    setFormData(initialFormState);
    setCurrentPage(1); // Go to first page to see the change/new item
  };

  return (
    <div className="flex-col gap-8 flex h-full relative">
        
        {/* NEW CLIENT MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm transition-opacity">
            <div className="bg-surface-light dark:bg-background-dark w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border border-input-border dark:border-gray-700 flex flex-col animate-in zoom-in-95 duration-200">
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-input-border dark:border-gray-700 bg-white dark:bg-surface-dark rounded-t-2xl shrink-0">
                <div>
                  <h2 className="text-2xl font-black text-text-dark dark:text-white">
                      {editingClientId ? 'Ficha del Atleta' : 'Nuevo Perfil de Atleta'}
                  </h2>
                  <p className="text-sm text-text-muted dark:text-gray-400">
                      {editingClientId ? 'Visualiza o edita los datos del paciente.' : 'Ingresa los datos para la evaluación antropométrica y deportiva.'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form Content - Scrollable */}
              <form id="client-form" onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-10">
                
                {/* 1. DATOS PERSONALES */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider">1. Datos Personales</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
                    {/* Foto Upload */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-40 rounded-2xl border-2 border-dashed border-input-border dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all cursor-pointer bg-white dark:bg-black/20">
                        <span className="material-symbols-outlined text-4xl mb-2">add_a_photo</span>
                        <span className="text-xs font-bold uppercase">Subir Foto</span>
                      </div>
                    </div>

                    {/* Personal Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Nombre *</label>
                        <input required name="nombre" value={formData.nombre} onChange={handleInputChange} className="input-field" placeholder="Ej. Juan" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Apellido *</label>
                        <input required name="apellido" value={formData.apellido} onChange={handleInputChange} className="input-field" placeholder="Ej. Pérez" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Fecha Nacimiento</label>
                        <input type="date" name="nacimiento" value={formData.nacimiento} onChange={handleInputChange} className="input-field" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Sexo *</label>
                        <select required name="sexo" value={formData.sexo} onChange={handleInputChange} className="input-field">
                          <option>Masculino</option>
                          <option>Femenino</option>
                          <option>Otro</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Email *</label>
                        <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" placeholder="cliente@email.com" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Teléfono</label>
                        <input name="telefono" value={formData.telefono} onChange={handleInputChange} className="input-field" placeholder="+54 9 11..." />
                      </div>
                      <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
                        <label className="text-xs font-bold text-text-muted uppercase">Dirección</label>
                        <input name="direccion" value={formData.direccion} onChange={handleInputChange} className="input-field" placeholder="Calle, Altura, Ciudad" />
                      </div>
                    </div>
                  </div>
                </section>

                <hr className="border-input-border dark:border-gray-700" />

                {/* 2. CARACTERÍSTICAS FÍSICAS */}
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">accessibility_new</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider">2. Características Físicas</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase">Raza</label>
                      <select name="raza" value={formData.raza} onChange={handleInputChange} className="input-field">
                        <option>Caucásico/latino</option>
                        <option>Negro</option>
                        <option>Asiático/Indio</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase">Mano Dominante</label>
                      <select name="mano" value={formData.mano} onChange={handleInputChange} className="input-field">
                        <option>Diestra</option>
                        <option>Zurda</option>
                        <option>Ambidiestra</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase">Pie Dominante</label>
                      <select name="pie" value={formData.pie} onChange={handleInputChange} className="input-field">
                        <option>Diestro</option>
                        <option>Zurdo</option>
                        <option>Ambidiestro</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-background-light dark:bg-black/20 p-5 rounded-xl border border-input-border dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase">Tipo Actividad</label>
                      <select name="actividadTipo" value={formData.actividadTipo} onChange={handleInputChange} className="input-field">
                        <option>Activa</option>
                        <option>Sedentaria</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase">Intensidad</label>
                      <select name="actividadIntensidad" value={formData.actividadIntensidad} onChange={handleInputChange} className="input-field">
                        <option>Baja</option>
                        <option>Moderada</option>
                        <option>Alta</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase">Frecuencia</label>
                      <select name="actividadFrecuencia" value={formData.actividadFrecuencia} onChange={handleInputChange} className="input-field">
                        <option>1 vez por semana</option>
                        <option>2 veces por semana</option>
                        <option>Entre 3 y 5 veces por semana</option>
                        <option>Más de 5 veces por semana</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-text-muted uppercase">Nivel Competencia</label>
                      <select name="nivelCompetencia" value={formData.nivelCompetencia} onChange={handleInputChange} className="input-field">
                        <option>Recreativo</option>
                        <option>Competitivo-amateur</option>
                        <option>Competitivo-semi-profesional</option>
                        <option>Competitivo-profesional</option>
                        <option>Competitivo-profesional-élite</option>
                      </select>
                    </div>
                  </div>
                </section>

                <hr className="border-input-border dark:border-gray-700" />

                {/* 3. DEPORTE */}
                <section>
                   <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">sports_basketball</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider">3. Perfil Deportivo</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase flex items-center gap-2">
                           Deporte Principal <span className="text-primary text-[10px] bg-primary/10 px-1 rounded">Buscador Inteligente</span>
                        </label>
                        <input 
                          list="sports-list" 
                          name="deporte" 
                          value={formData.deporte} 
                          onChange={handleInputChange}
                          className="input-field" 
                          placeholder="Escribe para buscar (ej. CrossFit, Fútbol...)" 
                        />
                        <datalist id="sports-list">
                          {Object.entries(SPORTS_LIST).map(([category, sports]) => (
                            <optgroup key={category} label={category}>
                               {sports.map(sport => <option key={sport} value={sport} />)}
                            </optgroup>
                          ))}
                        </datalist>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-text-muted uppercase">Posición / Demarcación / Prueba</label>
                        <input name="posicion" value={formData.posicion} onChange={handleInputChange} className="input-field" placeholder="Ej. Arquero, 100m llanos, Categoría RX" />
                     </div>
                  </div>
                </section>

                <hr className="border-input-border dark:border-gray-700" />

                {/* 4. HISTORIAL DE PESO */}
                 <section>
                   <div className="flex items-center gap-3 mb-6">
                    <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">monitor_weight</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider">4. Historial Corporal</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="flex flex-col gap-1.5 relative">
                       <label className="text-xs font-bold text-text-muted uppercase">Masa corporal máxima</label>
                       <input type="number" name="masaMax" value={formData.masaMax} onChange={handleInputChange} className="input-field pr-8" placeholder="0.0" />
                       <span className="absolute right-3 top-8 text-sm text-gray-400">kg</span>
                    </div>
                    <div className="flex flex-col gap-1.5 relative">
                       <label className="text-xs font-bold text-text-muted uppercase">Masa corporal mínima</label>
                       <input type="number" name="masaMin" value={formData.masaMin} onChange={handleInputChange} className="input-field pr-8" placeholder="0.0" />
                       <span className="absolute right-3 top-8 text-sm text-gray-400">kg</span>
                    </div>
                     <div className="flex flex-col gap-1.5 relative">
                       <label className="text-xs font-bold text-text-muted uppercase">Masa corporal habitual</label>
                       <input type="number" name="masaHabitual" value={formData.masaHabitual} onChange={handleInputChange} className="input-field pr-8" placeholder="0.0" />
                       <span className="absolute right-3 top-8 text-sm text-gray-400">kg</span>
                    </div>
                  </div>
                 </section>

                 <hr className="border-input-border dark:border-gray-700" />

                 {/* 5. DATOS DE INTERÉS CLÍNICO-DEPORTIVO */}
                 <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">medical_services</span>
                      </div>
                      <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider">5. Datos de interés clínico-deportivo</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                       <div className="flex flex-col gap-2">
                          <label className="text-xs font-bold text-text-muted uppercase">Alimentación planificada por Nutricionista</label>
                          <div className="flex gap-4 mb-2">
                             <label className="flex items-center gap-2 cursor-pointer">
                               <input type="radio" name="nutricionista" value="Si" checked={formData.nutricionista === 'Si'} onChange={handleInputChange} className="text-primary focus:ring-primary" />
                               <span className="text-sm font-medium dark:text-white">Sí</span>
                             </label>
                             <label className="flex items-center gap-2 cursor-pointer">
                               <input type="radio" name="nutricionista" value="No" checked={formData.nutricionista === 'No'} onChange={handleInputChange} className="text-primary focus:ring-primary" />
                               <span className="text-sm font-medium dark:text-white">No</span>
                             </label>
                          </div>
                          {formData.nutricionista === 'Si' && (
                             <input className="input-field animate-in fade-in" placeholder="Observaciones sobre la dieta..." />
                          )}
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="flex flex-col gap-1.5">
                             <label className="text-xs font-bold text-text-muted uppercase">Patologías (ej: hiperlexia de rodilla derecha)</label>
                             <textarea name="patologias" value={formData.patologias} onChange={handleInputChange} rows={3} className="input-field py-2" placeholder="Describa aquí..." />
                          </div>
                          <div className="flex flex-col gap-1.5">
                             <label className="text-xs font-bold text-text-muted uppercase">Cirugías Previas</label>
                             <textarea name="cirugias" value={formData.cirugias} onChange={handleInputChange} rows={3} className="input-field py-2" placeholder="Detalle y fecha aproximada..." />
                          </div>
                          <div className="flex flex-col gap-1.5 md:col-span-2">
                             <label className="text-xs font-bold text-text-muted uppercase">Medicación</label>
                             <textarea name="medicacion" value={formData.medicacion} onChange={handleInputChange} rows={2} className="input-field py-2" placeholder="Nombre, dosis y frecuencia..." />
                          </div>
                       </div>
                    </div>
                 </section>

              </form>

              {/* Footer - Fixed */}
              <div className="p-6 border-t border-input-border dark:border-gray-700 bg-white dark:bg-surface-dark rounded-b-2xl shrink-0 flex gap-4 justify-end">
                 <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-lg border border-input-border dark:border-gray-600 text-text-dark dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                 >
                   Cancelar
                 </button>
                 <button 
                  onClick={handleSubmit}
                  className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark text-black font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                 >
                   <span className="material-symbols-outlined">save</span>
                   {editingClientId ? 'Actualizar Ficha' : 'Guardar Ficha Técnica'}
                 </button>
              </div>

            </div>
          </div>
        )}

        {/* Page Heading & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl md:text-4xl font-black text-text-dark dark:text-white tracking-tight">Gestión de Clientes</h2>
            <p className="text-text-muted dark:text-gray-400 text-base font-normal max-w-xl">
              Visualiza y administra los datos antropométricos y el progreso de tus pacientes.
            </p>
          </div>
          <button 
            onClick={handleOpenNew}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:scale-95 transition-all text-black font-bold h-12 px-6 rounded-lg shadow-lg shadow-primary/20 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-text-muted dark:text-gray-400 text-sm font-medium">Total Clientes</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-md text-[20px]">groups</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-text-dark dark:text-white">{clientsData.length}</span>
              <span className="text-sm font-semibold text-primary mb-1.5 flex items-center">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> 5%
              </span>
            </div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-text-muted dark:text-gray-400 text-sm font-medium">Planes Activos</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-md text-[20px]">fitness_center</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-text-dark dark:text-white">85</span>
              <span className="text-sm font-semibold text-primary mb-1.5 flex items-center">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> 2%
              </span>
            </div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-text-muted dark:text-gray-400 text-sm font-medium">Revisiones Pendientes</p>
              <span className="material-symbols-outlined text-orange-500 bg-orange-500/10 p-1.5 rounded-md text-[20px]">pending_actions</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-text-dark dark:text-white">12</span>
              <span className="text-sm font-medium text-text-muted dark:text-gray-500 mb-1.5">esta semana</span>
            </div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-text-muted dark:text-gray-400 text-sm font-medium">Nuevos (Mes)</p>
              <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-1.5 rounded-md text-[20px]">person_add</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-text-dark dark:text-white">8</span>
              <span className="text-sm font-semibold text-primary mb-1.5 flex items-center">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> 10%
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Table Section */}
        <div className="flex flex-col bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {/* Search Toolbar */}
          <div className="p-4 md:p-5 border-b border-input-border dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-surface-dark">
            <div className="relative w-full md:w-96 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-gray-800 border border-input-border dark:border-gray-700 rounded-lg text-sm text-text-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
                placeholder="Buscar por nombre, email o ID..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative w-full md:w-48">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">filter_list</span>
                <select 
                  className="w-full appearance-none pl-10 pr-8 py-2.5 bg-background-light dark:bg-gray-800 border border-input-border dark:border-gray-700 rounded-lg text-sm text-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos los Estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="pending">Pendientes</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none">expand_more</span>
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-input-border dark:border-gray-700 rounded-lg hover:bg-background-light dark:hover:bg-gray-800 transition-colors text-text-dark dark:text-white">
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span className="hidden sm:inline text-sm font-medium">Exportar</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100/80 dark:bg-gray-800 border-b border-input-border dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Edad / Sexo</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Peso Actual</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Última Visita</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-input-border dark:divide-gray-700">
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => (
                    <tr key={client.id} className="group border-b border-input-border/50 dark:border-gray-700 last:border-0 transition-colors hover:bg-primary/5 dark:hover:bg-primary/10 even:bg-gray-50/80 dark:even:bg-white/5">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                        {client.image ? (
                            <div className="size-10 rounded-full bg-cover bg-center border border-gray-200" style={{ backgroundImage: `url('${client.image}')` }}></div>
                        ) : (
                            <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 flex items-center justify-center text-primary font-bold text-lg">
                                {client.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold text-text-dark dark:text-white">{client.name}</p>
                            <p className="text-xs text-text-muted dark:text-gray-500">ID: #{client.id}</p>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-dark dark:text-gray-300">{client.age} Años</div>
                        <div className="text-xs text-text-muted dark:text-gray-500">{client.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-dark dark:text-white">{client.weight} kg</span>
                        {client.weightDiff !== 0 && (
                            <span className={`text-xs font-medium flex items-center px-1.5 py-0.5 rounded ${client.weightDiff < 0 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20'}`}>
                                {client.weightDiff > 0 ? '+' : ''}{client.weightDiff}kg
                            </span>
                        )}
                        {client.weightDiff === 0 && (
                            <span className="text-xs font-medium text-gray-500 flex items-center bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">--</span>
                        )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted dark:text-gray-400">
                        {client.lastVisit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {client.status === 'Activo' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                <span className="size-1.5 rounded-full bg-green-500"></span> Activo
                            </span>
                        )}
                        {client.status === 'Pendiente' && (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                             <span className="size-1.5 rounded-full bg-yellow-500"></span> Pendiente
                         </span>
                        )}
                        {client.status === 'Inactivo' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            <span className="size-1.5 rounded-full bg-gray-400"></span> Inactivo
                        </span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(client)} className="p-1.5 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors" title="Ver Ficha">
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        <button onClick={() => handleEdit(client)} className="p-1.5 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(client.id)} className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors" title="Eliminar">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                        </div>
                    </td>
                    </tr>
                ))
               ) : (
                   <tr>
                       <td colSpan={6} className="px-6 py-12 text-center text-text-muted dark:text-gray-500">
                           No se encontraron clientes con los filtros actuales.
                       </td>
                   </tr>
               )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-input-border dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-surface-dark">
            <span className="text-sm text-text-muted dark:text-gray-400">
                Mostrando <span className="font-medium text-text-dark dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium text-text-dark dark:text-white">{Math.min(currentPage * itemsPerPage, processedClients.length)}</span> de <span className="font-medium text-text-dark dark:text-white">{processedClients.length}</span> resultados
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center p-2 rounded-lg border border-input-border dark:border-gray-700 hover:bg-background-light dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              
              {/* Dynamic Page Numbers */}
              {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  // Only show reasonable number of pages around current or ends
                  if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`min-w-[32px] h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors
                                ${currentPage === page 
                                    ? 'bg-primary text-black' 
                                    : 'hover:bg-background-light dark:hover:bg-gray-800 text-text-muted dark:text-gray-400'}
                            `}
                          >
                            {page}
                          </button>
                      );
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="text-gray-400">...</span>;
                  }
                  return null;
              })}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="flex items-center justify-center p-2 rounded-lg border border-input-border dark:border-gray-700 hover:bg-background-light dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        
        <style>{`
            .input-field {
                width: 100%;
                border-radius: 0.5rem;
                border: 1px solid #cfe7d7;
                padding: 0.625rem 0.875rem;
                font-size: 0.875rem;
                line-height: 1.25rem;
                color: #0d1b12;
                background-color: white;
                transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
                transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                transition-duration: 200ms;
            }
            .dark .input-field {
                background-color: rgba(0, 0, 0, 0.2);
                border-color: #374151;
                color: white;
            }
            .input-field:focus {
                outline: 2px solid transparent;
                outline-offset: 2px;
                --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
                --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
                box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
                --tw-ring-opacity: 1;
                --tw-ring-color: #13ec5b;
                border-color: transparent;
            }
        `}</style>
    </div>
  );
};

export default Clients;