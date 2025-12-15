import React, { useState } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Routines from './pages/Routines';
import Sidebar from './components/Sidebar';
import { Appointment, Client } from './types';
import { UPCOMING_APPOINTMENTS, CLIENTS } from './constants';
import { appointmentsApi } from './services/api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Appointment State (Simulating Database)
  const [appointments, setAppointments] = useState<Appointment[]>(UPCOMING_APPOINTMENTS);

  // State to pass data between Dashboard and Reports/Routines
  const [selectedClientForReports, setSelectedClientForReports] = useState<Client | null>(null);
  const [reportViewMode, setReportViewMode] = useState<'details' | 'new' | 'list'>('list');

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const navigateTo = (page: string) => {
    // Reset report state if navigating normally
    if (page === 'reports') {
      setSelectedClientForReports(null);
      setReportViewMode('list');
    }
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  // Function called by Home to request a booking (Pre-confirmation)
  const handleRequestBooking = (newAppointment: Appointment) => {
    // Agregar nueva cita al estado local
    setAppointments(prev => [...prev, newAppointment]);

    // console.log('%c[EMAIL SYSTEM] Email de solicitud pendiente enviado desde backend', 'color: #f59e0b; font-weight: bold;');
  };

  // Function called by Dashboard to confirm a booking
  const handleConfirmBooking = async (id: string) => {
    try {
      // Actualizar en el backend
      const response = await appointmentsApi.update(id, { status: 'confirmed' });

      if (response.success) {
        // Actualizar estado local
        setAppointments(prev => prev.map(apt => {
          if (apt.id === id) {
            return { ...apt, status: 'confirmed', colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
          }
          return apt;
        }));

        // console.log(`%c[EMAIL SYSTEM] Turno confirmado - Email enviado desde backend`, 'color: #13ec5b; font-weight: bold;');
      } else {
        console.error('Error al confirmar turno:', response.error);
        alert('Error al confirmar el turno');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  };

  // Function called by Dashboard to reject/cancel booking
  const handleRejectBooking = async (id: string) => {
    try {
      const response = await appointmentsApi.delete(id);

      if (response.success) {
        // Eliminar del estado local
        setAppointments(prev => prev.filter(apt => apt.id !== id));
        return true;
      } else {
        console.error('Error al rechazar turno:', response.error);
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // Function called by Dashboard to reschedule
  const handleRescheduleBooking = (id: string, newDate: string, newTime: string) => {
    setAppointments(prev => prev.map(apt =>
      apt.id === id ? {
        ...apt,
        date: new Date(newDate + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
        rawDate: newDate, // Keep ISO for logic if needed
        startTime: newTime,
        endTime: `${parseInt(newTime.split(':')[0]) + 1}:00` // Simple 1h duration logic
      } : apt
    ));
  };

  // Function called by Dashboard to Start Measurement or View Profile
  const handleGoToReports = (clientName: string, mode: 'new' | 'details') => {
    // Find the full Client object based on the name from the appointment
    const client = CLIENTS.find(c => c.name.toLowerCase() === clientName.toLowerCase());

    if (client) {
      setSelectedClientForReports(client);
      setReportViewMode(mode);
      setCurrentPage('reports');
    } else {
      // If client doesn't exist, go to Reports List so user can see they need to add one or search manually
      // This matches the user request to stay in "Mediciones" logic
      console.warn("Client not found, redirecting to Reports List");
      setSelectedClientForReports(null);
      setReportViewMode('list');
      setCurrentPage('reports');
    }
  };

  // If we are on Home page, render Home
  if (currentPage === 'home') {
    return <Home
      onNavigate={(page) => {
        if (page === 'login' && isAuthenticated) {
          setCurrentPage('dashboard');
        } else {
          setCurrentPage(page);
        }
      }}
      existingAppointments={appointments}
      onRequestBooking={handleRequestBooking}
    />;
  }

  // If we are on Login page or not authenticated (and trying to access protected), render Login
  if (!isAuthenticated || currentPage === 'login') {
    return <Login onLogin={handleLogin} onBack={() => setCurrentPage('home')} />;
  }

  // Protected App Layout
  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-text-dark dark:text-gray-100 overflow-hidden font-display">
      {/* Sidebar - Desktop */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-surface-light dark:bg-surface-dark border-b border-input-border dark:border-gray-800 z-50">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-text-dark font-bold text-sm">LF</div>
            <span className="font-bold text-lg">LUCHA-FIT</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-text-dark dark:text-white">
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 top-[73px] bg-background-light dark:bg-background-dark z-40 p-4 flex flex-col gap-4 lg:hidden">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
              { id: 'clients', label: 'Pacientes', icon: 'group' },
              { id: 'calendar', label: 'Calendario', icon: 'calendar_month' },
              { id: 'reports', label: 'Mediciones', icon: 'show_chart' },
              { id: 'routines', label: 'Rutinas', icon: 'fitness_center' },
              { id: 'settings', label: 'Configuración', icon: 'settings' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`flex items-center gap-3 p-4 rounded-lg text-lg font-medium ${currentPage === item.id ? 'bg-primary/20 text-primary' : 'text-text-muted'}`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </button>
            ))}
            <button onClick={handleLogout} className="mt-auto flex items-center gap-3 p-4 rounded-lg text-lg font-medium text-red-500 bg-red-50 dark:bg-red-900/10">
              <span className="material-symbols-outlined">logout</span>
              Cerrar Sesión
            </button>
          </div>
        )}

        {/* Content Scrollable Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8 lg:p-10">
          {currentPage === 'dashboard' && (
            <Dashboard
              onNavigate={navigateTo}
              appointments={appointments}
              onConfirmBooking={handleConfirmBooking}
              onRescheduleBooking={handleRescheduleBooking}
              onGoToReports={handleGoToReports}
            />
          )}
          {currentPage === 'clients' && <Clients />}
          {currentPage === 'calendar' && <Calendar appointments={appointments} />}
          {currentPage === 'reports' && (
            <Reports
              externalClient={selectedClientForReports}
              externalViewMode={reportViewMode}
            />
          )}
          {currentPage === 'routines' && <Routines />}
          {currentPage === 'settings' && (
            <div className="flex flex-col items-center justify-center h-full text-text-muted">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">settings</span>
              <h2 className="text-2xl font-bold mb-2">Configuración</h2>
              <p>Funcionalidad en desarrollo...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;