import React, { useEffect, useState, useMemo } from 'react';

declare var gapi: any;
declare var google: any;

// NOTE: Replace these with your actual Google Cloud credentials
// Enable the Google Calendar API in your Google Cloud Console
const CLIENT_ID = 'YOUR_CLIENT_ID'; 
const API_KEY = 'YOUR_API_KEY';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  colorClass?: string;
  type?: 'google' | 'local';
}

const Calendar: React.FC = () => {
  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  // UI States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Date Management - Default to Today
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate start of current week (Sunday)
  const currentWeekStart = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day; // adjust when day is sunday
    return new Date(d.setDate(diff));
  }, [currentDate]);

  // Initial Mock Data (Placed in the current week for visibility)
  const initialLocalEvents: CalendarEvent[] = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // Create events relative to today so they always show up
    return [
      {
        id: 'local-1',
        title: 'Ana Gómez - Evaluación',
        start: new Date(year, month, day, 8, 15),
        end: new Date(year, month, day, 9, 15),
        description: 'Evaluación Inicial',
        colorClass: 'bg-primary/10 border-l-4 border-primary text-text-dark dark:text-white',
        type: 'local'
      },
      {
        id: 'local-2',
        title: 'Team Fit - Grupal',
        start: new Date(year, month, day + 2, 9, 0), 
        end: new Date(year, month, day + 2, 10, 0),
        description: 'Grupal (3 pax)',
        colorClass: 'bg-primary/10 border-l-4 border-primary text-text-dark dark:text-white',
        type: 'local'
      },
    ];
  }, []);

  useEffect(() => {
    setEvents(initialLocalEvents);

    const script1 = document.createElement('script');
    script1.src = "https://apis.google.com/js/api.js";
    script1.onload = () => gapiLoaded();
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = "https://accounts.google.com/gsi/client";
    script2.onload = () => gisLoaded();
    document.body.appendChild(script2);

    return () => {
        // Cleanup not strictly necessary for single page app lifecycle but good practice
        try {
            if(document.body.contains(script1)) document.body.removeChild(script1);
            if(document.body.contains(script2)) document.body.removeChild(script2);
        } catch(e) {}
    }
  }, [initialLocalEvents]);

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
    if(!tokenClient) return;
    
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
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      tokenClient.requestAccessToken({prompt: ''});
    }
  };

  const fetchGoogleEvents = async () => {
    try {
      // Calculate timeMin (Start of week) and timeMax (End of week) for efficient fetching
      const timeMin = new Date(currentWeekStart);
      timeMin.setHours(0,0,0,0);
      
      const timeMax = new Date(currentWeekStart);
      timeMax.setDate(timeMax.getDate() + 7);
      timeMax.setHours(23,59,59,999);

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
             start.setHours(0,0,0,0);
             end.setHours(23,59,59,999); 
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

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-0 h-full">
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
                            {weekDays[0].toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                        </span>
                        <div className="flex gap-1">
                            <button onClick={handlePrevWeek} className="size-7 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-dark dark:text-white">
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button onClick={handleNextWeek} className="size-7 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-background-dark text-text-dark dark:text-white">
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
                        {weekDays.map((d, i) => {
                            const isToday = isSameDay(d, new Date());
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentDate(d)}
                                    className={`size-8 mx-auto flex items-center justify-center rounded-full text-xs relative
                                        ${isToday ? 'bg-primary text-text-dark font-bold shadow-md shadow-primary/30' : 'hover:bg-background-light dark:hover:bg-background-dark'}
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
                            <input defaultChecked className="form-checkbox text-primary rounded border-gray-300 focus:ring-primary h-4 w-4" type="checkbox"/>
                            <span className="flex-1 group-hover:text-primary transition-colors">Confirmados</span>
                            <span className="bg-primary/20 text-text-dark text-xs font-bold px-2 py-0.5 rounded-md">{events.filter(e => e.type === 'local').length}</span>
                        </label>
                        <label className="flex items-center gap-3 text-sm cursor-pointer group text-text-dark dark:text-gray-200">
                            <input defaultChecked className="form-checkbox text-indigo-500 rounded border-gray-300 focus:ring-indigo-500 h-4 w-4" type="checkbox"/>
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
                    <button className="w-full mt-4 bg-white text-text-dark text-xs font-bold py-2 rounded-lg hover:bg-gray-100 transition-colors">
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
                            <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-white dark:bg-surface-dark shadow-sm text-text-dark dark:text-white transition-all">Semana</button>
                            <button className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-text-dark dark:hover:text-white transition-all">Mes</button>
                            <button onClick={handleToday} className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-text-dark dark:hover:text-white transition-all">Hoy</button>
                        </div>
                        <h2 className="text-lg font-bold hidden sm:block text-text-dark dark:text-white capitalize">
                            {formatDateRange()}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleAuthClick}
                            disabled={!gapiInited || !gisInited || isLoading}
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
                        <button className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-muted hover:bg-input-border dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-lg">print</span>
                            Imprimir
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-text-dark text-white text-sm font-bold rounded-lg hover:bg-text-dark/90 transition-colors">
                            <span className="material-symbols-outlined text-lg">tune</span>
                            Configurar
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 overflow-auto relative flex flex-col min-h-[500px]">
                    {/* Header Row */}
                    <div className="flex border-b border-input-border dark:border-gray-700 sticky top-0 bg-surface-light dark:bg-surface-dark z-10">
                        <div className="w-16 flex-shrink-0 border-r border-input-border dark:border-gray-700 p-2 text-center"></div>
                        <div className="flex-1 grid grid-cols-7 min-w-[700px]">
                            {/* Render Days Header */}
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

                    {/* Scrollable Content */}
                    <div className="flex flex-1 relative min-w-[760px]">
                        {/* Time Column (06 AM to 10 PM) */}
                        <div className="w-16 flex-shrink-0 border-r border-input-border dark:border-gray-700 bg-background-light/50 dark:bg-background-dark/50">
                            {Array.from({length: 17}).map((_, i) => {
                                const hour = i + 6; // Start at 6 AM
                                const label = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                                return (
                                    <div key={hour} className="h-20 border-b border-input-border dark:border-gray-700 relative">
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs text-gray-400 bg-surface-light dark:bg-surface-dark px-1 whitespace-nowrap">{label}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid Cells & Events */}
                        <div className="flex-1 grid grid-cols-7 relative">
                             {/* Horizontal grid lines */}
                             <div className="absolute inset-0 flex flex-col pointer-events-none">
                                {Array.from({length: 17}).map((_, i) => (
                                    <div key={i} className="h-20 border-b border-input-border dark:border-gray-700 border-dashed"></div>
                                ))}
                             </div>
                             {/* Vertical grid lines */}
                             <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                {Array.from({length: 6}).map((_, i) => (
                                    <div key={i} className="border-r border-input-border dark:border-gray-700"></div>
                                ))}
                                <div></div>
                             </div>

                             {/* Events Rendering Layer */}
                             <div className="absolute inset-0 w-full h-full pointer-events-none">
                                <div className="grid grid-cols-7 w-full h-full">
                                    {/* Render columns for event mapping */}
                                    {weekDays.map((dayDate, colIndex) => {
                                        // Filter events that fall on this specific date
                                        const colEvents = events.filter(e => isSameDay(e.start, dayDate));
                                        
                                        return (
                                            <div key={colIndex} className="relative h-full pointer-events-auto">
                                                {colEvents.map(event => {
                                                    const { top, height } = getEventPosition(event);
                                                    return (
                                                        <div 
                                                            key={event.id}
                                                            className={`absolute left-1 right-2 rounded-r-md p-2 hover:brightness-95 transition-all cursor-pointer group shadow-sm z-10 overflow-hidden ${event.colorClass}`}
                                                            style={{ top: `${top}px`, height: `${height}px` }}
                                                            title={`${event.title}\n${event.description}`}
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <span className="text-[11px] font-bold truncate">
                                                                    {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                                </span>
                                                                {event.type === 'google' && <span className="material-symbols-outlined text-[12px]">cloud</span>}
                                                            </div>
                                                            <p className="text-xs font-bold leading-tight truncate">{event.title}</p>
                                                            {height > 40 && <p className="text-[10px] opacity-80 mt-1 truncate">{event.description}</p>}
                                                        </div>
                                                    );
                                                })}
                                                {/* Current Time Line (Red) if Today */}
                                                {isSameDay(dayDate, new Date()) && (
                                                     <div 
                                                        className="absolute w-[100%] z-20 flex items-center pointer-events-none -ml-1.5"
                                                        style={{ 
                                                            top: `${((new Date().getHours() * 60 + new Date().getMinutes()) - (6 * 60)) * (80/60)}px` 
                                                        }}
                                                     >
                                                        <div className="w-3 h-3 bg-red-500 rounded-full shadow-md"></div>
                                                        <div className="h-0.5 w-full bg-red-500"></div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Calendar;