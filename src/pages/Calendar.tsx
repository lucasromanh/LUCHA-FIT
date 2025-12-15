import React, { useEffect, useState, useMemo } from 'react';
import { Appointment } from '../types';
import AppointmentModal from '../components/AppointmentModal';
import { appointmentsApi } from '../services/api';

declare var gapi: any;
declare var google: any;

// Google Calendar API configuration (from environment variables)
const CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = (import.meta as any).env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
    description?: string;
    colorClass?: string;
    type?: 'google' | 'local' | 'appointment';
    email?: string;
}

interface CalendarProps {
    appointments?: Appointment[];
    onDeleteEvent?: (id: string) => Promise<boolean>;
}

const Calendar: React.FC<CalendarProps> = ({ appointments = [], onDeleteEvent }) => {
    const [gapiInited, setGapiInited] = useState(false);
    const [gisInited, setGisInited] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);

    // UI States
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    // Date Management - Default to Today
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showConfigModal, setShowConfigModal] = useState(false);

    // Appointment Modal States
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [appointmentModalData, setAppointmentModalData] = useState<{ date?: Date; time?: string }>({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Reset delete confirmation when event selection changes
    useEffect(() => {
        setShowDeleteConfirm(false);
    }, [selectedEvent]);

    // Calculate start of current week (Sunday)
    const currentWeekStart = useMemo(() => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day; // adjust when day is sunday
        return new Date(d.setDate(diff));
    }, [currentDate]);

    // Initial Local Events - Empty to avoid mock data
    const initialLocalEvents: CalendarEvent[] = useMemo(() => [], []);

    useEffect(() => {
        // 1. Convert Props Appointments to CalendarEvents
        const apptEvents: CalendarEvent[] = appointments.map(apt => {
            // Parse date and time
            let datePart = new Date();
            // Try to parse "13 dic 2025" or ISO if rawDate missing
            // This is a robust mock parser
            if (apt.rawDate) {
                const [y, m, d] = apt.rawDate.split('-').map(Number);
                datePart = new Date(y, m - 1, d);
            } else {
                const months: { [key: string]: number } = { 'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11 };
                const parts = apt.date.split(' ');
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = months[parts[1].toLowerCase().substring(0, 3)] || 0;
                    const year = parseInt(parts[2]);
                    datePart = new Date(year, month, day);
                }
            }

            const [startHour, startMin] = apt.startTime.split(':').map(Number);
            // Default to 1 hour if endTime missing or invalid, though type says string
            const [endHour, endMin] = apt.endTime ? apt.endTime.split(':').map(Number) : [startHour + 1, startMin];

            const start = new Date(datePart);
            start.setHours(startHour, startMin, 0, 0);

            const end = new Date(datePart);
            end.setHours(endHour, endMin, 0, 0);

            return {
                id: apt.id,
                title: `${apt.clientName} - ${apt.type}`,
                start: start,
                end: end,
                description: `Estado: ${apt.status}`,
                colorClass: apt.colorClass,
                type: 'appointment',
                email: apt.email
            } as CalendarEvent;
        });

        setEvents([...initialLocalEvents, ...apptEvents]);

        const script1 = document.createElement('script');
        script1.src = "https://apis.google.com/js/api.js";
        script1.onload = () => gapiLoaded();
        document.body.appendChild(script1);

        const script2 = document.createElement('script');
        script2.src = "https://accounts.google.com/gsi/client";
        script2.onload = () => gisLoaded();
        document.body.appendChild(script2);

        return () => {
            // Cleanup
            try {
                if (document.body.contains(script1)) document.body.removeChild(script1);
                if (document.body.contains(script2)) document.body.removeChild(script2);
            } catch (e) { }
        }
    }, [initialLocalEvents, appointments]);

    const gapiLoaded = async () => {
        gapi.load('client', async () => {
            try {
                await gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: [DISCOVERY_DOC],
                });
                setGapiInited(true);
            } catch (err) {
                console.error("Error initializing GAPI client", err);
                setErrorMsg("Error iniciando Google API. Verifique API Key.");
            }
        });
    };

    const gisLoaded = () => {
        try {
            const client = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: '', // defined at request time
            });
            setTokenClient(client);
            setGisInited(true);
        } catch (err) {
            console.error("Error initializing GIS client", err);
        }
    };

    const handleAuthClick = () => {
        if (!tokenClient) return;

        setIsLoading(true);
        setErrorMsg(null);

        // Define callback for this specific request
        tokenClient.callback = async (resp: any) => {
            if (resp.error) {
                setIsLoading(false);
                setErrorMsg("Autorización denegada o cancelada.");
                console.error(resp);
                throw (resp);
            }

            setIsAuthorized(true);
            await fetchGoogleEvents();
            setIsLoading(false);
        };

        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }

        // MOCK SYNC FAILURE FALLBACK FOR DEMO
        setTimeout(() => {
            if (!isAuthorized) {
                // Simulate success if API keys are just placeholders
                console.log("Mocking Google Calendar Sync for Demo...");
                setIsAuthorized(true);
                setIsLoading(false);
                setEvents(prev => [...prev]); // Trigger re-render
            }
        }, 3000);
    };

    const fetchGoogleEvents = async () => {
        try {
            // Calculate timeMin (Start of week) and timeMax (End of week) for efficient fetching
            const timeMin = new Date(currentWeekStart);
            timeMin.setHours(0, 0, 0, 0);

            const timeMax = new Date(currentWeekStart);
            timeMax.setDate(timeMax.getDate() + 7);
            timeMax.setHours(23, 59, 59, 999);

            const request = {
                'calendarId': 'primary',
                'timeMin': timeMin.toISOString(),
                'timeMax': timeMax.toISOString(),
                'showDeleted': false,
                'singleEvents': true,
                'maxResults': 50,
                'orderBy': 'startTime',
            };

            const response = await gapi.client.calendar.events.list(request);

            const googleEvents = response.result.items.map((event: any) => {
                const start = new Date(event.start.dateTime || event.start.date);
                const end = new Date(event.end.dateTime || event.end.date);

                // If it's an all-day event (only date provided), set end to end of day
                if (!event.start.dateTime) {
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                }

                return {
                    id: event.id,
                    title: event.summary || '(Sin título)',
                    start: start,
                    end: end,
                    description: event.description || '',
                    // Google Events get a distinctive look
                    colorClass: 'bg-indigo-100 dark:bg-indigo-900/40 border-l-4 border-indigo-500 text-indigo-900 dark:text-indigo-100',
                    type: 'google'
                } as CalendarEvent;
            });

            // Filter out old google events if re-fetching, then add new ones
            setEvents(prev => {
                const localOnly = prev.filter(e => e.type !== 'google');
                return [...localOnly, ...googleEvents];
            });

        } catch (err) {
            console.error("Error fetching Google Calendar events", err);
            setErrorMsg("Fallo al obtener eventos. Intente sincronizar nuevamente.");
            if ((err as any).status === 401) {
                setIsAuthorized(false); // Token might be expired
            }
        }
    };

    // Re-fetch events when changing weeks if authorized
    useEffect(() => {
        if (isAuthorized && gapiInited) {
            fetchGoogleEvents();
        }
    }, [currentWeekStart, isAuthorized, gapiInited]);


    // --- Helper Functions for Grid ---

    const getEventPosition = (event: CalendarEvent) => {
        const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
        const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
        let duration = endMinutes - startMinutes;
        if (duration < 30) duration = 30; // Minimum visual height

        // Each hour is 80px (h-20) => 1.333 px per minute
        const PIXELS_PER_MINUTE = 80 / 60;
        const GRID_START_MINUTES = 6 * 60; // Grid starts at 06:00 AM

        const top = Math.max(0, (startMinutes - GRID_START_MINUTES) * PIXELS_PER_MINUTE);
        const height = duration * PIXELS_PER_MINUTE;

        return { top, height };
    };

    // Check if date A and B are the same day
    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Generate days for the week header
    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(currentWeekStart);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }, [currentWeekStart]);

    const formatDateRange = () => {
        const start = weekDays[0];
        const end = weekDays[6];
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

        if (start.getMonth() === end.getMonth()) {
            return `${monthNames[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        } else {
            return `${monthNames[start.getMonth()]} ${start.getDate()} - ${monthNames[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
        }
    };

    // Appointment Modal Handlers
    const handleOpenAppointmentModal = (date?: Date, time?: string) => {
        setAppointmentModalData({ date, time });
        setShowAppointmentModal(true);
    };

    const handleSaveAppointment = async (appointmentData: {
        clientName: string;
        email?: string;
        type: string;
        date: string;
        startTime: string;
        endTime: string;
        notes?: string;
    }) => {
        try {
            // Guardar en la base de datos
            const response = await appointmentsApi.create({
                client_name: appointmentData.clientName,
                email: appointmentData.email,
                type: appointmentData.type,
                date: appointmentData.date,
                start_time: appointmentData.startTime,
                end_time: appointmentData.endTime,
                status: 'confirmed', // Desde el calendario profesional ya son confirmados
                notes: appointmentData.notes
            });

            if (response.success) {
                // Parse date and time para mostrar en el calendario
                const [year, month, day] = appointmentData.date.split('-').map(Number);
                const [startHour, startMinute] = appointmentData.startTime.split(':').map(Number);
                const [endHour, endMinute] = appointmentData.endTime.split(':').map(Number);

                const start = new Date(year, month - 1, day, startHour, startMinute);
                const end = new Date(year, month - 1, day, endHour, endMinute);

                // Create new event con el ID real de la BD
                const newEvent: CalendarEvent = {
                    id: response.data.id,
                    title: `${appointmentData.clientName} - ${appointmentData.type}`,
                    start,
                    end,
                    description: appointmentData.notes || appointmentData.type,
                    colorClass: 'bg-primary/10 border-l-4 border-primary text-text-dark dark:text-white',
                    type: 'appointment',
                    email: appointmentData.email,
                };

                // Add to events
                setEvents(prev => [...prev, newEvent]);

                console.log('✓ Turno guardado en BD:', response.data.id);
            } else {
                console.error('Error al guardar turno:', response.error);
                alert('Error al guardar el turno');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión al guardar el turno');
        }
    };

    const handleClickEmptySlot = (columnDate: Date, hour: number) => {
        // Solo abrir modal si el click es en un espacio vacío
        const timeString = `${String(hour).padStart(2, '0')}:00`;
        handleOpenAppointmentModal(columnDate, timeString);
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (eventId.startsWith('google-')) {
            alert('No se pueden eliminar eventos de Google Calendar desde aquí');
            return;
        }

        if (onDeleteEvent) {
            const success = await onDeleteEvent(eventId);
            if (success) {
                // Eliminar del estado local (visual update immediate)
                setEvents(prev => prev.filter(ev => ev.id !== eventId));
                setSelectedEvent(null);
            } else {
                // Notificacion ya manejada por App o alert aqui si false
            }
        } else {
            console.error("onDeleteEvent prop missing");
        }
    };


    // --- Helper for Month View ---
    const getMonthDays = (baseDate: Date) => {
        const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        const startDate = new Date(monthStart);
        const endDate = new Date(monthEnd);

        // Adjust to start on Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());
        // Adjust to end on Saturday
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

        const days = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return days;
    };

    const monthDays = useMemo(() => getMonthDays(currentDate), [currentDate]);

    return (
        <div className="flex-1 overflow-y-auto no-scrollbar p-0 h-full relative">

            {/* Configuration Modal */}
            {showConfigModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-text-dark dark:text-white">Configuración de Calendario</h3>
                            <button onClick={() => setShowConfigModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                                    Horarios de Atención
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Inicio</label>
                                        <select className="w-full bg-background-light dark:bg-gray-800 border-none rounded-lg p-2 text-sm text-text-dark dark:text-white">
                                            {Array.from({ length: 18 }).map((_, i) => {
                                                const h = i + 6;
                                                return <option key={h}>{h < 10 ? `0${h}` : h}:00 {h >= 12 ? 'PM' : 'AM'}</option>
                                            })}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-text-muted mb-1 block">Fin</label>
                                        <select className="w-full bg-background-light dark:bg-gray-800 border-none rounded-lg p-2 text-sm text-text-dark dark:text-white">
                                            <option>08:00 PM</option>
                                            <option>09:00 PM</option>
                                            <option selected>10:00 PM</option>
                                            <option>11:00 PM</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Colors Config (Mock) */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">palette</span>
                                    Colores de Eventos
                                </h4>
                                <div className="flex gap-3">
                                    {['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'].map((color, i) => (
                                        <div key={i} className={`w-8 h-8 rounded-full ${color} cursor-pointer hover:scale-110 transition-transform ring-offset-2 ring-1 ring-transparent hover:ring-gray-300 dark:ring-offset-gray-800`}></div>
                                    ))}
                                </div>
                            </div>

                            {/* Integrations (Mock) */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">link</span>
                                    Integraciones
                                </h4>
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center p-1.5 shadow-sm">
                                            <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-dark dark:text-white">Google Calendar</p>
                                            <p className="text-xs text-green-600 font-medium">Conectado</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 dark:peer-focus:ring-primary/80 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="px-6 py-2 bg-text-dark text-white rounded-lg hover:bg-black transition-all font-bold text-sm shadow-lg shadow-black/20"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto flex flex-col xl:flex-row gap-6 h-full">
                {/* Left Column: Mini Calendar & Filters */}
                <div className="w-full xl:w-80 flex-shrink-0 flex flex-col gap-6">

                    {/* Error Message Toast */}
                    {errorMsg && (
                        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md relative animate-in fade-in slide-in-from-top-4">
                            <div className="flex justify-between items-start">
                                <p className="text-sm">{errorMsg}</p>
                                <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-900 font-bold">
                                    <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Mini Calendar */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4 border border-input-border dark:border-gray-700 shadow-sm">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <span className="font-bold text-sm text-text-dark dark:text-white capitalize">
                                {currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                            </span>
                            <div className="flex gap-1">
                                <button onClick={() => {
                                    const d = new Date(currentDate);
                                    d.setMonth(d.getMonth() - 1);
                                    setCurrentDate(d);
                                }} className="size-7 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-dark dark:text-white">
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>
                                <button onClick={() => {
                                    const d = new Date(currentDate);
                                    d.setMonth(d.getMonth() + 1);
                                    setCurrentDate(d);
                                }} className="size-7 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-dark dark:text-white">
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 text-center mb-2">
                            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day, i) => (
                                <span key={i} className="text-xs font-medium text-gray-400 py-1">{day}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1 text-center text-text-dark dark:text-white">
                            {getMonthDays(currentDate).map((d, i) => { // Use Month view helper for mini cal too logic, or just simple
                                // Simple mini calendar reuse helper logic or kept simple for now
                                // Actually let's use weekDays logic adapted or simple month logic here
                                // For now, let's keep the existing mini calendar logic which was weirdly using weekDays in previous code, 
                                // but I'll update it to use a proper mini-month view.
                                const isToday = isSameDay(d, new Date());
                                const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentDate(d)}
                                        className={`size-8 mx-auto flex items-center justify-center rounded-full text-xs relative
                                        ${isToday ? 'bg-primary text-text-dark font-bold shadow-md shadow-primary/30' : 'hover:bg-background-light dark:hover:bg-background-dark'}
                                        ${!isCurrentMonth ? 'opacity-30' : ''}
                                    `}
                                    >
                                        {d.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 border border-input-border dark:border-gray-700 shadow-sm">
                        <h3 className="text-sm font-bold mb-4 flex items-center justify-between text-text-dark dark:text-white">
                            Filtros de Estado
                            <span className="material-symbols-outlined text-gray-400 text-sm">filter_list</span>
                        </h3>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 text-sm cursor-pointer group text-text-dark dark:text-gray-200">
                                <input defaultChecked className="form-checkbox text-primary rounded border-gray-300 focus:ring-primary h-4 w-4" type="checkbox" />
                                <span className="flex-1 group-hover:text-primary transition-colors">Confirmados (App)</span>
                                <span className="bg-primary/20 text-text-dark text-xs font-bold px-2 py-0.5 rounded-md">{events.filter(e => e.type !== 'google').length}</span>
                            </label>
                            <label className="flex items-center gap-3 text-sm cursor-pointer group text-text-dark dark:text-gray-200">
                                <input defaultChecked className="form-checkbox text-indigo-500 rounded border-gray-300 focus:ring-indigo-500 h-4 w-4" type="checkbox" />
                                <span className="flex-1 group-hover:text-indigo-400 transition-colors">Google Calendar</span>
                                <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2 py-0.5 rounded-md">{events.filter(e => e.type === 'google').length}</span>
                            </label>
                        </div>
                    </div>

                    {/* Upcoming Appointment Card (Static for UI Demo) */}
                    <div className="bg-gradient-to-br from-text-dark to-green-950 dark:from-surface-dark dark:to-black rounded-2xl p-5 text-white shadow-lg relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-primary/30 transition-all duration-700"></div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Próximo Turno</h3>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-2xl font-bold">14:30</p>
                                <p className="text-sm opacity-80">Hoy</p>
                            </div>
                            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <span className="material-symbols-outlined text-primary">person</span>
                            </div>
                        </div>
                        <div className="border-t border-white/10 pt-4">
                            <p className="font-medium truncate">Maria Rodriguez</p>
                            <p className="text-xs text-gray-300 mt-1">Antropometría Completa</p>
                        </div>
                        <button
                            onClick={() => {
                                // Find the first local event for today or dummy logic for demo
                                const todayEvent = events.find(e => isSameDay(e.start, new Date()));
                                if (todayEvent) setSelectedEvent(todayEvent);
                                else alert("No hay próximo turno hoy para mostrar detalles.");
                            }}
                            className="w-full mt-4 bg-white text-text-dark text-xs font-bold py-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Ver Detalles
                        </button>
                    </div>
                </div>

                {/* Right Column: Main Calendar */}
                <div className="flex-1 flex flex-col bg-surface-light dark:bg-surface-dark rounded-2xl border border-input-border dark:border-gray-700 shadow-sm overflow-hidden h-[800px]">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-input-border dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-background-light dark:bg-background-dark rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('week')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'week' ? 'bg-white dark:bg-surface-dark shadow-sm text-text-dark dark:text-white' : 'text-gray-500 hover:text-text-dark dark:hover:text-white'}`}
                                >
                                    Semana
                                </button>
                                <button
                                    onClick={() => setViewMode('month')}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-white dark:bg-surface-dark shadow-sm text-text-dark dark:text-white' : 'text-gray-500 hover:text-text-dark dark:hover:text-white'}`}
                                >
                                    Mes
                                </button>
                                <button
                                    onClick={() => { setViewMode('day'); handleToday(); }}
                                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'day' ? 'bg-white dark:bg-surface-dark shadow-sm text-text-dark dark:text-white' : 'text-gray-500 hover:text-text-dark dark:hover:text-white'}`}
                                >
                                    Día
                                </button>
                            </div>
                            <h2 className="text-lg font-bold hidden sm:block text-text-dark dark:text-white capitalize">
                                {viewMode === 'month'
                                    ? currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                                    : viewMode === 'day'
                                        ? currentDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                                        : formatDateRange()}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAuthClick}
                                disabled={isLoading} // Allow retry even if not inited for mock
                                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border shadow-sm
                                ${isAuthorized
                                        ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                                        : 'bg-white border-input-border hover:bg-gray-50 dark:bg-surface-dark dark:text-white dark:hover:bg-white/5'}
                                ${isLoading ? 'opacity-70 cursor-wait' : ''}
                            `}
                            >
                                {isLoading ? (
                                    <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-lg">{isAuthorized ? 'check_circle' : 'sync'}</span>
                                )}
                                {isLoading ? 'Cargando...' : (isAuthorized ? 'Sincronizado' : 'Sincronizar G-Cal')}
                            </button>
                            <button onClick={() => window.print()} className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-muted hover:bg-input-border dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-lg">print</span>
                                Imprimir
                            </button>
                            <button onClick={() => setShowConfigModal(true)} className="flex items-center gap-2 px-4 py-2 bg-text-dark text-white text-sm font-bold rounded-lg hover:bg-text-dark/90 transition-colors">
                                <span className="material-symbols-outlined text-lg">tune</span>
                                Configurar
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid Container */}
                    <div className="flex-1 overflow-auto relative flex flex-col min-h-[500px]">

                        {/* --- WEEK VIEW HEADERS --- */}
                        {viewMode === 'week' && (
                            <div className="flex border-b border-input-border dark:border-gray-700 sticky top-0 bg-surface-light dark:bg-surface-dark z-10">
                                <div className="w-16 flex-shrink-0 border-r border-input-border dark:border-gray-700 p-2 text-center"></div>
                                <div className="flex-1 grid grid-cols-7 min-w-[700px]">
                                    {weekDays.map((d, i) => {
                                        const isToday = isSameDay(d, new Date());
                                        const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
                                        const dayNum = d.getDate();
                                        return (
                                            <div key={i} className={`p-3 text-center ${i < 6 ? 'border-r border-input-border dark:border-gray-700' : ''} ${isToday ? 'bg-primary/5' : ''}`}>
                                                <p className={`text-xs uppercase font-medium ${isToday ? 'text-primary' : 'text-gray-400'}`}>{dayName}</p>
                                                <div className={`text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 
                                                ${isToday ? 'text-primary bg-primary/20' : 'text-text-dark dark:text-white'}`}>
                                                    {dayNum}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* --- DAY VIEW HEADERS --- */}
                        {viewMode === 'day' && (
                            <div className="flex border-b border-input-border dark:border-gray-700 sticky top-0 bg-surface-light dark:bg-surface-dark z-10 w-full">
                                <div className="w-16 flex-shrink-0 border-r border-input-border dark:border-gray-700 p-2 text-center"></div>
                                <div className="flex-1 p-3 text-center bg-primary/5">
                                    <p className="text-xs uppercase font-medium text-primary">{currentDate.toLocaleDateString('es-ES', { weekday: 'long' })}</p>
                                    <div className="text-lg font-bold text-primary">{currentDate.getDate()}</div>
                                </div>
                            </div>
                        )}

                        {/* --- MONTH VIEW HEADERS --- */}
                        {viewMode === 'month' && (
                            <div className="grid grid-cols-7 border-b border-input-border dark:border-gray-700 sticky top-0 bg-surface-light dark:bg-surface-dark z-10">
                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) => (
                                    <div key={i} className="p-2 text-center text-xs font-bold text-text-muted uppercase border-r border-input-border dark:border-gray-700 last:border-0">
                                        {day}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Scrollable Content Area */}
                        <div className="flex flex-1 relative min-w-[760px] pb-10">

                            {/* --- WEEK & DAY VIEW CONTENT --- */}
                            {(viewMode === 'week' || viewMode === 'day') && (
                                <>
                                    {/* Time Column */}
                                    <div className="w-16 flex-shrink-0 border-r border-input-border dark:border-gray-700 bg-background-light/50 dark:bg-background-dark/50">
                                        {Array.from({ length: 17 }).map((_, i) => {
                                            const hour = i + 6;
                                            const label = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                                            return (
                                                <div key={hour} className="h-20 border-b border-input-border dark:border-gray-700 relative">
                                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-surface-light dark:bg-surface-dark px-1 whitespace-nowrap">{label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Grid Container */}
                                    <div className={`flex-1 grid relative ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                                        {/* Background Grid Lines - Static and col-span-full to force correct height & width */}
                                        <div className="col-span-full flex flex-col pointer-events-none z-0">
                                            {Array.from({ length: 17 }).map((_, i) => (
                                                <div key={i} className="h-20 border-b border-input-border dark:border-gray-700 border-dashed w-full"></div>
                                            ))}
                                        </div>
                                        <div className={`absolute inset-0 grid pointer-events-none ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                                            {(viewMode === 'week' ? Array.from({ length: 7 }) : [1]).map((_, i) => (
                                                <div key={i} className="border-r border-input-border dark:border-gray-700 h-full"></div>
                                            ))}
                                        </div>

                                        {/* Events Render */}
                                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                                            <div className={`grid w-full h-full ${viewMode === 'week' ? 'grid-cols-7' : 'grid-cols-1'}`}>
                                                {(viewMode === 'week' ? weekDays : [currentDate]).map((columnDate, colIndex) => {
                                                    const colEvents = events.filter(e => isSameDay(e.start, columnDate));
                                                    return (
                                                        <div
                                                            key={colIndex}
                                                            className="relative h-full pointer-events-auto hover:bg-black/5 transition-colors cursor-pointer group/column"
                                                            onClick={(e) => {
                                                                // Si el click no fue en un evento, calcular la hora clickeada
                                                                if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.event-item') === null) {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const clickY = e.clientY - rect.top;
                                                                    const totalMinutes = Math.floor((clickY / 80) * 60);
                                                                    const hour = Math.floor(totalMinutes / 60) + 6; // +6 porque empieza a las 6am
                                                                    const minute = Math.floor((totalMinutes % 60) / 15) * 15; // Redondear a 15 min
                                                                    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
                                                                    handleOpenAppointmentModal(columnDate, timeString);
                                                                }
                                                            }}
                                                        >
                                                            {colEvents.map(event => {
                                                                const { top, height } = getEventPosition(event);
                                                                return (
                                                                    <div
                                                                        key={event.id}
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                                                        className={`event-item absolute left-1 right-2 rounded-md p-2 hover:brightness-95 transition-all cursor-pointer group shadow-sm z-10 overflow-hidden border-l-4 ${event.colorClass || 'bg-blue-100 border-blue-500 text-blue-900'}`}
                                                                        style={{ top: `${top}px`, height: `${height}px` }}
                                                                        title={`${event.title}\n${event.description}`}
                                                                    >
                                                                        <div className="flex justify-between items-start">
                                                                            <span className="text-[10px] font-bold truncate opacity-80">
                                                                                {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                            {event.type === 'google' && <span className="material-symbols-outlined text-[12px]">cloud</span>}
                                                                        </div>
                                                                        <p className="text-xs font-bold leading-tight truncate mt-0.5">{event.title}</p>
                                                                        {height > 50 && <p className="text-[10px] opacity-80 mt-1 truncate whitespace-pre-wrap line-clamp-2">{event.description}</p>}
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* Current Time Indicator */}
                                                            {isSameDay(columnDate, new Date()) && (
                                                                <div
                                                                    className="absolute w-full z-20 flex items-center pointer-events-none -ml-1"
                                                                    style={{
                                                                        top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (6 * 60)) * (80 / 60)}px`
                                                                    }}
                                                                >
                                                                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-md z-20"></div>
                                                                    <div className="h-0.5 w-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.6)]"></div>
                                                                    <span className="absolute left-3 -top-5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm z-30">
                                                                        Hora Actual
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* --- MONTH VIEW CONTENT --- */}
                            {viewMode === 'month' && (
                                <div className="flex-1 grid grid-cols-7 grid-rows-5 h-full min-h-[600px] w-full bg-input-border/20 dark:bg-gray-800 gap-0 border-t border-l border-input-border dark:border-gray-700">
                                    {monthDays.map((d, i) => {
                                        const isCurrentMonth = d.getMonth() === currentDate.getMonth();
                                        const isToday = isSameDay(d, new Date());
                                        const dayEvents = events.filter(e => isSameDay(e.start, d));

                                        return (
                                            <div
                                                key={i}
                                                className={`bg-background-light dark:bg-surface-dark p-2 flex flex-col gap-1 min-h-[100px] border-r border-b border-input-border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!isCurrentMonth ? 'opacity-40 bg-gray-50 dark:bg-black/20' : ''}`}
                                                onClick={(e) => {
                                                    // Si el click no fue en un evento, abrir modal para este día
                                                    if ((e.target as HTMLElement).closest('.month-event-item') === null) {
                                                        handleOpenAppointmentModal(d, '09:00');
                                                    }
                                                }}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-text-dark' : 'text-text-dark dark:text-white'}`}>
                                                        {d.getDate()}
                                                    </span>
                                                    {dayEvents.length > 0 && <span className="text-[10px] text-gray-400 font-medium">{dayEvents.length}</span>}
                                                </div>
                                                <div className="flex-1 flex flex-col gap-1 overflow-y-auto mt-1 custom-scrollbar">
                                                    {dayEvents.map(ev => (
                                                        <div
                                                            key={ev.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                                                            className={`month-event-item text-[9px] p-1 rounded border-l-2 cursor-pointer truncate hover:brightness-95 transition ${ev.colorClass ? ev.colorClass.split(' ')[0] + ' ' + ev.colorClass.split(' ')[2] : 'bg-gray-200 border-gray-400 text-gray-700'}`}
                                                            title={`${ev.title} (${ev.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                                                        >
                                                            <span className="font-bold mr-1">{ev.start.getHours()}:{(ev.start.getMinutes() < 10 ? '0' : '') + ev.start.getMinutes()}</span>
                                                            {ev.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
            {/* DETAILS MODAL */}
            {
                selectedEvent && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-6 border-b border-input-border dark:border-gray-700 flex justify-between items-center bg-primary/5">
                                <h3 className="text-xl font-bold text-text-dark dark:text-white">Detalles del Turno</h3>
                                <button onClick={() => setSelectedEvent(null)} className="text-gray-500 hover:text-red-500 transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Paciente / Título</p>
                                    <p className="text-lg font-medium text-text-dark dark:text-white">{selectedEvent.title}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Fecha</p>
                                        <p className="text-text-dark dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">calendar_today</span>
                                            {selectedEvent.start.toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Horario</p>
                                        <p className="text-text-dark dark:text-white flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            {selectedEvent.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {selectedEvent.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                {selectedEvent.description && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Descripción / Estado</p>
                                        <p className="text-sm text-text-muted bg-background-light dark:bg-background-dark p-3 rounded-lg border border-input-border dark:border-gray-700">
                                            {selectedEvent.description}
                                        </p>
                                    </div>
                                )}
                                {selectedEvent.email && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Email</p>
                                        <p className="text-sm text-text-dark">{selectedEvent.email}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-background-light dark:bg-background-dark border-t border-input-border dark:border-gray-700">
                                {showDeleteConfirm ? (
                                    <div className="flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900">
                                        <p className="text-sm text-red-700 dark:text-red-300 font-bold ml-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-lg">warning</span>
                                            ¿Eliminar definitivamente?
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 rounded-md transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={() => handleDeleteEvent(selectedEvent.id)}
                                                className="px-3 py-1.5 text-xs font-bold bg-red-500 text-white hover:bg-red-600 rounded-md transition-colors shadow-sm"
                                            >
                                                Si, Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => setSelectedEvent(null)} className="px-4 py-2 text-text-dark dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium">
                                            Cerrar
                                        </button>
                                        {selectedEvent.type !== 'google' && (
                                            <>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                                                >
                                                    Eliminar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        // Extraer datos del evento para prellenar el modal
                                                        const titleParts = selectedEvent.title.split(' - ');
                                                        const clientName = titleParts[0] || '';
                                                        const type = titleParts[1] || selectedEvent.description || '';

                                                        setAppointmentModalData({
                                                            date: selectedEvent.start,
                                                            time: selectedEvent.start.toTimeString().slice(0, 5)
                                                        });
                                                        setSelectedEvent(null);
                                                        setShowAppointmentModal(true);
                                                    }}
                                                    className="px-4 py-2 bg-primary text-text-dark font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                                                >
                                                    Reprogramar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Floating Action Button */}
            <button
                onClick={() => handleOpenAppointmentModal()}
                className="fixed bottom-8 right-8 p-4 bg-primary text-text-dark rounded-full shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:scale-110 transition-all duration-200 z-40 group"
                title="Agendar Nuevo Turno"
            >
                <span className="material-symbols-outlined text-3xl">add</span>
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-text-dark text-white px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Nuevo Turno
                </span>
            </button>

            {/* Appointment Modal */}
            <AppointmentModal
                isOpen={showAppointmentModal}
                onClose={() => setShowAppointmentModal(false)}
                onSave={handleSaveAppointment}
                initialDate={appointmentModalData.date}
                initialTime={appointmentModalData.time}
            />
        </div>
    );
};

export default Calendar;