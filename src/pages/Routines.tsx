import React, { useState, useMemo, useEffect } from 'react';
import { CLIENTS, MOCK_ROUTINES, PROFESSIONAL_PROFILE } from '../constants';
import { Client, Routine, RoutineSession, RoutineExercise, ExerciseBlock } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { useClients } from '../hooks/useClients';
import { routinesApi } from '../services/api';

const ROUTINE_OPTIONS = {
    titles: [
        "Hipertrofia", "Fuerza", "Resistencia", "Pérdida de Peso",
        "Mantenimiento", "Adaptación", "Tonificación", "Rehabilitación"
    ],
    objectives: [
        "Aumento de Masa Muscular", "Definición", "Mejora de Rendimiento",
        "Salud General", "Rehabilitación", "Pérdida de Grasa"
    ],
    sports: [
        "Musculación", "Crossfit", "Running", "Ciclismo",
        "Natación", "Fútbol", "Tenis", "Artes Marciales", "Otro"
    ],
    levels: ["Principiante", "Intermedio", "Avanzado"],
    frequencies: ["1 día/semana", "2 días/semana", "3 días/semana", "4 días/semana", "5 días/semana", "6 días/semana"]
};

type RoutineView = 'list' | 'client_details' | 'editor';

const Routines: React.FC = () => {
    // Backend integration
    const { clients: clientsList } = useClients();

    const [view, setView] = useState<RoutineView>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; routineId: string | null; routineTitle: string }>({
        isOpen: false,
        routineId: null,
        routineTitle: ''
    });

    // Selected Context
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    // Data State
    const [routines, setRoutines] = useState<Record<string, Routine[]>>({});
    const [loading, setLoading] = useState(false);

    // Load routines when client is selected
    useEffect(() => {
        if (selectedClient) {
            loadClientRoutines(selectedClient.id);
        }
    }, [selectedClient]);

    const loadClientRoutines = async (clientId: string) => {
        setLoading(true);
        try {
            const response = await routinesApi.getByPatientId(clientId);
            if (response.success) {
                // Transform backend data to frontend format if needed
                // The API returns data that matches our Routine type mostly, 
                // but let's ensure dates are handled or kept as strings
                const loadedRoutines = response.data || [];
                setRoutines(prev => ({
                    ...prev,
                    [clientId]: loadedRoutines
                }));
            } else {
                console.error("Error loading routines:", response.message);
                setRoutines(prev => ({ ...prev, [clientId]: [] }));
            }
        } catch (error) {
            console.error("Error fetching routines:", error);
        } finally {
            setLoading(false);
        }
    };

    // Editor State
    const [editorData, setEditorData] = useState<Routine | null>(null);

    // --- VIEW 1: CLIENT LIST ---
    const filteredClients = useMemo(() => {
        // Usar clientes del backend
        const sourceData = clientsList;

        if (!searchTerm) return sourceData;
        const lowerTerm = searchTerm.toLowerCase();
        return sourceData.filter((c: Client) => c.name.toLowerCase().includes(lowerTerm) || c.id.toLowerCase().includes(lowerTerm));
    }, [searchTerm, clientsList]);

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
            title: ROUTINE_OPTIONS.titles[0],
            objective: ROUTINE_OPTIONS.objectives[0],
            sport: ROUTINE_OPTIONS.sports[0],
            level: 'Intermedio',
            frequency: '3 días/semana',
            status: 'draft',
            createdAt: new Date().toISOString().split('T')[0], // YYYY-MM-DD for consistency
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

        if (selectedClient) {
            setRoutines(prev => ({
                ...prev,
                [selectedClient.id]: [copy, ...(prev[selectedClient.id] || [])]
            }));
        }
    };

    const handleDeleteRoutine = (routineId: string) => {
        if (selectedClient) {
            const routine = routines[selectedClient.id]?.find(r => r.id === routineId);
            setConfirmDelete({
                isOpen: true,
                routineId: routineId,
                routineTitle: routine?.title || 'esta rutina'
            });
        }
    };

    const confirmDeleteAction = async () => {
        if (selectedClient && confirmDelete.routineId) {
            try {
                const response = await routinesApi.delete(confirmDelete.routineId);
                if (response.success) {
                    // Update local state
                    setRoutines(prev => ({
                        ...prev,
                        [selectedClient.id]: prev[selectedClient.id].filter(r => r.id !== confirmDelete.routineId)
                    }));
                } else {
                    alert("Error al eliminar la rutina: " + response.message);
                }
            } catch (error) {
                console.error("Error deleting routine:", error);
                alert("Ocurrió un error al eliminar la rutina.");
            }
        }
        setConfirmDelete({ isOpen: false, routineId: null, routineTitle: '' });
    };

    // --- EXPORT LOGIC (EXCEL FORMATTED & PDF) ---

    const generateXLSContent = (routine: Routine, clientName: string) => {
        return `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
            <style>
                body { font-family: Arial, sans-serif; }
                table { border-collapse: collapse; width: 100%; }
                td, th { border: 1px solid #000000; padding: 5px; vertical-align: top; }
                .header-label { background-color: #E7F3EB; font-weight: bold; width: 150px; }
                .header-value { font-weight: bold; }
                .session-header { background-color: #0D1B12; color: #FFFFFF; font-weight: bold; font-size: 14px; text-align: left; }
                .col-header { background-color: #13EC5B; color: #000000; font-weight: bold; text-align: center; }
                .block-warmup { color: #D97706; font-weight: bold; }
                .block-main { color: #13EC5B; font-weight: bold; }
                .block-accessory { color: #3B82F6; font-weight: bold; }
                .center { text-align: center; }
            </style>
        </head>
        <body>
            <table>
                <tr><td colspan="2" style="font-size: 16px; font-weight: bold; background-color: #13EC5B;">LUCHA-FIT | Plan de Entrenamiento</td></tr>
                <tr><td class="header-label">Paciente</td><td class="header-value">${clientName}</td></tr>
                <tr><td class="header-label">Profesional</td><td class="header-value">${PROFESSIONAL_PROFILE.display}</td></tr>
                <tr><td class="header-label">Rutina</td><td class="header-value">${routine.title}</td></tr>
                <tr><td class="header-label">Objetivo</td><td class="header-value">${routine.objective}</td></tr>
                <tr><td class="header-label">Frecuencia</td><td class="header-value">${routine.frequency}</td></tr>
                <tr><td class="header-label">Nivel</td><td class="header-value">${routine.level}</td></tr>
                <tr><td class="header-label">Fecha Creación</td><td class="header-value">${routine.createdAt}</td></tr>
            </table>
            <br/>
            ${routine.sessions.map(session => `
                <table>
                    <tr><td colspan="7" class="session-header">--- ${session.label} ---</td></tr>
                    <tr>
                        <th class="col-header">Bloque</th>
                        <th class="col-header">Ejercicio</th>
                        <th class="col-header">Series</th>
                        <th class="col-header">Reps</th>
                        <th class="col-header">Carga</th>
                        <th class="col-header">Descanso</th>
                        <th class="col-header">Notas</th>
                    </tr>
                    ${session.exercises.map(ex => `
                        <tr>
                            <td class="${ex.block === 'warmup' ? 'block-warmup' : ex.block === 'main' ? 'block-main' : 'block-accessory'}">${ex.block.toUpperCase()}</td>
                            <td>${ex.name}</td>
                            <td class="center">${ex.sets}</td>
                            <td class="center">${ex.reps}</td>
                            <td class="center">${ex.load}</td>
                            <td class="center">${ex.rest}</td>
                            <td>${ex.notes || ''}</td>
                        </tr>
                    `).join('')}
                </table>
                <br/>
            `).join('')}
        </body>
        </html>
      `;
    };

    const openPrintWindow = (routine: Routine, clientName: string) => {
        const printWindow = window.open('', '_blank', 'width=900,height=800');
        if (!printWindow) {
            alert("Por favor habilita las ventanas emergentes para generar el PDF.");
            return;
        }

        const htmlContent = `
        <html>
        <head>
            <title>Rutina - ${clientName}</title>
            <style>
                body { font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; padding: 30px; }
                .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; border-bottom: 3px solid #13ec5b; padding-bottom: 15px; }
                .logo { background-color: #13ec5b; color: black; font-weight: bold; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
                .meta-container { background-color: #f5f5f5; border-radius: 8px; padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; font-size: 14px; }
                .meta-item strong { display: block; color: #555; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
                .session { margin-bottom: 30px; page-break-inside: avoid; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
                .session-header { background-color: #0d1b12; color: white; padding: 10px 15px; font-weight: bold; font-size: 16px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th { text-align: left; padding: 10px; background-color: #e7f3eb; color: #0d1b12; font-weight: bold; border-bottom: 2px solid #ddd; }
                td { padding: 10px; border-bottom: 1px solid #eee; }
                tr:last-child td { border-bottom: none; }
                .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                .badge-warmup { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
                .badge-main { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
                .badge-accessory { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
                .badge-cooldown { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
                @media print {
                    body { -webkit-print-color-adjust: exact; }
                    .session { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="brand">
                <div class="logo">LF</div>
                <div>
                    <h1 style="margin:0; font-size: 24px;">${PROFESSIONAL_PROFILE.name}</h1>
                    <p style="margin:0; font-size: 12px; color: #666;">ISAK Nivel ${PROFESSIONAL_PROFILE.isak_level} | Entrenador Personal</p>
                </div>
            </div>
            
            <div class="meta-container">
                <div class="meta-item"><strong>Paciente</strong>${clientName}</div>
                <div class="meta-item"><strong>Plan de Entrenamiento</strong>${routine.title}</div>
                <div class="meta-item"><strong>Objetivo</strong>${routine.objective}</div>
                <div class="meta-item"><strong>Frecuencia</strong>${routine.frequency}</div>
                <div class="meta-item"><strong>Nivel</strong>${routine.level}</div>
                <div class="meta-item"><strong>Fecha Emisión</strong>${routine.createdAt}</div>
            </div>

            ${routine.sessions.map(session => `
                <div class="session">
                    <div class="session-header">${session.label}</div>
                    <table>
                        <thead>
                            <tr>
                                <th width="10%">Tipo</th>
                                <th width="25%">Ejercicio</th>
                                <th width="8%">Series</th>
                                <th width="12%">Reps</th>
                                <th width="15%">Carga</th>
                                <th width="10%">Pausa</th>
                                <th width="20%">Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${session.exercises.map(ex => `
                                <tr>
                                    <td><span class="badge badge-${ex.block}">${ex.block === 'warmup' ? 'Calent.' : ex.block === 'main' ? 'Principal' : ex.block === 'accessory' ? 'Acc.' : 'Final'}</span></td>
                                    <td><strong>${ex.name}</strong></td>
                                    <td>${ex.sets}</td>
                                    <td>${ex.reps}</td>
                                    <td>${ex.load}</td>
                                    <td>${ex.rest}</td>
                                    <td style="color:#666;">${ex.notes || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `).join('')}

            <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #999;">
                Documento generado automáticamente por la plataforma LUCHA-FIT
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

    const downloadFile = async (routine: Routine, type: 'pdf' | 'xls') => {
        if (!selectedClient) return;

        const fileName = `Rutina_${selectedClient.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}`;

        if (type === 'pdf') {
            openPrintWindow(routine, selectedClient.name);
        } else {
            const xlsContent = generateXLSContent(routine, selectedClient.name);
            const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel' });
            const fileName = `Rutina_${selectedClient.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xls`;
            const file = new File([blob], fileName, { type: 'application/vnd.ms-excel' });

            // 📱 MOBILE SHARE SUPPORT
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: `Rutina: ${selectedClient.name}`,
                        text: 'Adjunto archivo de rutina.'
                    });
                    return;
                } catch (e) {
                    // Fallback to download
                }
            }

            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", fileName);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // --- VIEW 3: EDITOR LOGIC ---
    const handleSaveRoutine = async () => {
        if (selectedClient && editorData) {
            try {
                let response;
                // Check if it's a new routine (we use a temporary ID starting with 'r-' and Date.now for new ones in frontend init, 
                // but backend expects valid IDs or creates them. 
                // However, in handleCreateRoutine we set 'r-...' 
                // Let's assume if it starts with 'r-' and contains Date.now() it is NEW, 
                // OR checking if it exists in the backend list. 
                // Better approach: The backend creates the ID. 
                // If we are editing, we should have a real ID from the DB (e.g. RTN-...).
                // If it is 'r-...' it is likely new.

                const isNew = editorData.id.startsWith('r-');

                const payload = {
                    ...editorData,
                    patient_id: selectedClient.id // Ensure snake_case for backend if needed? 
                    // Actually api.ts usually expects camelCase and client might handle it, 
                    // BUT checking api.ts logic: it sends JSON.stringify(routineData).
                    // The backend expects snake_case keys mostly (patient_id, start_date). 
                    // Let's map it.
                };

                // Mapping for backend
                const backendPayload = {
                    ...payload,
                    patient_id: selectedClient.id,
                    start_date: payload.createdAt, // mapping createdAt to start_date for now
                };

                if (isNew) {
                    // Remove the temp ID so backend generates one, or leave it if backend ignores it.
                    // Backend: $routineId = 'RTN-' . uniqid(); -> It ignores sent ID for creation.
                    response = await routinesApi.create(backendPayload);
                } else {
                    response = await routinesApi.update(editorData.id, backendPayload);
                }

                if (response.success) {
                    // Reload routines to get the real ID and fresh data
                    await loadClientRoutines(selectedClient.id);
                    setView('client_details');
                } else {
                    alert("Error al guardar: " + response.message);
                }
            } catch (error) {
                console.error("Error saving routine:", error);
                alert("Error de conexión al guardar la rutina.");
            }
        }
    };

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

    let content = null;

    if (view === 'list') {
        content = (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-text-dark dark:text-white tracking-tight">Gestión de Rutinas</h1>
                    <p className="text-text-muted dark:text-gray-400">Selecciona un paciente para ver o crear sus planes de entrenamiento.</p>
                </div>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                    <input type="text" placeholder="Buscar paciente..." className="w-full pl-12 pr-4 h-14 bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl text-text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
        content = (
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
                    <button onClick={handleCreateRoutine} className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-black font-bold px-6 py-3 rounded-lg shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5">
                        <span className="material-symbols-outlined">add</span> Nueva Rutina
                    </button>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-center py-10">
                            <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                            <p className="text-text-muted mt-2">Cargando rutinas...</p>
                        </div>
                    ) : clientRoutines.length > 0 ? (
                        clientRoutines.map(routine => (
                            <div key={routine.id} className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-6 shadow-sm hover:border-primary dark:hover:border-primary transition-colors flex flex-col md:flex-row justify-between gap-6 relative group">
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
                                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                                    <button onClick={() => downloadFile(routine, 'pdf')} className="flex items-center gap-1 px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-bold text-gray-600 dark:text-gray-300 transition-colors" title="Ver/Imprimir PDF">
                                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> PDF
                                    </button>
                                    <button onClick={() => downloadFile(routine, 'xls')} className="flex items-center gap-1 px-3 py-1.5 rounded bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-xs font-bold text-green-700 dark:text-green-400 transition-colors" title="Descargar Excel con formato">
                                        <span className="material-symbols-outlined text-[16px]">table_view</span> Excel
                                    </button>
                                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                    <button onClick={() => handleDuplicateRoutine(routine)} className="p-2 text-gray-500 hover:text-primary transition-colors" title="Duplicar Rutina"><span className="material-symbols-outlined">content_copy</span></button>
                                    <button onClick={() => handleEditRoutine(routine)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors" title="Editar Rutina"><span className="material-symbols-outlined">edit</span></button>
                                    <button onClick={() => handleDeleteRoutine(routine.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors" title="Eliminar Rutina">
                                        <span className="material-symbols-outlined filled-icon">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20 text-gray-400 bg-gray-50 dark:bg-white/5 rounded-xl border-dashed border-2 border-gray-200 dark:border-gray-700 flex flex-col items-center">
                            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">fitness_center</span>
                            <p className="text-lg font-medium mb-2">No hay rutinas creadas para este paciente.</p>
                            <p className="text-sm text-gray-500 mb-6">Comienza creando un nuevo plan de entrenamiento personalizado.</p>
                            <button onClick={handleCreateRoutine} className="bg-primary text-black font-bold px-6 py-3 rounded-lg shadow-lg hover:brightness-105 transition-all">
                                Crear Primera Rutina
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'editor' && editorData && selectedClient) {
        content = (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-5 duration-300 pb-20">
                {/* Editor Header */}
                <div className="flex items-center justify-between border-b border-input-border dark:border-gray-700 pb-4 sticky top-0 bg-background-light dark:bg-background-dark z-20 pt-2">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setView('client_details')} className="text-gray-500 hover:text-text-dark dark:hover:text-white"><span className="material-symbols-outlined">close</span></button>
                        <h2 className="text-xl font-bold text-text-dark dark:text-white">Editor de Rutina</h2>
                    </div>
                    <div className="flex gap-3">
                        {/* Delete button inside editor */}
                        <button
                            onClick={() => {
                                if (editorData.id.startsWith('r-') && !editorData.id.includes('Date')) {
                                    handleDeleteRoutine(editorData.id);
                                    setView('client_details');
                                } else {
                                    setView('client_details'); // Just cancel if it's new
                                }
                            }}
                            className="px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-bold text-sm transition-colors"
                        >
                            Eliminar
                        </button>
                        <button onClick={handleSaveRoutine} className="px-6 py-2 bg-primary text-black rounded-lg font-bold text-sm hover:brightness-105 shadow-md flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">save</span> Guardar
                        </button>
                    </div>
                </div>

                {/* Metadata Form */}
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-input-border dark:border-gray-700 shadow-sm">
                    <h3 className="text-sm font-bold uppercase text-text-muted mb-4">Información General</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Título de la Rutina</label>
                            <div className="relative">
                                <select
                                    value={editorData.title}
                                    onChange={(e) => setEditorData({ ...editorData, title: e.target.value })}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent appearance-none"
                                >
                                    {ROUTINE_OPTIONS.titles.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">expand_more</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Objetivo</label>
                            <div className="relative">
                                <select
                                    value={editorData.objective}
                                    onChange={(e) => setEditorData({ ...editorData, objective: e.target.value })}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent appearance-none"
                                >
                                    {ROUTINE_OPTIONS.objectives.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">expand_more</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Deporte</label>
                            <div className="relative">
                                <select
                                    value={editorData.sport}
                                    onChange={(e) => setEditorData({ ...editorData, sport: e.target.value })}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent appearance-none"
                                >
                                    {ROUTINE_OPTIONS.sports.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">expand_more</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Nivel</label>
                            <div className="relative">
                                <select value={editorData.level} onChange={(e) => setEditorData({ ...editorData, level: e.target.value })} className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent appearance-none">
                                    {ROUTINE_OPTIONS.levels.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">expand_more</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Frecuencia Semanal</label>
                            <div className="relative">
                                <select value={editorData.frequency} onChange={(e) => setEditorData({ ...editorData, frequency: e.target.value })} className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-transparent appearance-none">
                                    {ROUTINE_OPTIONS.frequencies.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-sm">expand_more</span>
                            </div>
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

    return (
        <>
            {content}

            {/* Modal de Confirmación para Eliminar - Global */}
            <ConfirmModal
                isOpen={confirmDelete.isOpen}
                title="Eliminar Rutina"
                message={`¿Estás seguro de que deseas ELIMINAR permanentemente la rutina "${confirmDelete.routineTitle}"?\n\nEsta acción no se puede deshacer y se perderán todos los ejercicios y configuraciones.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
                onConfirm={confirmDeleteAction}
                onCancel={() => setConfirmDelete({ isOpen: false, routineId: null, routineTitle: '' })}
            />
        </>
    );
};

export default Routines;