import React, { useState, useMemo } from 'react';
import { CLIENTS, MOCK_ROUTINES, PROFESSIONAL_PROFILE } from '../constants';
import { Client, Routine, RoutineSession, RoutineExercise, ExerciseBlock } from '../types';

type RoutineView = 'list' | 'client_details' | 'editor';

const Routines: React.FC = () => {
  const [view, setView] = useState<RoutineView>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Context
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  
  // Data State (In a real app, this would come from an API)
  const [routines, setRoutines] = useState<Record<string, Routine[]>>(MOCK_ROUTINES);

  // Editor State
  const [editorData, setEditorData] = useState<Routine | null>(null);

  // --- VIEW 1: CLIENT LIST ---
  const filteredClients = useMemo(() => {
    if (!searchTerm) return CLIENTS;
    const lowerTerm = searchTerm.toLowerCase();
    return CLIENTS.filter(c => c.name.toLowerCase().includes(lowerTerm) || c.id.toLowerCase().includes(lowerTerm));
  }, [searchTerm]);

  const handleSelectClient = (client: Client) => {
      setSelectedClient(client);
      setView('client_details');
  };

  const handleBackToList = () => {
      setSelectedClient(null);
      setView('list');
  };

  // --- VIEW 2: CLIENT ROUTINES ---
  const handleCreateRoutine = () => {
      if (!selectedClient) return;
      const newRoutine: Routine = {
          id: `r-${Date.now()}`,
          patientId: selectedClient.id,
          title: '',
          objective: '',
          sport: '',
          level: 'Intermedio',
          frequency: '3 días',
          status: 'draft',
          createdAt: new Date().toISOString().split('T')[0],
          sessions: [
              {
                  id: `s-${Date.now()}-1`,
                  routineId: `r-${Date.now()}`,
                  label: 'Día 1',
                  exercises: []
              }
          ]
      };
      setEditorData(newRoutine);
      setView('editor');
  };

  const handleEditRoutine = (routine: Routine) => {
      setEditorData(JSON.parse(JSON.stringify(routine))); // Deep copy
      setView('editor');
  };

  const handleDuplicateRoutine = (routine: Routine) => {
      const copy: Routine = {
          ...JSON.parse(JSON.stringify(routine)),
          id: `r-${Date.now()}`,
          title: `${routine.title} (Copia)`,
          status: 'draft',
          createdAt: new Date().toISOString().split('T')[0]
      };
      // In a real app, API call here
      if (selectedClient) {
          setRoutines(prev => ({
              ...prev,
              [selectedClient.id]: [...(prev[selectedClient.id] || []), copy]
          }));
      }
  };

  const handleDeleteRoutine = (routineId: string) => {
      if (selectedClient && window.confirm('¿Seguro que deseas eliminar esta rutina?')) {
          setRoutines(prev => ({
              ...prev,
              [selectedClient.id]: prev[selectedClient.id].filter(r => r.id !== routineId)
          }));
      }
  };

  // --- REAL EXPORT LOGIC ---
  
  // Helper: Generate CSV Content
  const generateCSV = (routine: Routine, clientName: string) => {
      let csvContent = `\uFEFFPlan de Entrenamiento,${routine.title}\n`;
      csvContent += `Paciente,${clientName}\n`;
      csvContent += `Profesional,${PROFESSIONAL_PROFILE.display}\n`;
      csvContent += `Objetivo,${routine.objective}\n`;
      csvContent += `Frecuencia,${routine.frequency}\n`;
      csvContent += `Nivel,${routine.level}\n\n`;

      routine.sessions.forEach(session => {
          csvContent += `--- ${session.label} ---\n`;
          csvContent += `Bloque,Ejercicio,Series,Reps,Carga,Descanso,Notas\n`;
          
          session.exercises.forEach(ex => {
              // Handle commas in text fields by wrapping in quotes
              const safeName = `"${ex.name.replace(/"/g, '""')}"`;
              const safeNotes = `"${(ex.notes || '').replace(/"/g, '""')}"`;
              csvContent += `${ex.block.toUpperCase()},${safeName},${ex.sets},${ex.reps},${ex.load},${ex.rest},${safeNotes}\n`;
          });
          csvContent += `\n`;
      });

      return csvContent;
  };

  // Helper: Open Print Window for PDF
  const openPrintWindow = (routine: Routine, clientName: string) => {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (!printWindow) {
          alert("Por favor habilita las ventanas emergentes para generar el PDF.");
          return;
      }

      const htmlContent = `
        <html>
        <head>
            <title>Rutina - ${clientName}</title>
            <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.5; color: #333; padding: 20px; }
                .header { border-bottom: 2px solid #13ec5b; padding-bottom: 20px; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #0d1b12; }
                .header p { margin: 5px 0; color: #666; }
                .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
                .session { margin-bottom: 40px; page-break-inside: avoid; }
                .session-title { background: #0d1b12; color: white; padding: 8px 15px; border-radius: 4px; margin-bottom: 15px; font-size: 18px; font-weight: bold; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th { text-align: left; border-bottom: 2px solid #ddd; padding: 8px; background: #f0f0f0; }
                td { border-bottom: 1px solid #eee; padding: 8px; }
                .block-warmup { color: #d97706; font-weight: bold; }
                .block-main { color: #13ec5b; font-weight: bold; }
                .block-accessory { color: #3b82f6; font-weight: bold; }
                .block-cooldown { color: #6b7280; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${PROFESSIONAL_PROFILE.name}</h1>
                <p>ISAK Nivel ${PROFESSIONAL_PROFILE.isak_level} | Entrenador Personal</p>
            </div>
            
            <div class="meta-grid">
                <div><strong>Paciente:</strong> ${clientName}</div>
                <div><strong>Rutina:</strong> ${routine.title}</div>
                <div><strong>Objetivo:</strong> ${routine.objective}</div>
                <div><strong>Frecuencia:</strong> ${routine.frequency}</div>
                <div><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</div>
                <div><strong>Nivel:</strong> ${routine.level}</div>
            </div>

            ${routine.sessions.map(session => `
                <div class="session">
                    <div class="session-title">${session.label}</div>
                    <table>
                        <thead>
                            <tr>
                                <th width="10%">Bloque</th>
                                <th width="30%">Ejercicio</th>
                                <th width="10%">Series</th>
                                <th width="10%">Reps</th>
                                <th width="15%">Carga</th>
                                <th width="10%">Pausa</th>
                                <th width="15%">Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${session.exercises.map(ex => `
                                <tr>
                                    <td class="block-${ex.block}">${ex.block === 'warmup' ? 'Calent.' : ex.block === 'main' ? 'Principal' : ex.block === 'accessory' ? 'Acc.' : 'Final'}</td>
                                    <td><strong>${ex.name}</strong></td>
                                    <td>${ex.sets}</td>
                                    <td>${ex.reps}</td>
                                    <td>${ex.load}</td>
                                    <td>${ex.rest}</td>
                                    <td>${ex.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}

            <div class="footer">
                Generado por LUCHA-FIT Professional Dashboard
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
  };

  const downloadMockFile = (routine: Routine, type: 'pdf' | 'xlsx') => {
      if (!selectedClient) return;
      
      const fileName = `Rutina_${selectedClient.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      if (type === 'pdf') {
          // Open formatted print window
          openPrintWindow(routine, selectedClient.name);
      } else {
          // Generate Real CSV File
          const csvString = generateCSV(routine, selectedClient.name);
          const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement("a");
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", `${fileName}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }
  };

  // --- VIEW 3: EDITOR LOGIC ---
  const handleSaveRoutine = () => {
      if (selectedClient && editorData) {
          setRoutines(prev => {
              const existing = prev[selectedClient.id] || [];
              const index = existing.findIndex(r => r.id === editorData.id);
              if (index >= 0) {
                  const updated = [...existing];
                  updated[index] = { ...editorData, status: 'active' }; // Auto activate on save for demo
                  return { ...prev, [selectedClient.id]: updated };
              } else {
                  return { ...prev, [selectedClient.id]: [editorData, ...existing] };
              }
          });
          setView('client_details');
      }
  };

  // Editor Actions
  const addSession = () => {
      if (!editorData) return;
      const newSession: RoutineSession = {
          id: `s-${Date.now()}`,
          routineId: editorData.id,
          label: `Día ${editorData.sessions.length + 1}`,
          exercises: []
      };
      setEditorData({ ...editorData, sessions: [...editorData.sessions, newSession] });
  };

  const removeSession = (idx: number) => {
      if (!editorData) return;
      const newSessions = [...editorData.sessions];
      newSessions.splice(idx, 1);
      setEditorData({ ...editorData, sessions: newSessions });
  };

  const addExercise = (sessionIdx: number, block: ExerciseBlock) => {
      if (!editorData) return;
      const newExercise: RoutineExercise = {
          id: `e-${Date.now()}`,
          block,
          name: '',
          sets: 3,
          reps: '10',
          load: '',
          rest: '60s'
      };
      const updatedSessions = [...editorData.sessions];
      updatedSessions[sessionIdx].exercises.push(newExercise);
      setEditorData({ ...editorData, sessions: updatedSessions });
  };

  const updateExercise = (sessionIdx: number, exerciseId: string, field: keyof RoutineExercise, value: any) => {
      if (!editorData) return;
      const updatedSessions = [...editorData.sessions];
      const exIndex = updatedSessions[sessionIdx].exercises.findIndex(e => e.id === exerciseId);
      if (exIndex >= 0) {
          updatedSessions[sessionIdx].exercises[exIndex] = {
              ...updatedSessions[sessionIdx].exercises[exIndex],
              [field]: value
          };
          setEditorData({ ...editorData, sessions: updatedSessions });
      }
  };

  const removeExercise = (sessionIdx: number, exerciseId: string) => {
      if (!editorData) return;
      const updatedSessions = [...editorData.sessions];
      updatedSessions[sessionIdx].exercises = updatedSessions[sessionIdx].exercises.filter(e => e.id !== exerciseId);
      setEditorData({ ...editorData, sessions: updatedSessions });
  };

  const renderBlock = (session: RoutineSession, sessionIdx: number, block: ExerciseBlock, title: string) => {
      const exercises = session.exercises.filter(e => e.block === block);
      
      return (
          <div className="mb-6">
              <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
                  <h5 className="text-sm font-bold uppercase text-primary">{title}</h5>
                  <button onClick={() => addExercise(sessionIdx, block)} className="text-xs flex items-center gap-1 text-primary hover:text-primary-dark">
                      <span className="material-symbols-outlined text-sm">add</span> Agregar
                  </button>
              </div>
              {exercises.length > 0 ? (
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                          <thead>
                              <tr className="text-xs text-text-muted">
                                  <th className="font-medium p-2">Ejercicio</th>
                                  <th className="font-medium p-2 w-16">Series</th>
                                  <th className="font-medium p-2 w-20">Reps</th>
                                  <th className="font-medium p-2 w-24">Carga</th>
                                  <th className="font-medium p-2 w-20">Pausa</th>
                                  <th className="font-medium p-2">Notas</th>
                                  <th className="w-8"></th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {exercises.map((ex) => (
                                  <tr key={ex.id} className="group hover:bg-gray-50 dark:hover:bg-white/5">
                                      <td className="p-1"><input type="text" value={ex.name} onChange={(e) => updateExercise(sessionIdx, ex.id, 'name', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none" placeholder="Nombre..." /></td>
                                      <td className="p-1"><input type="number" value={ex.sets} onChange={(e) => updateExercise(sessionIdx, ex.id, 'sets', parseInt(e.target.value))} className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none text-center" /></td>
                                      <td className="p-1"><input type="text" value={ex.reps} onChange={(e) => updateExercise(sessionIdx, ex.id, 'reps', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none text-center" /></td>
                                      <td className="p-1"><input type="text" value={ex.load} onChange={(e) => updateExercise(sessionIdx, ex.id, 'load', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none text-center" placeholder="-" /></td>
                                      <td className="p-1"><input type="text" value={ex.rest} onChange={(e) => updateExercise(sessionIdx, ex.id, 'rest', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none text-center" /></td>
                                      <td className="p-1"><input type="text" value={ex.notes || ''} onChange={(e) => updateExercise(sessionIdx, ex.id, 'notes', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-primary outline-none text-gray-400" placeholder="..." /></td>
                                      <td className="p-1 text-center">
                                          <button onClick={() => removeExercise(sessionIdx, ex.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <span className="material-symbols-outlined text-sm">close</span>
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              ) : (
                  <div className="p-4 border border-dashed border-gray-200 dark:border-gray-700 rounded text-center text-xs text-gray-400">
                      Sin ejercicios en este bloque
                  </div>
              )}
          </div>
      );
  };

  // --- RENDER ---

  if (view === 'list') {
      return (
          <div className="flex flex-col gap-8 animate-in fade-in duration-300">
              <div className="flex flex-col gap-2">
                  <h1 className="text-3xl font-black text-text-dark dark:text-white tracking-tight">Gestión de Rutinas</h1>
                  <p className="text-text-muted dark:text-gray-400">Selecciona un paciente para ver o crear sus planes de entrenamiento.</p>
              </div>
              <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                  <input type="text" placeholder="Buscar atleta..." className="w-full pl-12 pr-4 h-14 bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl text-text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients.map(client => (
                      <div key={client.id} className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all group flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                              {client.image ? (
                                  <div className="size-14 rounded-full bg-cover bg-center border-2 border-input-border dark:border-gray-600" style={{ backgroundImage: `url('${client.image}')` }}></div>
                              ) : (
                                  <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">{client.name.substring(0, 2).toUpperCase()}</div>
                              )}
                              <div>
                                  <h3 className="font-bold text-lg text-text-dark dark:text-white leading-tight">{client.name}</h3>
                                  <p className="text-xs text-text-muted dark:text-gray-400 font-medium">ID: #{client.id}</p>
                                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{client.goal}</span>
                              </div>
                          </div>
                          <button onClick={() => handleSelectClient(client)} className="mt-auto w-full py-2.5 px-3 rounded-lg bg-text-dark dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                              <span className="material-symbols-outlined text-[18px]">fitness_center</span> Ver Rutinas
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      );
  }

  if (view === 'client_details' && selectedClient) {
      const clientRoutines = routines[selectedClient.id] || [];
      return (
          <div className="flex flex-col gap-6 animate-in slide-in-from-right-5 duration-300">
              {/* Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-input-border dark:border-gray-700 pb-6">
                  <div className="flex items-center gap-4">
                      <button onClick={handleBackToList} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
                      <div>
                          <h1 className="text-2xl font-black text-text-dark dark:text-white">{selectedClient.name}</h1>
                          <p className="text-text-muted dark:text-gray-400 text-sm">Historial de Planes de Entrenamiento</p>
                      </div>
                  </div>
                  <button onClick={handleCreateRoutine} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold px-6 py-3 rounded-lg shadow-lg shadow-primary/20 transition-all">
                      <span className="material-symbols-outlined">add</span> Crear Rutina
                  </button>
              </div>

              {/* List */}
              <div className="grid grid-cols-1 gap-4">
                  {clientRoutines.length > 0 ? (
                      clientRoutines.map(routine => (
                          <div key={routine.id} className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-6 shadow-sm hover:border-primary dark:hover:border-primary transition-colors flex flex-col md:flex-row justify-between gap-6">
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-xl font-bold text-text-dark dark:text-white">{routine.title}</h3>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${routine.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{routine.status === 'active' ? 'Activa' : 'Borrador'}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">flag</span> {routine.objective}</span>
                                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">signal_cellular_alt</span> {routine.level}</span>
                                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">calendar_today</span> {routine.frequency}</span>
                                      <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">update</span> {routine.createdAt}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 self-end md:self-center">
                                  <button onClick={() => downloadMockFile(routine, 'pdf')} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="Descargar PDF (Imprimir)"><span className="material-symbols-outlined">picture_as_pdf</span></button>
                                  <button onClick={() => downloadMockFile(routine, 'xlsx')} className="p-2 text-gray-500 hover:text-green-600 transition-colors" title="Descargar CSV/Excel"><span className="material-symbols-outlined">table_view</span></button>
                                  <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                                  <button onClick={() => handleDuplicateRoutine(routine)} className="p-2 text-gray-500 hover:text-primary transition-colors" title="Duplicar"><span className="material-symbols-outlined">content_copy</span></button>
                                  <button onClick={() => handleEditRoutine(routine)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors" title="Editar"><span className="material-symbols-outlined">edit</span></button>
                                  <button onClick={() => handleDeleteRoutine(routine.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors" title="Archivar"><span className="material-symbols-outlined">archive</span></button>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-20 text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-700">
                          <span className="material-symbols-outlined text-4xl mb-2">fitness_center</span>
                          <p>No hay rutinas creadas para este paciente.</p>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  if (view === 'editor' && editorData && selectedClient) {
      return (
          <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-5 duration-300 pb-20">
              {/* Editor Header */}
              <div className="flex items-center justify-between border-b border-input-border dark:border-gray-700 pb-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 pt-2">
                  <div className="flex items-center gap-4">
                      <button onClick={() => setView('client_details')} className="text-gray-500 hover:text-text-dark dark:hover:text-white"><span className="material-symbols-outlined">close</span></button>
                      <h2 className="text-xl font-bold text-text-dark dark:text-white">Editor de Rutina</h2>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setView('client_details')} className="px-4 py-2 border border-input-border dark:border-gray-600 rounded-lg font-bold text-sm">Cancelar</button>
                      <button onClick={handleSaveRoutine} className="px-6 py-2 bg-primary text-black rounded-lg font-bold text-sm hover:brightness-105 shadow-md">Guardar Rutina</button>
                  </div>
              </div>

              {/* Metadata Form */}
              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-input-border dark:border-gray-700 shadow-sm">
                  <h3 className="text-sm font-bold uppercase text-text-muted mb-4">Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="col-span-1 md:col-span-2">
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Título de la Rutina</label>
                          <input type="text" value={editorData.title} onChange={(e) => setEditorData({ ...editorData, title: e.target.value })} className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent" placeholder="Ej. Hipertrofia Fase 1" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Objetivo</label>
                          <input type="text" value={editorData.objective} onChange={(e) => setEditorData({ ...editorData, objective: e.target.value })} className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent" placeholder="Ej. Ganancia muscular" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Deporte</label>
                          <input type="text" value={editorData.sport} onChange={(e) => setEditorData({ ...editorData, sport: e.target.value })} className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent" placeholder="Ej. Musculación" />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Nivel</label>
                          <select value={editorData.level} onChange={(e) => setEditorData({ ...editorData, level: e.target.value })} className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent">
                              <option>Principiante</option>
                              <option>Intermedio</option>
                              <option>Avanzado</option>
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-gray-500 mb-1 block">Frecuencia Semanal</label>
                          <input type="text" value={editorData.frequency} onChange={(e) => setEditorData({ ...editorData, frequency: e.target.value })} className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent" placeholder="Ej. 3 días" />
                      </div>
                  </div>
              </div>

              {/* Sessions Editor */}
              <div className="flex flex-col gap-6">
                  {editorData.sessions.map((session, sIdx) => (
                      <div key={session.id} className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-gray-700 shadow-sm overflow-hidden">
                          <div className="bg-gray-50 dark:bg-white/5 p-4 border-b border-input-border dark:border-gray-700 flex justify-between items-center">
                              <input 
                                  type="text" 
                                  value={session.label} 
                                  onChange={(e) => {
                                      const newSessions = [...editorData.sessions];
                                      newSessions[sIdx].label = e.target.value;
                                      setEditorData({ ...editorData, sessions: newSessions });
                                  }}
                                  className="font-bold text-lg bg-transparent border-b border-transparent focus:border-primary outline-none text-text-dark dark:text-white"
                              />
                              <button onClick={() => removeSession(sIdx)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded transition-colors" title="Eliminar Día"><span className="material-symbols-outlined">delete</span></button>
                          </div>
                          <div className="p-6">
                              {renderBlock(session, sIdx, 'warmup', 'Calentamiento')}
                              {renderBlock(session, sIdx, 'main', 'Parte Principal')}
                              {renderBlock(session, sIdx, 'accessory', 'Accesorios')}
                              {renderBlock(session, sIdx, 'cooldown', 'Vuelta a la Calma')}
                          </div>
                      </div>
                  ))}
                  
                  <button onClick={addSession} className="py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-bold">
                      <span className="material-symbols-outlined">add_circle</span> Agregar Día / Sesión
                  </button>
              </div>
          </div>
      );
  }

  return null;
};

export default Routines;