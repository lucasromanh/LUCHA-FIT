import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Routines from './pages/Routines';
import Sidebar from './components/Sidebar';
import { Appointment, Client } from './types';
import { CLIENTS } from './constants';
import { appointmentsApi } from './services/api';
import { luchafitEmail, generateWhatsAppLink, whatsappMessages } from './services/emailService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('luchafit_auth') === 'true';
  });
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem('lucha_current_page') || 'home';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global Appointment State
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Fetch appointments on load
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await appointmentsApi.getAll();
        if (response.success && response.data) {
          setAppointments(response.data);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      }
    };

    fetchAppointments();
  }, []);

  // State to pass data between Dashboard and Reports/Routines/Clients
  const [selectedClientForReports, setSelectedClientForReports] = useState<Client | null>(null);
  const [reportViewMode, setReportViewMode] = useState<'details' | 'new' | 'list'>('list');

  // State for Clients Page Navigation (e.g. "Register New Patient" from Dashboard)
  const [clientNavState, setClientNavState] = useState<{ mode: 'create' | 'list', data?: any }>({ mode: 'list' });

  const handleLogin = () => {
    localStorage.setItem('luchafit_auth', 'true');
    localStorage.setItem('lucha_current_page', 'dashboard');
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('luchafit_auth');
    localStorage.removeItem('lucha_current_page');
    setIsAuthenticated(false);
    setCurrentPage('home');
  };

  const navigateTo = (page: string) => {
    // Reset report state if navigating normally
    if (page === 'reports') {
      setSelectedClientForReports(null);
      setReportViewMode('list');
    }

    // Reset clients state if navigating normally
    if (page === 'clients' && currentPage !== 'clients') {
      // Only reset if we are not already in a special mode... 
      // For simplicity, always reset nav state when clicking the menu item
      setClientNavState({ mode: 'list' });
    }

    localStorage.setItem('lucha_current_page', page);
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };

  // Function called by Home to request a booking (Pre-confirmation)
  const handleRequestBooking = (newAppointment: Appointment) => {
    // Agregar nueva cita al estado local
    setAppointments(prev => [...prev, newAppointment]);
  };

  // Function called by Dashboard to confirm a booking
  const handleConfirmBooking = async (id: string): Promise<boolean> => {
    try {
      // Actualizar en el backend
      const response = await appointmentsApi.update(id, { status: 'confirmed' });

      if (response.success) {
        // Buscar la cita para obtener datos del email
        const appointment = appointments.find(apt => apt.id === id);

        // Actualizar estado local
        console.log('[DEBUG] Confirming booking with ID:', id);
        setAppointments(prev => {
          return prev.map(apt => {
            if (apt.id === id) {
              return { ...apt, status: 'confirmed', colorClass: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
            }
            return apt;
          });
        });

        // 📧 ENVIAR EMAIL DE CONFIRMACIÓN CON EMAILJS
        // Hacemos esto sin await para no bloquear la UI, o con await si queremos asegurar el envío
        // El usuario prefiere feedback rápido, pero asegura que se envíe.
        if (appointment && appointment.email) {
          try {
            // No hacemos await crítico aquí para retornar true rápido, pero EmailJS es rápido.
            // Para asegurar la secuencia correcta descrita por el usuario, mantendremos la llamada async.
            luchafitEmail.sendAppointmentConfirmed({
              to_email: appointment.email,
              client_name: appointment.clientName,
              service: appointment.type,
              date: appointment.date,
              time: `${appointment.startTime} hs`,
            }).then(() => {
              console.log('%c[EmailJS] ✅ Email de confirmación enviado', 'color: green; font-weight: bold');
            }).catch(emailError => {
              console.error('%c[EmailJS] ⚠️ Error al enviar email de confirmación (background):', 'color: orange; font-weight: bold', emailError);
            });
          } catch (e) {
            console.error(e);
          }
        }
        return true;
      } else {
        console.error('Error al confirmar turno:', response.error);
        alert('Error al confirmar el turno');
        return false;
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
      return false;
    }
  };

  // Function called by Dashboard to reject/cancel booking
  const handleRejectBooking = async (id: string) => {
    try {
      // Buscar la cita para obtener datos
      const appointment = appointments.find(apt => apt.id === id);

      // 📱 ABRIR WHATSAPP PRIMERO
      if (appointment && appointment.phone) {
        const message = whatsappMessages.rejection(
          appointment.clientName,
          appointment.date,
          appointment.startTime,
          appointment.type
        );
        const whatsappUrl = generateWhatsAppLink(appointment.phone, message);

        console.log('%c[WhatsApp] Abriendo WhatsApp para rechazo...', 'color: green; font-weight: bold');
        window.open(whatsappUrl, '_blank');
      }

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
    // Buscar la cita para obtener datos
    const appointment = appointments.find(apt => apt.id === id);

    // 📱 ABRIR WHATSAPP PRIMERO
    if (appointment && appointment.phone) {
      const message = whatsappMessages.reschedule(
        appointment.clientName,
        appointment.date,
        appointment.startTime,
        appointment.type
      );
      const whatsappUrl = generateWhatsAppLink(appointment.phone, message);

      console.log('%c[WhatsApp] Abriendo WhatsApp para reprogramación...', 'color: green; font-weight: bold');
      window.open(whatsappUrl, '_blank');
    }

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
  const handleGoToReports = (client: Client | null, mode: 'new' | 'details') => {
    if (client) {
      setSelectedClientForReports(client);
      setReportViewMode(mode);
      setCurrentPage('reports');
    } else {
      // If client doesn't exist, go to Reports List
      console.warn("Client not provided, redirecting to Reports List");
      setSelectedClientForReports(null);
      setReportViewMode('list');
      setCurrentPage('reports');
    }
  };

  const handleRegisterPatient = (name?: string, email?: string) => {
    setClientNavState({ mode: 'create', data: { name, email } });
    setCurrentPage('clients');
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
    <div className="flex h-[100dvh] w-full bg-background-light dark:bg-background-dark text-text-dark dark:text-gray-100 overflow-hidden font-display">
      {/* Sidebar - Desktop */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={navigateTo}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 pt-[calc(1rem+env(safe-area-inset-top))] bg-surface-light dark:bg-surface-dark border-b border-input-border dark:border-gray-800 z-50 sticky top-0 shrink-0">
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
              onRejectBooking={handleRejectBooking} // Fix: Pass this prop!
              onRescheduleBooking={handleRescheduleBooking}
              onGoToReports={handleGoToReports}
              onRegisterPatient={handleRegisterPatient}
            />
          )}
          {currentPage === 'clients' && <Clients startMode={clientNavState.mode} startData={clientNavState.data} />}
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