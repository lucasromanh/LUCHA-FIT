import React, { useState } from 'react';
import { Appointment } from '../types';

interface DashboardProps {
    onNavigate: (page: string) => void;
    appointments?: Appointment[]; // Received from App state
    onConfirmBooking?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, appointments = [], onConfirmBooking }) => {
  const [notification, setNotification] = useState<{show: boolean, message: string, subtext: string} | null>(null);
  
  // Separate appointments by status
  const pendingApprovals = appointments.filter(a => a.status === 'pending_approval');
  const upcomingAppointments = appointments.filter(a => a.status === 'pending');

  const handleConfirm = (apt: Appointment) => {
      if(onConfirmBooking) {
          onConfirmBooking(apt.id);
          
          // Simulate backend email trigger log
          console.log(`%c[EMAIL SYSTEM]`, 'color: #13ec5b; font-weight: bold;');
          console.log(`Sending confirmation email to ${apt.email} for appointment on ${apt.date}`);

          // Show UI Notification
          setNotification({
              show: true,
              message: `Turno confirmado para ${apt.clientName}`,
              subtext: `Se ha enviado un email de confirmación a ${apt.email || 'su correo'}.`
          });

          // Hide after 4 seconds
          setTimeout(() => {
              setNotification(null);
          }, 4000);
      }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 relative">
      
      {/* Success Notification Toast */}
      {notification && (
          <div className="fixed top-24 right-4 md:right-10 z-[100] animate-in slide-in-from-right-10 fade-in duration-300">
              <div className="bg-[#0d1b12] text-white border-l-4 border-primary p-4 rounded-lg shadow-2xl shadow-black/20 flex items-start gap-4 max-w-md">
                  <div className="bg-primary/20 rounded-full p-2 text-primary mt-0.5">
                      <span className="material-symbols-outlined">mark_email_read</span>
                  </div>
                  <div>
                      <h4 className="font-bold text-sm">{notification.message}</h4>
                      <p className="text-xs text-gray-400 mt-1">{notification.subtext}</p>
                  </div>
                  <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white ml-auto">
                      <span className="material-symbols-outlined text-sm">close</span>
                  </button>
              </div>
          </div>
      )}

      {/* Page Heading */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-dark dark:text-white tracking-tight mb-2">Hola, Dr. Lucha 👋</h1>
          <p className="text-text-muted dark:text-gray-400 text-base">Resumen de tu actividad y próximos turnos para hoy.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-lg border border-input-border dark:border-gray-700 shadow-sm">
          <span className="material-symbols-outlined text-primary">calendar_today</span>
          <span className="text-sm font-bold text-text-dark dark:text-white">{new Date().toLocaleDateString('es-ES', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stat Card 1 */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-input-border dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">group</span>
          </div>
          <p className="text-text-muted dark:text-gray-400 font-medium text-sm mb-2">Pacientes Activos</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-text-dark dark:text-white">124</h3>
            <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs font-bold">+12% este mes</span>
          </div>
        </div>
        
        {/* Stat Card 2 */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-input-border dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">show_chart</span>
          </div>
          <p className="text-text-muted dark:text-gray-400 font-medium text-sm mb-2">Mediciones del Mes</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-text-dark dark:text-white">45</h3>
            <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs font-bold">+5% vs mes ant.</span>
          </div>
        </div>
        
        {/* Stat Card 3 */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-input-border dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">event_available</span>
          </div>
          <p className="text-text-muted dark:text-gray-400 font-medium text-sm mb-2">Turnos Hoy</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-text-dark dark:text-white">{upcomingAppointments.length}</h3>
            <span className="text-gray-400 text-xs font-normal">{pendingApprovals.length} solicitudes web</span>
          </div>
        </div>
      </section>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Quick Actions & Appointments */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Quick Actions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-dark dark:text-white">Accesos Rápidos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button onClick={() => onNavigate('clients')} className="flex flex-col items-start gap-3 p-5 rounded-xl border border-input-border dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:border-primary dark:hover:border-primary transition-all shadow-sm hover:shadow-md group text-left">
                <div className="p-3 rounded-lg bg-[#e7f3eb] dark:bg-primary/20 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                  <span className="material-symbols-outlined">person_add</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-dark dark:text-white">Nuevo Paciente</h3>
                  <p className="text-sm text-text-muted dark:text-gray-400 mt-1">Registrar perfil y datos</p>
                </div>
              </button>
              <button onClick={() => onNavigate('reports')} className="flex flex-col items-start gap-3 p-5 rounded-xl border border-input-border dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:border-primary dark:hover:border-primary transition-all shadow-sm hover:shadow-md group text-left">
                <div className="p-3 rounded-lg bg-[#e7f3eb] dark:bg-primary/20 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                  <span className="material-symbols-outlined">straighten</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-dark dark:text-white">Nueva Medición</h3>
                  <p className="text-sm text-text-muted dark:text-gray-400 mt-1">Iniciar antropometría</p>
                </div>
              </button>
              <button onClick={() => onNavigate('calendar')} className="flex flex-col items-start gap-3 p-5 rounded-xl border border-input-border dark:border-gray-700 bg-surface-light dark:bg-surface-dark hover:border-primary dark:hover:border-primary transition-all shadow-sm hover:shadow-md group text-left">
                <div className="p-3 rounded-lg bg-[#e7f3eb] dark:bg-primary/20 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                  <span className="material-symbols-outlined">event_note</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-dark dark:text-white">Ver Agenda</h3>
                  <p className="text-sm text-text-muted dark:text-gray-400 mt-1">Gestionar turnos</p>
                </div>
              </button>
            </div>
          </section>
          
          {/* Web Requests Section */}
          {pendingApprovals.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-500 animate-pulse">notifications_active</span>
                    <h2 className="text-xl font-bold text-text-dark dark:text-white">Solicitudes Web Pendientes</h2>
                 </div>
              </div>
              <div className="bg-surface-light dark:bg-surface-dark border-2 border-yellow-400/30 dark:border-yellow-600/30 rounded-xl overflow-hidden shadow-sm">
                <div className="divide-y divide-input-border dark:divide-gray-800">
                  {pendingApprovals.map((apt) => (
                    <div key={apt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-yellow-50/50 dark:bg-yellow-900/10">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-yellow-100 dark:bg-yellow-900/30 rounded-lg w-12 h-12 text-yellow-700 dark:text-yellow-400 shrink-0">
                          <span className="material-symbols-outlined">touch_app</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-text-dark dark:text-white text-base">{apt.clientName}</h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                                Pendiente
                            </span>
                          </div>
                          <p className="text-sm text-text-muted dark:text-gray-400 flex items-center gap-1 mt-1">
                            {apt.date} • {apt.startTime} hs • {apt.type}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleConfirm(apt)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-text-dark text-white text-sm font-bold hover:bg-primary hover:text-black transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Confirmar Turno
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Upcoming Appointments List */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-text-dark dark:text-white">Próximos Turnos</h2>
              <button onClick={() => onNavigate('calendar')} className="text-primary text-sm font-bold hover:underline">Ver todos</button>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              <div className="divide-y divide-input-border dark:divide-gray-800">
                {upcomingAppointments.length > 0 ? upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center bg-[#e7f3eb] dark:bg-primary/10 rounded-lg w-14 h-14 text-primary shrink-0">
                        <span className="text-xs font-bold uppercase">{apt.date.split(' ')[1]}</span>
                        <span className="text-lg font-black leading-none">{apt.date.split(' ')[0]}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-text-dark dark:text-white text-lg">{apt.clientName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${apt.colorClass}`}>{apt.type}</span>
                        </div>
                        <p className="text-sm text-text-muted dark:text-gray-400 flex items-center gap-1 mt-1">
                          <span className="material-symbols-outlined text-sm">schedule</span> {apt.startTime} - {apt.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-input-border dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700">Reprogramar</button>
                      <button className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-primary text-text-dark text-sm font-bold hover:bg-primary-dark hover:text-white transition-colors">Iniciar</button>
                    </div>
                  </div>
                )) : (
                    <div className="p-8 text-center text-text-muted dark:text-gray-500">
                        No hay turnos confirmados próximamente.
                    </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Recent Activity / Notifications */}
        <div className="flex flex-col gap-6">
          {/* Mini Profile Card for Next Patient */}
          <div className="bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/5 rounded-xl p-6 border border-primary/20">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-primary text-black text-xs font-bold px-2 py-1 rounded">EN PROCESO</span>
              <button className="text-text-muted hover:text-text-dark">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>
            <div className="flex flex-col items-center text-center mb-6">
              <div 
                className="w-20 h-20 rounded-full bg-cover bg-center mb-3 ring-4 ring-white dark:ring-surface-dark" 
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCScO8kJilVTwzzSZvuVtF8diyIWMcwyNnto9BYPvA42-gCnGt9SzhUnpC0w-SQLf6tprecAjpFVGWYPcla5jNqy5vRZMykwiK4Qp6rEo9xEirZT9RN7-LnnUa9WlV2C2kCogThKLxNKwnQW25dXdzCcTZPsBW-ktcXO1aWqOYBjj2-kUIUzk_t3u3_mk1zU1QB6UsezXpyLHxUV-sgeR7GQlYGcN5C8w40EBalYbdGnwe-ltPCmunGTOiwIgjcb5P7e10AzkKx6_A')" }}
              ></div>
              <h3 className="text-lg font-bold text-text-dark dark:text-white">Jorge Mendez</h3>
              <p className="text-sm text-text-muted dark:text-gray-400">Objetivo: Hipertrofia</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white dark:bg-black/20 p-3 rounded-lg text-center">
                <p className="text-xs text-text-muted dark:text-gray-400">Peso Actual</p>
                <p className="text-lg font-bold text-text-dark dark:text-white">82.5 kg</p>
              </div>
              <div className="bg-white dark:bg-black/20 p-3 rounded-lg text-center">
                <p className="text-xs text-text-muted dark:text-gray-400">Grasa %</p>
                <p className="text-lg font-bold text-text-dark dark:text-white">14.2%</p>
              </div>
            </div>
            <button className="w-full bg-text-dark dark:bg-white text-white dark:text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
              Ver Perfil Completo
            </button>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-text-dark dark:text-white mb-4">Actividad Reciente</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <div className="mt-1 size-2 rounded-full bg-primary shrink-0"></div>
                <div>
                  <p className="text-sm text-text-dark dark:text-gray-200">
                    <span className="font-bold">Laura S.</span> completó su registro.
                  </p>
                  <p className="text-xs text-text-muted dark:text-gray-500 mt-0.5">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="mt-1 size-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></div>
                <div>
                  <p className="text-sm text-text-dark dark:text-gray-200">
                    Se envió la dieta a <span className="font-bold">Marcos T.</span>
                  </p>
                  <p className="text-xs text-text-muted dark:text-gray-500 mt-0.5">Hace 4 horas</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="mt-1 size-2 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></div>
                <div>
                  <p className="text-sm text-text-dark dark:text-gray-200">
                    Nueva medición guardada para <span className="font-bold">Ana R.</span>
                  </p>
                  <p className="text-xs text-text-muted dark:text-gray-500 mt-0.5">Ayer a las 18:30</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;