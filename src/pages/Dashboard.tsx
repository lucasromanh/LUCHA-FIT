import React, { useState, useMemo } from 'react';
import { Appointment } from '../types';
import { CLIENTS, PROFESSIONAL_PROFILE } from '../constants';

interface DashboardProps {
  onNavigate: (page: string) => void;
  appointments?: Appointment[];
  onConfirmBooking?: (id: string) => void;
  onRescheduleBooking?: (id: string, date: string, time: string) => void;
  onGoToReports?: (clientName: string, mode: 'new' | 'details') => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  appointments = [],
  onConfirmBooking,
  onRescheduleBooking,
  onGoToReports
}) => {
  const [notification, setNotification] = useState<{ show: boolean, message: string, subtext: string } | null>(null);

  // Reschedule Modal State
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' });

  // Carousel State for "In Progress" card
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);

  // Separate appointments by status
  const pendingApprovals = appointments.filter(a => a.status === 'pending_approval');
  // Sort upcoming by some logic (here just by existing order)
  const upcomingAppointments = appointments.filter(a => a.status === 'pending');

  // --- LOGIC: NEXT PATIENT CARD ---
  const activePatientApt = upcomingAppointments[currentPatientIndex] || null;
  // Find Client Data matching the appointment
  const activePatientData = activePatientApt
    ? CLIENTS.find(c => c.name.toLowerCase() === activePatientApt.clientName.toLowerCase())
    : null;

  const nextPatient = () => {
    if (currentPatientIndex < upcomingAppointments.length - 1) {
      setCurrentPatientIndex(prev => prev + 1);
    } else {
      setCurrentPatientIndex(0); // Loop back
    }
  };

  const prevPatient = () => {
    if (currentPatientIndex > 0) {
      setCurrentPatientIndex(prev => prev - 1);
    } else {
      setCurrentPatientIndex(upcomingAppointments.length - 1); // Loop to end
    }
  };


  const handleConfirm = (apt: Appointment) => {
    if (onConfirmBooking) {
      onConfirmBooking(apt.id);

      // Simulate backend email trigger log
      console.log(`%c[EMAIL SYSTEM]`, 'color: #13ec5b; font-weight: bold;');
      console.log(`Sending confirmation email to ${apt.email} for appointment on ${apt.date}`);

      // Show UI Notification
      setNotification({
        show: true,
        message: `Turno confirmado para ${apt.clientName}`,
        subtext: `Se ha enviado un email HTML (ver consola) a ${apt.email || 'su correo'}.`
      });

      setTimeout(() => {
        setNotification(null);
      }, 4000);
    }
  };

  const openRescheduleModal = (id: string) => {
    setSelectedAptId(id);
    setIsRescheduleOpen(true);
    setRescheduleData({ date: '', time: '' });
  };

  const submitReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (onRescheduleBooking && selectedAptId && rescheduleData.date && rescheduleData.time) {
      onRescheduleBooking(selectedAptId, rescheduleData.date, rescheduleData.time);
      setIsRescheduleOpen(false);
      setNotification({
        show: true,
        message: `Turno reprogramado`,
        subtext: `Nueva fecha: ${rescheduleData.date} a las ${rescheduleData.time}`
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleStartMeasurement = (clientName: string) => {
    if (onGoToReports) {
      onGoToReports(clientName, 'new');
    }
  };

  const handleViewProfile = (clientName: string) => {
    if (onGoToReports) {
      onGoToReports(clientName, 'details');
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

      {/* Reschedule Modal */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm p-6 border border-input-border dark:border-gray-700 animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-text-dark dark:text-white mb-4">Reprogramar Turno</h3>
            <form onSubmit={submitReschedule} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-text-muted">Nueva Fecha</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={rescheduleData.date}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase text-text-muted">Nueva Hora</label>
                <select
                  required
                  className="input-field"
                  value={rescheduleData.time}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                >
                  <option value="">Seleccionar...</option>
                  {['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsRescheduleOpen(false)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:bg-primary-dark">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Heading */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-text-dark dark:text-white tracking-tight mb-2">Hola, {PROFESSIONAL_PROFILE.name.split(' ')[0]} 👋</h1>
          <p className="text-text-muted dark:text-gray-400 text-base">Resumen de tu actividad y próximos turnos para hoy.</p>
        </div>
        <div className="flex items-center gap-2 bg-white dark:bg-surface-dark px-4 py-2 rounded-lg border border-input-border dark:border-gray-700 shadow-sm">
          <span className="material-symbols-outlined text-primary">calendar_today</span>
          <span className="text-sm font-bold text-text-dark dark:text-white">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-dark dark:text-white">Agendar Turno</h3>
                  <p className="text-sm text-text-muted dark:text-gray-400 mt-1">Programar cita</p>
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
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => {
                            // Simple rejection mock - could be prop function
                            if (window.confirm('¿Rechazar solicitud?')) {
                              // In a real app, this would call a parent function to remove from state
                              alert('Solicitud rechazada - Se enviaría mail de aviso (TODO)');
                            }
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleConfirm(apt)}
                          className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-text-dark text-white text-sm font-bold hover:bg-primary hover:text-black transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Confirmar
                        </button>
                      </div>
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
                      <button
                        onClick={() => openRescheduleModal(apt.id)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-input-border dark:border-gray-600 text-text-dark dark:text-white text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Reprogramar
                      </button>
                      <button
                        onClick={() => handleStartMeasurement(apt.clientName)}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-primary text-text-dark text-sm font-bold hover:bg-primary-dark hover:text-white transition-colors"
                      >
                        Iniciar
                      </button>
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
          {/* Dynamic Next Patient Card */}
          {activePatientApt ? (
            <div className="bg-gradient-to-br from-primary/10 to-transparent dark:from-primary/5 rounded-xl p-6 border border-primary/20 relative">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-primary text-black text-xs font-bold px-2 py-1 rounded">EN PROCESO</span>
                <div className="flex gap-1">
                  <button onClick={prevPatient} className="size-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-text-dark dark:text-white">
                    <span className="material-symbols-outlined text-xs">chevron_left</span>
                  </button>
                  <button onClick={nextPatient} className="size-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-text-dark dark:text-white">
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className="w-20 h-20 rounded-full bg-cover bg-center mb-3 ring-4 ring-white dark:ring-surface-dark bg-gray-200"
                  style={{ backgroundImage: `url('${activePatientData?.image || ''}')` }}
                >
                  {!activePatientData?.image && <span className="flex items-center justify-center h-full text-2xl font-bold text-gray-400">{activePatientApt.clientName.charAt(0)}</span>}
                </div>
                <h3 className="text-lg font-bold text-text-dark dark:text-white">{activePatientApt.clientName}</h3>
                <p className="text-sm text-text-muted dark:text-gray-400">Objetivo: {activePatientData?.goal || 'No definido'}</p>
                <p className="text-xs mt-2 bg-white dark:bg-black/20 px-2 py-1 rounded text-primary font-bold">
                  Turno: {activePatientApt.startTime} hs
                </p>
              </div>

              {activePatientData ? (
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white dark:bg-black/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-text-muted dark:text-gray-400">Peso Actual</p>
                    <p className="text-lg font-bold text-text-dark dark:text-white">{activePatientData.weight} kg</p>
                  </div>
                  <div className="bg-white dark:bg-black/20 p-3 rounded-lg text-center">
                    <p className="text-xs text-text-muted dark:text-gray-400">Grasa %</p>
                    <p className="text-lg font-bold text-text-dark dark:text-white">{activePatientData.bodyFat}%</p>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-center text-yellow-700 dark:text-yellow-400">
                  Este paciente no tiene perfil de datos creado aún.
                </div>
              )}

              <button
                onClick={() => handleViewProfile(activePatientApt.clientName)}
                className="w-full bg-text-dark dark:bg-white text-white dark:text-black font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                Ver Perfil Completo
              </button>
            </div>
          ) : (
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-6 border border-input-border dark:border-gray-700 text-center text-text-muted">
              No hay turnos activos para procesar.
            </div>
          )}

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

      <style>{`
          .input-field {
                width: 100%;
                border-radius: 0.5rem;
                border: 1px solid #cfe7d7;
                padding: 0.5rem;
                font-size: 0.875rem;
                color: #0d1b12;
                background-color: white;
            }
            .dark .input-field {
                background-color: #1a2e22;
                border-color: #374151;
                color: white;
            }
      `}</style>
    </div>
  );
};

export default Dashboard;