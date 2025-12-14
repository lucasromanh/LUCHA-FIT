import React, { useState, useMemo, useEffect } from 'react';
import { CLIENTS } from '../constants';
import { Client } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';

// --- DATA CONSTANTS ---

// 1. SPORTS LIST (Categorized)
const SPORTS_DATA = {
  "Deportes Básicos": ["Fútbol", "Fútbol sala", "Fútbol 5 / 7 / 11", "Básquet", "Vóley", "Handball", "Hockey", "Rugby", "Tenis", "Pádel", "Ping pong", "Atletismo", "Natación", "Ciclismo", "Running", "Trail running", "Caminata recreativa"],
  "Fuerza y Fitness": ["Musculación", "Fitness general", "CrossFit", "Cross Training", "Hyrox", "Halterofilia", "Powerlifting", "Strongman", "Calistenia", "Street workout", "Bodybuilding", "Funcional", "Entrenamiento militar"],
  "Artes Marciales y Combate": ["Boxeo", "Kickboxing", "Muay Thai", "MMA", "Judo", "Karate", "Taekwondo", "Jiu Jitsu", "Lucha olímpica", "Lucha grecorromana", "Esgrima"],
  "Outdoor": ["Escalada", "Montañismo", "Trekking", "Esquí", "Snowboard", "Surf", "Kitesurf", "Windsurf", "Skate", "Longboard", "BMX", "Mountain bike"],
  "Bienestar y Control": ["Yoga", "Pilates", "Stretching", "Movilidad", "Reeducación postural", "Gimnasia terapéutica"]
};

// Flattened list for search
const ALL_SPORTS = Object.values(SPORTS_DATA).flat().sort();

// helper for date sorting
const parseDateStr = (dateStr: string) => {
  const months: { [key: string]: number } = {
    'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11
  };
  const parts = dateStr.split(' ');
  if (parts.length < 3) return new Date(0).getTime();
  return new Date(parseInt(parts[2]), months[parts[1]] || 0, parseInt(parts[0])).getTime();
};

