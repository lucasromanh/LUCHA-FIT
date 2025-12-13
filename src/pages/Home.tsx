import React, { useState, useMemo } from 'react';
import { Appointment } from '../types';
import { ASSETS } from '../constants';

interface HomeProps {
  onNavigate: (page: string) => void;
  existingAppointments?: Appointment[];
  onRequestBooking?: (appointment: Appointment) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate, existingAppointments = [], onRequestBooking }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    service: 'Evaluación Antropométrica',
    date: '',
    time: ''
  });

  const handleOpenModal = () => {
    setBookingStep('form');
    // Reset form on open
    setFormData({
      name: '',
      email: '',
      service: 'Evaluación Antropométrica',
      date: '',
      time: ''
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Helper to generate the next N available weekdays (Mon-Fri)
  const availableDates = useMemo(() => {
    const dates = [];
    let d = new Date();
    let count = 0;

    // Generate next 12 valid days
    while (count < 12) {
      const day = d.getDay();
      // 0 = Sunday, 6 = Saturday
      if (day !== 0 && day !== 6) {
        // Create a string YYYY-MM-DD for value
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateDay = String(d.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dateDay}`;

        dates.push({
          value: dateStr,
          dateObj: new Date(d),
          labelDay: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
          labelDate: d.getDate(),
          labelMonth: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
        });
        count++;
      }
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }, []);

  const handleDateSelect = (dateValue: string) => {
    setFormData(prev => ({ ...prev, date: dateValue, time: '' }));
  };

  // Defined Time Slots
  const baseSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00'
  ];

  const getSlotStatus = (slot: string) => {
    if (!formData.date) return { disabled: true, reason: 'no_date' };

    const selectedDateStr = formData.date; // YYYY-MM-DD
    const selectedDate = new Date(selectedDateStr + 'T00:00:00');
    const today = new Date();
    const isToday = selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear();

    // Check Past Hours if Today
    if (isToday) {
      const currentHour = today.getHours();
      const slotHour = parseInt(slot.split(':')[0], 10);
      if (slotHour <= currentHour) return { disabled: true, reason: 'past' };
    }

    // Check Taken Slots
    const isTaken = existingAppointments.some(apt => {
      let dateMatch = false;
      if (apt.rawDate === selectedDateStr) dateMatch = true;
      // Basic fallback if rawDate missing
      if (!apt.rawDate && apt.date.includes(selectedDateStr.split('-')[2])) {
        // This is a weak check for demo data, in production use strict ISO dates
      }
      return dateMatch && apt.startTime === slot;
    });

    if (isTaken) return { disabled: true, reason: 'taken' };

    return { disabled: false, reason: 'available' };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.time || !formData.date) return;

    setIsLoading(true);

    // Create appointment object
    const newAppointment: Appointment = {
      id: Math.random().toString(36).substr(2, 9),
      clientName: formData.name,
      email: formData.email,
      type: formData.service,
      date: new Date(formData.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
      rawDate: formData.date,
      startTime: formData.time,
      endTime: `${parseInt(formData.time.split(':')[0]) + 1}:00`,
      status: 'pending_approval',
      colorClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
    };

    // Simulate Network Request
    setTimeout(() => {
      // Add to global state
      if (onRequestBooking) onRequestBooking(newAppointment);

      setIsLoading(false);
      setBookingStep('success');
    }, 1000);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMobileNav = (id: string) => {
    setIsMobileMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-background-light dark:bg-background-dark text-text-dark dark:text-gray-100 font-display transition-colors duration-200">

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-input-border dark:border-gray-700 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-6 border-b border-input-border dark:border-gray-700 flex justify-between items-center bg-background-light dark:bg-black/20 shrink-0">
              <h3 className="text-xl font-bold text-text-dark dark:text-white">
                {bookingStep === 'form' ? 'Agendar Cita' : 'Solicitud Enviada'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-text-dark dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              {bookingStep === 'form' ? (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-text-muted mb-1">Nombre Completo</label>
                      <input
                        required
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Ej. Juan Pérez"
                        className="w-full rounded-lg border border-input-border bg-white dark:bg-[#102216] dark:border-gray-700 dark:text-white h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-text-muted mb-1">Correo Electrónico</label>
                      <input
                        required
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        type="email"
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full rounded-lg border border-input-border bg-white dark:bg-[#102216] dark:border-gray-700 dark:text-white h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-text-muted mb-1">Servicio</label>
                    <select
                      name="service"
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-input-border bg-white dark:bg-[#102216] dark:border-gray-700 dark:text-white h-11 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option>Evaluación Antropométrica</option>
                      <option>Consulta Nutricional</option>
                      <option>Plan de Entrenamiento</option>
                      <option>Pack Completo</option>
                    </select>
                  </div>

                  {/* Date Selection Grid */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-text-muted mb-2">Selecciona un Día</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {availableDates.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => handleDateSelect(item.value)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-16
                              ${formData.date === item.value
                              ? 'bg-primary border-primary text-black shadow-md scale-105'
                              : 'bg-white dark:bg-white/5 border-input-border dark:border-gray-600 text-text-dark dark:text-gray-300 hover:border-primary hover:text-primary'}
                            `}
                        >
                          <span className="text-[10px] uppercase font-bold opacity-70">{item.labelDay}</span>
                          <span className="text-lg font-black leading-none">{item.labelDate}</span>
                          <span className="text-[9px] font-medium opacity-60">{item.labelMonth}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {formData.date && (
                    <div className="animate-in fade-in slide-in-from-top-2 border-t border-dashed border-input-border dark:border-gray-700 pt-4">
                      <label className="block text-xs font-bold uppercase text-text-muted mb-2">
                        Horarios Disponibles
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {baseSlots.map(slot => {
                          const status = getSlotStatus(slot);
                          const isSelected = formData.time === slot;
                          const isAvailable = !status.disabled;

                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={status.disabled}
                              onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                              className={`py-2 px-1 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-1
                                            ${isSelected
                                  ? 'bg-primary border-primary text-black shadow-md scale-105 font-bold'
                                  : ''}
                                            ${isAvailable && !isSelected
                                  ? 'bg-white dark:bg-white/5 border-input-border dark:border-gray-600 text-text-dark dark:text-white hover:border-primary hover:text-primary'
                                  : ''}
                                            ${status.disabled
                                  ? 'bg-gray-100 dark:bg-white/5 border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-70'
                                  : ''}
                                        `}
                            >
                              <span className={`material-symbols-outlined text-[16px] hidden sm:block ${isSelected ? '' : ''}`}>schedule</span>
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      {baseSlots.every(slot => getSlotStatus(slot).disabled) && (
                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-xs rounded-lg flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-base">event_busy</span>
                          No quedan turnos disponibles para hoy.
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 flex gap-3 mt-auto">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 rounded-lg h-12 border border-input-border dark:border-gray-600 text-text-dark dark:text-white font-bold text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !formData.date || !formData.time}
                      className="flex-1 rounded-lg h-12 bg-primary text-text-dark font-bold text-sm hover:brightness-105 active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      ) : (
                        <>
                          <span>Confirmar</span>
                          <span className="material-symbols-outlined text-lg">check_circle</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="size-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-2 animate-in zoom-in duration-300">
                    <span className="material-symbols-outlined text-5xl">pending_actions</span>
                  </div>
                  <h4 className="text-2xl font-black text-text-dark dark:text-white">¡Solicitud Recibida!</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Tu turno ha sido pre-seleccionado. El Dr. Lucha revisará la disponibilidad y recibirás un mail de confirmación en <span className="font-bold text-text-dark dark:text-white">{formData.email}</span> cuando sea aprobado.
                  </p>

                  <div className="w-full bg-[#f8fcf9] dark:bg-white/5 rounded-xl p-4 border border-input-border dark:border-gray-700 mt-2">
                    <p className="text-xs font-bold uppercase text-text-muted mb-2">Detalles Solicitados</p>
                    <p className="font-bold text-lg text-text-dark dark:text-white">{formData.service}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {new Date(formData.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} • {formData.time} hs
                    </p>
                  </div>

                  <p className="text-xs text-gray-400 mt-2 italic">
                    Nota: Este horario ya no aparecerá disponible para otros usuarios mientras revisamos tu solicitud.
                  </p>

                  <button
                    onClick={handleCloseModal}
                    className="text-primary font-bold text-sm mt-4 hover:underline"
                  >
                    Entendido, cerrar ventana
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="layout-container flex w-full flex-col">
        <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e7f3eb] dark:border-b-[#1f3526] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm px-4 lg:px-40 py-3">
          <div className="flex items-center gap-4 text-text-dark dark:text-white">
            <img src={ASSETS.logo} alt="LUCHA-FIT" className="h-20 w-auto object-contain" />
          </div>
          <div className="hidden md:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <button onClick={() => scrollToSection('home')} className="text-text-dark dark:text-gray-200 text-sm font-medium leading-normal hover:text-primary transition-colors">Inicio</button>
              <button onClick={() => scrollToSection('services')} className="text-text-dark dark:text-gray-200 text-sm font-medium leading-normal hover:text-primary transition-colors">Servicios</button>
              <button onClick={() => scrollToSection('methodology')} className="text-text-dark dark:text-gray-200 text-sm font-medium leading-normal hover:text-primary transition-colors">Metodología</button>
              <button onClick={() => scrollToSection('contact')} className="text-text-dark dark:text-gray-200 text-sm font-medium leading-normal hover:text-primary transition-colors">Contacto</button>
            </div>
            <button
              onClick={() => onNavigate('login')}
              className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-text-dark hover:bg-opacity-90 transition-opacity text-sm font-bold leading-normal tracking-[0.015em]"
            >
              <span className="truncate">Acceso Profesional</span>
            </button>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-text-dark dark:text-white p-2"
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed top-[65px] left-0 w-full h-[calc(100vh-65px)] bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl z-40 flex flex-col p-6 gap-4 md:hidden animate-in slide-in-from-top-5 fade-in duration-200 overflow-y-auto">
            <button onClick={() => handleMobileNav('home')} className="text-xl font-bold text-text-dark dark:text-white py-4 border-b border-gray-200 dark:border-gray-800 text-left flex items-center justify-between group">
              Inicio
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">arrow_forward</span>
            </button>
            <button onClick={() => handleMobileNav('services')} className="text-xl font-bold text-text-dark dark:text-white py-4 border-b border-gray-200 dark:border-gray-800 text-left flex items-center justify-between group">
              Servicios
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">arrow_forward</span>
            </button>
            <button onClick={() => handleMobileNav('methodology')} className="text-xl font-bold text-text-dark dark:text-white py-4 border-b border-gray-200 dark:border-gray-800 text-left flex items-center justify-between group">
              Metodología
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">arrow_forward</span>
            </button>
            <button onClick={() => handleMobileNav('contact')} className="text-xl font-bold text-text-dark dark:text-white py-4 border-b border-gray-200 dark:border-gray-800 text-left flex items-center justify-between group">
              Contacto
              <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">arrow_forward</span>
            </button>

            <button
              onClick={() => onNavigate('login')}
              className="mt-6 w-full h-14 bg-primary text-text-dark font-bold text-lg rounded-xl shadow-lg flex items-center justify-center gap-2 hover:brightness-105 transition-all"
            >
              <span className="material-symbols-outlined">login</span>
              Acceso Profesional
            </button>
          </div>
        )}
      </div>

      <div id="home" className="layout-container flex flex-col w-full">
        <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="@container">
              <div className="flex flex-col gap-6 py-10 @[864px]:flex-row @[864px]:items-center">
                <div className="flex flex-col gap-6 @[480px]:min-w-[400px] @[480px]:gap-8 flex-1">
                  <div className="flex flex-col gap-2 text-left">
                    <h1 className="text-text-dark dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] @[480px]:text-5xl @[480px]:leading-tight">
                      Precisión Científica para tu <span className="text-primary">Mejor Físico</span>
                    </h1>
                    <h2 className="text-text-dark dark:text-gray-300 text-sm font-normal leading-normal @[480px]:text-base">
                      Antropometría profesional, dietas personalizadas y planes de entrenamiento basados en tus datos biométricos reales.
                    </h2>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={handleOpenModal}
                      className="flex min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-8 bg-primary text-text-dark text-lg font-bold leading-normal tracking-[0.015em] hover:brightness-105 hover:scale-105 transition-all shadow-xl shadow-primary/30"
                    >
                      <span className="truncate">Solicita Turno</span>
                      <span className="material-symbols-outlined ml-2">calendar_month</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-background-light dark:border-background-dark bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBAl6R8JqY3yzsLgF7zGYW7hMpYFuVO6Ir7yDTpNJ80U64DwtwnaRspGuKEUc48HdXXorMJpKTJkwHJH9jGJW-aSMob1CYaeXwwC4fL3K1I_faIRVFtv8Ihy4HWhdvodDV-UxCDElTnHQMRCVs0UbRY3Lt-fwAG0PXNDRcSA265LfS2-K1qHXcQ9mmyasrFHRThFT7lUz_5q2XHfoc-JF8EB-aJSJg3OD9nl4xmF2uPDEqcSkCKGlYLnbf2_OZfksvCqOBYYuXkkMk')" }}></div>
                      <div className="w-8 h-8 rounded-full border-2 border-background-light dark:border-background-dark bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAyXCJBOe92ZdzIiHOJ0fTQzbVnX77jjFqnAncyJAWJCTYO7VEhBM5ftrSQom7_1lfccA88zN6_FDgyAJXrTIjpFI80UWNMw7G5XFl7iHLme_FiFOie8IMTPRclxasAmCmLGTfE2SZZ3BjJ47pHrDZEfoGUFcA_VilAc3fkQsOIfQINnGF-nmkkoS10W7h1EDIf36qCokAFGn_lpMnn-f1i1pEVpE7QZ6QBNx_3mbH-UbJ6O1ZUJ6oK_1nzlWo7CCq--cA8eqjXP2c')" }}></div>
                      <div className="w-8 h-8 rounded-full border-2 border-background-light dark:border-background-dark bg-gray-200 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB0qcg_rPbAsw9lJRpSAA392sMKX_lKBqI38FtAvO3d6h_7r3SqtMnAbWojyyH8QVljcu4GcGppR8ggzCSMcDE1Vb4NHk3rcS7B5jZCLRIOnwH3bCr4rarYrHnVPKg_N8ObFe1H0Rzbh94vv72aFFGd9MrP3nfXaQLyg2GDUVv-TIgfB9KP3kN30k2Obil69q46KM_NdnC0HFHnKlgxHz9icunNUhDDIUJ_tWHWxky8doKSfCzS7YqLMDOKED_Fo-o0D4CpHnRmA_k')" }}></div>
                    </div>
                    <p className="text-xs font-medium text-text-dark dark:text-gray-400">+150 atletas optimizados</p>
                  </div>
                </div>
                <div
                  className="w-full flex-1 aspect-square max-h-[500px] bg-center bg-no-repeat bg-cover rounded-2xl shadow-xl overflow-hidden relative group"
                  style={{ backgroundImage: "url('/lucha2.jpg')" }}
                >
                  <div className="absolute inset-0 bg-black/10 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div className="bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-md p-4 rounded-xl shadow-lg border-l-4 border-primary">
                      <p className="text-sm font-bold text-text-dark dark:text-white">Análisis Corporal Completo</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Datos precisos = Resultados reales</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="services" className="w-full bg-surface-light dark:bg-surface-dark py-12">
        <div className="layout-container flex flex-col w-full">
          <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex flex-col gap-10 @container">
                <div className="flex flex-col gap-4 text-center items-center">
                  <h2 className="text-primary text-sm font-bold tracking-wider uppercase">Nuestros Servicios</h2>
                  <h3 className="text-text-dark dark:text-white text-3xl md:text-4xl font-black leading-tight max-w-[720px]">
                    Todo lo que necesitas para tu evolución
                  </h3>
                  <p className="text-text-dark dark:text-gray-300 text-base font-normal leading-normal max-w-[600px]">
                    Combinamos ciencia y deporte para optimizar tu rendimiento a través de datos precisos y seguimiento profesional.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { title: 'Seguimiento', desc: 'Monitoreo constante de tu evolución mes a mes.', icon: 'monitoring', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc_boD6oJbTCKOVWCMJzGU-PxyP_WXYvIsc_uZ3lrePWd140zUuxJhc_y3Z_5WTBpj18n_vhJmrje5tOLoPMhjgRhgtha0zA0nq79U_HzewZIkbei2nBgVM203_5hHawUbalmWaNOSV--yh2LqXMY-Wd0iWRdu0qbeylQ7OqOStJitBQdOw-0g-ERhE8wV4-J9iZGB0CbxtV9I6ABewzRJmZigNaw_NrzISQ-9n-Z3_Vm9FOv1Nh80BzF99Gee5OjZufB10xpdKvE' },
                    { title: 'Rutinas', desc: 'Entrenamientos adaptados a tu estructura muscular.', icon: 'fitness_center', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPCBu09m9sV7rswLC-DnYDLM4lK7J82Ykc8FyhYfHn74492X0njfjvQH0OxF6EjvgNWfXyJdzj7fcHkMJ8v4e0iaoxH0yNN1HDsuEbBaV9YiJ1-mRJSoev7ssXxs7psFwsfQjQ8_6kQHh0xU1vxmerxjF7fAtgAlkN2UTAynnHW9-M3Z88dp6-BMIRu-uNZbLRGfpkt4vmH81sS5g6lJdcx0VdVeSEt4NkhM9EeRogC2PdE5R5PvsS6zJr1O2XZYwEtmtbKRVI4dY' },
                    { title: 'Nutrición', desc: 'Dietas basadas en tu gasto energético real.', icon: 'restaurant', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdG4NloIsSO0n3e8CmhVjPyHZ3aaTxWOx_u5Vp0Ru6_qSfUO4C7pI2TE3i0csCr0948u8DwguWS_ZZwVoIsxevTXqwnzGhheruCnsodNoPoO_Yl41X5X4ksE_aaRHwzuaHKTWU7VhFFDmjOon87JXzpr-U6sk_VtHP6S0L7LY4AESCWhjA1PpgZuHbioRKjF9mleFNx-XAawNKTPHDSngv5EaRoA0nVi7tMGKXxkFCN0uEJfgutgglEf8QiAS_LxVyyKTudkhPZXg' },
                    { title: 'Antropometría', desc: 'Análisis detallado de composición corporal.', icon: 'straighten', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCmHkYw1koVgWwxi1Hu_DYNqLtkG5fuCeHLlTqDsutUjZ5E-n6R7q6_GS5Snw_waAVTx3PgqC4PSqpTCfAhwHrNc_KU3s_Z-krHXTbNofWgRtyq0aTirB-QmbF0MBE0Vx45okABROpXDu_f5wCxCv3WCCsWhN6XqQx48QRcK4Vi2wc3WuzMR-xIO295QiC3vmR0IUO5plreVUkuIiRyj8XFf4nel6pnorWFOZuAMMu_oi8oHXOzPxLzC-ib3ZSNrKFMg3VR9lxsfvs' }
                  ].map((service, idx) => (
                    <div key={idx} className="flex flex-col gap-3 group cursor-pointer">
                      <div className="w-full aspect-[4/3] bg-center bg-no-repeat bg-cover rounded-lg overflow-hidden relative" style={{ backgroundImage: `url('${service.img}')` }}>
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                        <div className="absolute top-3 right-3 bg-white dark:bg-black rounded-full p-2 text-primary">
                          <span className="material-symbols-outlined text-[20px]">{service.icon}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-text-dark dark:text-white text-lg font-bold leading-normal group-hover:text-primary transition-colors">{service.title}</p>
                        <p className="text-text-muted dark:text-gray-400 text-sm font-normal leading-normal">{service.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="methodology" className="layout-container flex flex-col w-full py-16">
        <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div className="mb-10 text-center">
              <h2 className="text-text-dark dark:text-white text-3xl font-bold leading-tight tracking-[-0.015em]">Tu Camino al Éxito</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Nuestra metodología de 4 pasos probada en cientos de clientes.</p>
            </div>
            <div className="grid grid-cols-[40px_1fr] gap-x-4 px-4">
              {[
                { title: 'Medición Inicial', desc: 'Evaluación antropométrica completa (ISAK) para determinar % graso, masa muscular y estructura ósea.', icon: 'straighten' },
                { title: 'Análisis de Datos', desc: 'Procesamos tu información para entender tu metabolismo basal y requerimientos energéticos.', icon: 'analytics' },
                { title: 'Planificación Estratégica', desc: 'Diseño de dieta flexible y rutina de entrenamiento periodizada según tus objetivos.', icon: 'edit_note' },
                { title: 'Ejecución y Control', desc: 'Seguimiento mensual para ajustar macros y cargas de trabajo. ¡Resultados garantizados!', icon: 'published_with_changes', last: true }
              ].map((step, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex flex-col items-center gap-1 pt-1">
                    {!step.last && idx > 0 && <div className="w-[2px] bg-[#cfe7d7] dark:bg-gray-700 h-2"></div>}
                    <div className="bg-primary/20 p-2 rounded-full text-primary dark:text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">{step.icon}</span>
                    </div>
                    {!step.last && <div className="w-[2px] bg-[#cfe7d7] dark:bg-gray-700 h-full grow min-h-[40px]"></div>}
                  </div>
                  <div className={`flex flex-1 flex-col ${step.last ? 'pb-4' : 'pb-8'} pt-1`}>
                    <p className="text-text-dark dark:text-white text-lg font-bold leading-normal">{step.title}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">{step.desc}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full bg-surface-light dark:bg-surface-dark py-16">
        <div className="layout-container flex flex-col w-full">
          <div className="px-4 md:px-10 lg:px-40 flex flex-1 justify-center">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="text-center mb-12">
                <h2 className="text-text-dark dark:text-white text-3xl font-bold">Estudio Antropométrico Completo</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl mx-auto">Realizamos una evaluación exhaustiva de más de 25 variables corporales para construir tu perfil físico único y optimizar cada aspecto de tu progreso.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { title: 'Pliegues Cutáneos', desc: 'Medición de 8 pliegues (Tríceps, Subescapular, Bíceps, Cresta Ilíaca, Supraespinal, Abdominal, Muslo, Pantorrilla) para calcular con exactitud tu % de grasa y su distribución.', icon: 'straighten' },
                  { title: 'Perímetros Musculares', desc: 'Análisis de 10 circunferencias corporales (Brazo relajado/contraído, Cintura, Cadera, Muslo, etc.) para monitorear la hipertrofia y los cambios estructurales.', icon: 'architecture' },
                  { title: 'Diámetros Óseos', desc: 'Evaluación del esqueleto (Biestiloideo, Biepicondíleo de húmero y fémur) para determinar tu complexión ósea y límites naturales de masa muscular.', icon: 'accessibility_new' },
                  { title: 'Composición Corporal', desc: 'Desglose total de tu peso en: Masa Grasa, Masa Muscular, Masa Ósea, Masa Residual y Piel. Mucho más preciso que las básculas convencionales.', icon: 'donut_large' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-6 bg-background-light dark:bg-background-dark rounded-xl border border-[#e7f3eb] dark:border-[#1f3526]">
                    <div className="shrink-0 bg-primary/20 w-12 h-12 rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-dark dark:text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-10 p-6 bg-[#0d1b12] rounded-xl flex flex-col md:flex-row items-center justify-between gap-6 text-white shadow-xl shadow-primary/10 border-l-4 border-primary">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary text-4xl">verified</span>
                  <div>
                    <p className="font-bold text-lg">Certificación ISAK</p>
                    <p className="text-sm text-gray-400">Mediciones estandarizadas internacionalmente</p>
                  </div>
                </div>
                <div className="h-px w-full md:h-12 md:w-px bg-gray-700"></div>
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary text-4xl">description</span>
                  <div>
                    <p className="font-bold text-lg">Informe PDF Detallado</p>
                    <p className="text-sm text-gray-400">Recibes un reporte completo de 15 páginas</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full py-20 px-4">
        <div className="max-w-[960px] mx-auto bg-primary rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl shadow-primary/30">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCW1Ie1bf4kFrgVWpNFm9Ng-G56L-eFmnBJ-Piti1IdDcNmPvaGz8Q5D1tIw0chCcSR4Klh_LHrHyIcoK03TbVlYKZd_-HyNben1ywZii1ASFn6MzqAsHSNrE0Q6l3tfKD909l3hSuUCaYuxymhDdnfOHSj1Ms4kcny4NCzmyM72G1ehiRVb51SdIbaAWXVt9M3Q3xz2lEDgSvIXPgbGtSH9oy0ADeIShUccTMj3yb4mE6u-8DcQbDjMsgFJYLLixnRBwbaG_FI-vU')" }}></div>
          <div className="relative z-10 flex-1">
            <h2 className="text-text-dark text-3xl md:text-4xl font-black leading-tight mb-2">¿Listo para medir tu progreso?</h2>
            <p className="text-text-dark/80 font-medium">Agenda tu primera cita de evaluación hoy mismo y recibe un 10% de descuento.</p>
          </div>
          <div className="relative z-10">
            <button
              onClick={handleOpenModal}
              className="bg-[#0d1b12] text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform flex items-center gap-2"
            >
              Agendar Cita
              <span className="material-symbols-outlined">calendar_month</span>
            </button>
          </div>
        </div>
      </div>

      <footer id="contact" className="bg-background-light dark:bg-background-dark border-t border-[#e7f3eb] dark:border-gray-800 pt-16 pb-8">
        <div className="layout-container flex flex-col w-full">
          <div className="px-4 md:px-10 lg:px-40">
            <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 text-text-dark dark:text-white mb-4">
                  <img src={ASSETS.logo} alt="LUCHA-FIT" className="h-16 w-auto object-contain" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
                  Especialistas en antropometría y rendimiento deportivo. Transformamos datos en resultados visibles.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-text-dark dark:text-white mb-4">Servicios</h4>
                <ul className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <li><a className="hover:text-primary transition-colors" href="#">Antropometría</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Nutrición Deportiva</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Entrenamiento Personal</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">Planes Online</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-text-dark dark:text-white mb-4">Contacto</h4>
                <ul className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    contacto@luchafit.com
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">call</span>
                    +123 456 7890
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    Centro Deportivo, Ciudad
                  </li>
                </ul>
              </div>
            </div>
            <div className="max-w-[960px] mx-auto border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-xs text-gray-400">© 2023 LUCHA-FIT. Todos los derechos reservados.</p>
              <div className="flex gap-4">
                <a className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
              </div>
            </div>
          </div>
        </div>
      </footer>
      <a aria-label="Contactar por WhatsApp" className="fixed bottom-6 right-6 z-[100] flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-xl hover:scale-110 hover:shadow-2xl transition-all duration-300 group" href="https://wa.me/1234567890" target="_blank">
        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"></path>
        </svg>
      </a>
    </div>
  );
};

export default Home;