const Clients: React.FC = () => {
  // --- STATE ---
  // Initialize from LocalStorage if available, else use default CLIENTS
  const [clientsData, setClientsData] = useState<Client[]>(() => {
    const saved = localStorage.getItem('clients_data');
    return saved ? JSON.parse(saved) : CLIENTS;
  });

  // Persist to LocalStorage whenever clientsData changes
  useEffect(() => {
    localStorage.setItem('clients_data', JSON.stringify(clientsData));
  }, [clientsData]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'create' | 'edit' | 'view'>('create');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; clientId: string | null; clientName: string }>({ 
    isOpen: false, 
    clientId: null,
    clientName: ''
  });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Sports Search State
  const [sportSearch, setSportSearch] = useState('');
  const [showSportDropdown, setShowSportDropdown] = useState(false);

  // Form State (Comprehensive)
  const initialFormState = {
    // 1. Datos Personales
    nombre: '', apellido: '', nacimiento: '', sexo: 'Masculino', email: '', telefono: '', direccion: '', foto: null as any,
    // 2. Características (Antropometría)
    raza: 'Caucásico/latino', mano: 'Diestra', pie: 'Diestro',
    tipoActividad: 'Activa', intensidadActividad: 'Moderada', frecuenciaActividad: '3-5 veces por semana', nivelCompetencia: 'Recreativo',
    // 3. Deporte (Multi-select)
    deportes: [] as string[],
    // 4. Posición
    posicion: '',
    // 5. Historial Masas
    masaMax: '', masaMin: '', masaHabitual: '',
    // 6. Clínico
    nutricionista: 'No', patologias: '', cirugias: '', medicacion: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // --- ACTIONS ---

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, foto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenNew = () => {
    setEditingClientId(null);
    setViewMode('create');
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClientId(client.id);
    setViewMode('edit');
    loadClientData(client);
    setIsModalOpen(true);
  };

  const handleView = (client: Client) => {
    setEditingClientId(client.id);
    setViewMode('view');
    loadClientData(client);
    setIsModalOpen(true);
  };

  // Simulate loading complex data from flat client object (In real app, fetch full profile)
  const loadClientData = (client: Client) => {
    const [firstName, ...restName] = client.name.split(' ');
    setFormData({
      // Personal
      nombre: firstName,
      apellido: restName.join(' '),
      nacimiento: client.birthDate || '',
      sexo: client.gender,
      email: client.email || '',
      telefono: client.phone || '',
      direccion: client.address || '',
      foto: client.image || null,

      // Anthro
      raza: client.race || 'Caucásico/latino',
      mano: client.handDominance || 'Diestra',
      pie: client.footDominance || 'Diestro',
      tipoActividad: client.activityType || 'Activa',
      intensidadActividad: client.activityIntensity || 'Moderada',
      frecuenciaActividad: client.activityFrequency || '3-5 veces por semana',
      nivelCompetencia: client.competitionLevel || 'Recreativo',

      // Sports & Position
      deportes: client.sports || [],
      posicion: client.position || '',

      // Mass History
      masaMax: client.massMax?.toString() || '',
      masaMin: client.massMin?.toString() || '',
      masaHabitual: client.weight.toString(),

      // Clinical
      nutricionista: client.nutritionist || 'No',
      patologias: client.pathologies || '',
      cirugias: client.surgeries || '',
      medicacion: client.medication || ''
    });
  };

  const handleDelete = (id: string) => {
    const client = clientsData.find(c => c.id === id);
    setConfirmDelete({ 
      isOpen: true, 
      clientId: id,
      clientName: client?.name || 'este perfil'
    });
  };

  const confirmDeleteAction = () => {
    if (confirmDelete.clientId) {
      setClientsData(prev => prev.filter(c => c.id !== confirmDelete.clientId));
    }
    setConfirmDelete({ isOpen: false, clientId: null, clientName: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Sport Selector Logic
  const toggleSport = (sport: string) => {
    setFormData(prev => {
      const exists = prev.deportes.includes(sport);
      return {
        ...prev,
        deportes: exists ? prev.deportes.filter(s => s !== sport) : [...prev.deportes, sport]
      };
    });
    setSportSearch(''); // Reset search after select
  };

  const filteredSports = useMemo(() => {
    if (!sportSearch) return [];
    return ALL_SPORTS.filter(s => s.toLowerCase().includes(sportSearch.toLowerCase())).slice(0, 8);
  }, [sportSearch]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const todayStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '');
    const fullName = `${formData.nombre} ${formData.apellido}`;

    if (editingClientId) {
      setClientsData(prev => prev.map(c => c.id === editingClientId ? {
        ...c,
        name: fullName,
        email: formData.email,
        image: (formData.foto as string) || c.image,
        age: new Date().getFullYear() - new Date(formData.nacimiento).getFullYear() || c.age,
        gender: formData.sexo as any,
        weight: parseFloat(formData.masaHabitual) || c.weight,
        lastVisit: todayStr,
        // Update new fields
        phone: formData.telefono,
        address: formData.direccion,
        birthDate: formData.nacimiento,
        race: formData.raza,
        handDominance: formData.mano,
        footDominance: formData.pie,
        activityType: formData.tipoActividad,
        activityIntensity: formData.intensidadActividad,
        activityFrequency: formData.frecuenciaActividad,
        competitionLevel: formData.nivelCompetencia,
        sports: formData.deportes,
        position: formData.posicion,
        massMax: parseFloat(formData.masaMax),
        massMin: parseFloat(formData.masaMin),
        nutritionist: formData.nutricionista,
        pathologies: formData.patologias,
        surgeries: formData.cirugias,
        medication: formData.medicacion
      } : c));
    } else {
      const newClient: Client = {
        id: `C-${Math.floor(Math.random() * 10000)}`,
        name: fullName,
        email: formData.email,
        image: (formData.foto as string) || '', // Save valid image data
        age: new Date().getFullYear() - new Date(formData.nacimiento).getFullYear() || 25,
        gender: formData.sexo as any,
        weight: parseFloat(formData.masaHabitual) || 70,
        weightDiff: 0,
        lastVisit: todayStr, status: 'Activo', goal: 'Evaluación', bodyFat: 0,
        // Save new fields
        phone: formData.telefono,
        address: formData.direccion,
        birthDate: formData.nacimiento,
        race: formData.raza,
        handDominance: formData.mano,
        footDominance: formData.pie,
        activityType: formData.tipoActividad,
        activityIntensity: formData.intensidadActividad,
        activityFrequency: formData.frecuenciaActividad,
        competitionLevel: formData.nivelCompetencia,
        sports: formData.deportes,
        position: formData.posicion,
        massMax: parseFloat(formData.masaMax),
        massMin: parseFloat(formData.masaMin),
        nutritionist: formData.nutricionista,
        pathologies: formData.patologias,
        surgeries: formData.cirugias,
        medication: formData.medicacion
      };
      setClientsData(prev => [newClient, ...prev]);
    }
    setIsModalOpen(false);
    setFormData(initialFormState);
  };

  // --- RENDER HELPERS ---

  const processedClients = useMemo(() => {
    return clientsData
      .filter(c =>
        (searchTerm ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) : true) &&
        (filterStatus ? c.status === filterStatus : true)
      )
      .sort((a, b) => parseDateStr(b.lastVisit) - parseDateStr(a.lastVisit));
  }, [clientsData, searchTerm, filterStatus]);

  const paginatedClients = processedClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(processedClients.length / itemsPerPage);

  const renderStatusBadge = (status: string) => {
    const styles = {
      'Activo': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
      'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
      'Inactivo': 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
    }[status] || '';
    const color = { 'Activo': 'bg-green-500', 'Pendiente': 'bg-yellow-500', 'Inactivo': 'bg-gray-400' }[status];

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${styles}`}>
        <span className={`size-1.5 rounded-full ${color}`}></span> {status}
      </span>
    );
  };

  return (
    <div className="flex-col gap-8 flex relative pb-20 w-full">

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm transition-opacity">
          <div className="bg-surface-light dark:bg-background-dark w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border border-input-border dark:border-gray-700 flex flex-col animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-input-border dark:border-gray-700 bg-white dark:bg-surface-dark rounded-t-2xl shrink-0">
              <div>
                <h2 className="text-2xl font-black text-text-dark dark:text-white">
                  {viewMode === 'create' ? 'Nuevo Perfil de Paciente' : viewMode === 'edit' ? 'Editar Ficha' : 'Ficha Técnica Digital'}
                </h2>
                <p className="text-sm text-text-muted dark:text-gray-400">
                  {viewMode === 'view' ? 'Visualización completa del historial deportivo y clínico.' : 'Complete todos los campos requeridos para el alta.'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex flex-col gap-10">
              <fieldset disabled={viewMode === 'view'} className="contents">

                {/* 1. DATOS PERSONALES */}
                <section>
                  <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">person</span> 1. Datos Personales
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
                    {/* Foto */}
                    <div className="flex flex-col items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <div
                        onClick={() => viewMode !== 'view' && fileInputRef.current?.click()}
                        className={`size-40 rounded-2xl border-2 border-dashed border-input-border dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 hover:border-primary hover:text-primary transition-all cursor-pointer bg-white dark:bg-black/20 relative overflow-hidden group ${viewMode === 'view' ? 'cursor-default' : ''}`}
                      >
                        {formData.foto ? (
                          <img src={formData.foto as string} alt="Perfil" className="w-full h-full object-cover" />
                        ) : viewMode === 'view' ? (
                          <span className="material-symbols-outlined text-6xl text-gray-300">account_circle</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-4xl mb-2">add_a_photo</span>
                            <span className="text-xs font-bold uppercase">Subir Foto</span>
                          </>
                        )}

                        {/* Hover Overlay for Edit when photo exists */}
                        {formData.foto && viewMode !== 'view' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white text-3xl">edit</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Nombre *</label><input required name="nombre" value={formData.nombre} onChange={handleInputChange} className="input-field" placeholder="Nombre" /></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Apellido *</label><input required name="apellido" value={formData.apellido} onChange={handleInputChange} className="input-field" placeholder="Apellido" /></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Nacimiento</label><input type="date" name="nacimiento" value={formData.nacimiento} onChange={handleInputChange} className="input-field" /></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Sexo *</label>
                        <select required name="sexo" value={formData.sexo} onChange={handleInputChange} className="input-field">
                          <option>Masculino</option><option>Femenino</option><option>Otro</option>
                        </select>
                      </div>
                      <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Email *</label><input required name="email" value={formData.email} onChange={handleInputChange} className="input-field" placeholder="email@ejemplo.com" /></div>
                      <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Teléfono</label><input name="telefono" value={formData.telefono} onChange={handleInputChange} className="input-field" placeholder="+54..." /></div>
                      <div className="space-y-1 col-span-full"><label className="text-xs font-bold text-text-muted uppercase">Dirección</label><input name="direccion" value={formData.direccion} onChange={handleInputChange} className="input-field" placeholder="Domicilio completo" /></div>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* 2. ANTROPOMETRÍA BASE */}
                <section>
                  <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">accessibility_new</span> 2. Características Físicas
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Raza</label>
                      <select name="raza" value={formData.raza} onChange={handleInputChange} className="input-field">
                        <option>Caucásico/latino</option><option>Negro</option><option>Asiático/Indio</option>
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Mano Dominante</label>
                      <select name="mano" value={formData.mano} onChange={handleInputChange} className="input-field">
                        <option>Diestra</option><option>Zurda</option><option>Ambidiestra</option>
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Pie Dominante</label>
                      <select name="pie" value={formData.pie} onChange={handleInputChange} className="input-field">
                        <option>Diestro</option><option>Zurdo</option><option>Ambidiestro</option>
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Tipo Actividad</label>
                      <select name="tipoActividad" value={formData.tipoActividad} onChange={handleInputChange} className="input-field">
                        <option>Activa</option><option>Sedentaria</option>
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Intensidad</label>
                      <select name="intensidadActividad" value={formData.intensidadActividad} onChange={handleInputChange} className="input-field" disabled={formData.tipoActividad !== 'Activa'}>
                        <option>Baja</option><option>Moderada</option><option>Alta</option>
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Frecuencia</label>
                      <select name="frecuenciaActividad" value={formData.frecuenciaActividad} onChange={handleInputChange} className="input-field">
                        <option>1 vez por semana</option><option>2 veces por semana</option><option>3-5 veces por semana</option><option>+5 veces por semana</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-3"><label className="text-xs font-bold text-text-muted uppercase">Nivel Competición</label>
                      <select name="nivelCompetencia" value={formData.nivelCompetencia} onChange={handleInputChange} className="input-field">
                        <option>Recreativo</option><option>Competitivo-amateur</option><option>Competitivo-semi-profesional</option><option>Competitivo-profesional</option><option>Competitivo-profesional-élite</option>
                      </select>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* 3. DEPORTE (Multi-Select) */}
                <section className="relative">
                  <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">sports_soccer</span> 3. Deporte (Selección Múltiple)
                  </h3>

                  {/* Selected Chips */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.deportes.map(sport => (
                      <span key={sport} className="px-3 py-1 bg-primary text-black font-bold rounded-lg text-sm flex items-center gap-1 shadow-sm">
                        {sport}
                        {viewMode !== 'view' && (
                          <button type="button" onClick={() => toggleSport(sport)} className="hover:text-white"><span className="material-symbols-outlined text-sm">close</span></button>
                        )}
                      </span>
                    ))}
                    {formData.deportes.length === 0 && <span className="text-sm text-gray-400 italic">Ningún deporte seleccionado</span>}
                  </div>

                  {/* Search Input */}
                  {viewMode !== 'view' && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar deporte (ej. Fútbol, CrossFit, Yoga)..."
                        className="input-field pl-10"
                        value={sportSearch}
                        onChange={(e) => { setSportSearch(e.target.value); setShowSportDropdown(true); }}
                        onFocus={() => setShowSportDropdown(true)}
                      />
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>

                      {/* Dropdown Results */}
                      {showSportDropdown && sportSearch && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-input-border dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {filteredSports.length > 0 ? filteredSports.map(sport => (
                            <button
                              key={sport}
                              type="button"
                              onClick={() => toggleSport(sport)}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/5 flex justify-between
                                                                ${formData.deportes.includes(sport) ? 'text-primary font-bold bg-primary/5' : 'text-text-dark dark:text-white'}
                                                            `}
                            >
                              {sport}
                              {formData.deportes.includes(sport) && <span className="material-symbols-outlined text-sm">check</span>}
                            </button>
                          )) : (
                            <div className="px-4 py-2 text-xs text-gray-500">No hay coincidencias</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* 4. POSICIÓN & 5. HISTORIAL */}
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 4. POSICIÓN */}
                    <div>
                      <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">radar</span> 4. Posición / Roles
                      </h3>
                      <input name="posicion" value={formData.posicion} onChange={handleInputChange} className="input-field" placeholder="Ej. Arquero, WOD RX, Prueba 100m..." />
                    </div>

                    {/* 5. HISTORIAL MASA */}
                    <div>
                      <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">monitor_weight</span> 5. Masas (kg)
                      </h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Máxima</label><input type="number" name="masaMax" value={formData.masaMax} onChange={handleInputChange} className="input-field" placeholder="0.0" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Mínima</label><input type="number" name="masaMin" value={formData.masaMin} onChange={handleInputChange} className="input-field" placeholder="0.0" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Habitual</label><input type="number" name="masaHabitual" value={formData.masaHabitual} onChange={handleInputChange} className="input-field" placeholder="0.0" /></div>
                      </div>
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100 dark:border-gray-800" />

                {/* 6. DATOS CLÍNICOS */}
                <section>
                  <h3 className="text-lg font-bold text-text-dark dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">medical_services</span> 6. Datos Clínicos
                  </h3>
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Nutricionista (Planificada)</label>
                      <select name="nutricionista" value={formData.nutricionista} onChange={handleInputChange} className="input-field mb-2">
                        <option>No</option><option>Sí</option><option>Observaciones</option>
                      </select>
                    </div>
                    <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Patologías / Lesiones Previas</label>
                      <textarea name="patologias" value={formData.patologias} onChange={handleInputChange} className="input-field min-h-[80px]" placeholder="Describa lesiones previas..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Cirugías</label>
                        <textarea name="cirugias" value={formData.cirugias} onChange={handleInputChange} className="input-field min-h-[80px]" placeholder="Procedimientos quirúrgicos..." />
                      </div>
                      <div className="space-y-1"><label className="text-xs font-bold text-text-muted uppercase">Medicación</label>
                        <textarea name="medicacion" value={formData.medicacion} onChange={handleInputChange} className="input-field min-h-[80px]" placeholder="Medicación actual..." />
                      </div>
                    </div>
                  </div>
                </section>

              </fieldset>
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-input-border dark:border-gray-700 bg-white dark:bg-surface-dark rounded-b-2xl shrink-0 flex gap-4 justify-end">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-lg border border-input-border dark:border-gray-600 text-text-dark dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                {viewMode === 'view' ? 'Cerrar Ficha' : 'Cancelar'}
              </button>
              {viewMode !== 'view' && (
                <button onClick={handleSubmit} className="px-8 py-3 rounded-lg bg-primary hover:bg-primary-dark text-black font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined">save</span>
                  {viewMode === 'edit' ? 'Actualizar Datos' : 'Guardar Ficha'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- PAGE CONTENT (Unchanged Layout) --- */}
      {/* Page Heading */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl md:text-4xl font-black text-text-dark dark:text-white tracking-tight">Gestión de Pacientes</h2>
          <p className="text-text-muted dark:text-gray-400 text-base font-normal max-w-xl">
            Visualiza y administra los datos antropométricos y las fichas técnicas de tus pacientes.
          </p>
        </div>
        <button onClick={handleOpenNew} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:scale-95 transition-all text-black font-bold h-12 px-6 rounded-lg shadow-lg shadow-primary/20 whitespace-nowrap">
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>Nuevo Paciente</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between"><p className="text-text-muted dark:text-gray-400 text-sm font-medium">Total Pacientes</p><span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-md text-[20px]">groups</span></div>
          <div className="flex items-end gap-2 mt-2"><span className="text-3xl font-bold text-text-dark dark:text-white">{clientsData.length}</span></div>
        </div>
        <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
          <div className="flex items-center justify-between"><p className="text-text-muted dark:text-gray-400 text-sm font-medium">Fichas Activas</p><span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-md text-[20px]">description</span></div>
          <div className="flex items-end gap-2 mt-2"><span className="text-3xl font-bold text-text-dark dark:text-white">{clientsData.filter(c => c.status === 'Activo').length}</span></div>
        </div>
      </div>

      {/* Filters - Restored Professional Design */}
      <div className="p-4 md:p-5 border border-input-border dark:border-gray-700 rounded-xl bg-white dark:bg-surface-dark shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-input-border dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-48">
            <select
              className="w-full appearance-none px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-input-border dark:border-gray-700 rounded-lg text-sm cursor-pointer focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Todos los Estados</option>
              <option value="Activo">Activos</option>
              <option value="Pendiente">Pendientes</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">expand_more</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/80 dark:bg-gray-800 border-b border-input-border dark:border-gray-700">
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted">Paciente</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted">Edad / Sexo</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted">Estado</th>
                <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-input-border dark:divide-gray-700">
              {paginatedClients.map(client => (
                <tr key={client.id} className="hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {client.image ? (
                        <img src={client.image} alt={client.name} className="size-10 rounded-full object-cover border border-gray-200" />
                      ) : (
                        <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-primary font-bold">{client.name.substring(0, 2)}</div>
                      )}
                      <div><p className="font-bold text-text-dark dark:text-white">{client.name}</p><p className="text-xs text-text-muted">{client.id}</p></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-dark dark:text-white">{client.age} años - {client.gender === 'Masculino' ? 'M' : 'F'}</td>
                  <td className="px-6 py-4">{renderStatusBadge(client.status)}</td>
                  <td className="px-6 py-4 text-right flex justify-end gap-2">
                    <button onClick={() => handleView(client)} className="p-2 text-gray-500 hover:text-primary transition-colors" title="Ver Ficha">
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    <button onClick={() => handleEdit(client)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors" title="Editar">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors" title="Eliminar">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center px-4">
        <span className="text-sm text-gray-500">Página {currentPage} de {totalPages}</span>
        <div className="flex gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"><span className="material-symbols-outlined">chevron_left</span></button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
      </div>

      <style>{`
            .input-field {
                width: 100%;
                border-radius: 0.5rem;
                border: 1px solid #e5e7eb;
                padding: 0.625rem 0.875rem;
                font-size: 0.875rem;
                color: #111827;
                background-color: white;
                transition: all 0.2s;
            }
            .dark .input-field {
                background-color: rgba(255, 255, 255, 0.05);
                border-color: #374151;
                color: white;
            }
            .input-field:focus {
                outline: none;
                border-color: #22c55e;
                box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
            }
            .input-field:disabled {
                opacity: 0.7;
                cursor: not-allowed;
            }
        `}</style>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar Perfil de Cliente"
        message={`¿Estás seguro de que deseas eliminar el perfil de ${confirmDelete.clientName}?\n\nEsta acción no se puede deshacer y se perderán todos los datos asociados.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete({ isOpen: false, clientId: null, clientName: '' })}
      />
    </div>
  );
};

export default Clients;