import React, { useState, useEffect } from 'react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: {
    clientName: string;
    email?: string;
    type: string;
    date: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) => void;
  initialDate?: Date;
  initialTime?: string;
}

const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialDate,
  initialTime,
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    type: 'Evaluación Inicial',
    date: '',
    startTime: '',
    endTime: '',
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Tipos de cita disponibles
  const appointmentTypes = [
    'Evaluación Inicial',
    'Control',
    'Medición Antropométrica',
    'Seguimiento',
    'Planificación Nutricional',
    'Grupal',
    'Otro',
  ];

  const [config, setConfig] = useState({ start: '08:00', end: '20:00', days: [1, 2, 3, 4, 5] });

  // Inicializar fecha y hora si se proporcionan
  useEffect(() => {
    if (isOpen) {
      // Load config
      const savedConfig = localStorage.getItem('lucha_working_hours');
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (e) {
          console.error("Error parsing working hours config");
        }
      }

      if (initialDate) {
        const year = initialDate.getFullYear();
        const month = String(initialDate.getMonth() + 1).padStart(2, '0');
        const day = String(initialDate.getDate()).padStart(2, '0');
        setFormData(prev => ({ ...prev, date: `${year}-${month}-${day}` }));
      }
      if (initialTime) {
        setFormData(prev => ({ ...prev, startTime: initialTime }));
      }
    } else {
      // Reset form cuando se cierra el modal
      setFormData({
        clientName: '',
        email: '',
        type: 'Evaluación Inicial',
        date: '',
        startTime: '',
        endTime: '',
        notes: '',
      });
      setErrors({});
    }
  }, [isOpen, initialDate, initialTime]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpiar error del campo cuando el usuario lo modifica
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Auto-calcular hora de fin (1 hora después del inicio)
    if (name === 'startTime' && value) {
      const [hours, minutes] = value.split(':').map(Number);
      const endHours = hours + 1;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, endTime }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'El nombre del paciente es obligatorio';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es obligatoria';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'La hora de inicio es obligatoria';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'La hora de fin es obligatoria';
    }

    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'La hora de fin debe ser posterior a la hora de inicio';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // --- BUSINESS HOURS VALIDATION ---
    if (formData.date && formData.startTime && formData.endTime) {
      // 1. Check Day
      // Create date object (append T00:00:00 to avoid UTC shifts if using simple date string)
      const dateObj = new Date(formData.date + 'T00:00:00');
      const dayIndex = dateObj.getDay(); // 0 = Sun

      if (!config.days.includes(dayIndex)) {
        newErrors.date = 'Este día figura como no laborable en la configuración.';
      }

      // 2. Check Time
      // Simple string comparison works for HH:MM format (e.g. "09:00" > "08:00")
      if (formData.startTime < config.start || formData.endTime > config.end) {
        newErrors.startTime = `El horario de atención es de ${config.start} a ${config.end}.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSave(formData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-input-border dark:border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-input-border dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <span className="material-symbols-outlined">event_available</span>
            </div>
            <h3 className="text-xl font-bold text-text-dark dark:text-white">Agendar Nuevo Turno</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nombre del Paciente */}
          <div>
            <label htmlFor="clientName" className="block text-sm font-bold text-text-dark dark:text-white mb-2">
              Nombre del Paciente <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="clientName"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border ${errors.clientName ? 'border-red-500' : 'border-input-border dark:border-gray-700'
                } rounded-lg text-text-dark dark:text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              placeholder="Ej: Juan Pérez"
            />
            {errors.clientName && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.clientName}
              </p>
            )}
          </div>

          {/* Email (Opcional) */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-text-dark dark:text-white mb-2">
              Email (Opcional)
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border ${errors.email ? 'border-red-500' : 'border-input-border dark:border-gray-700'
                } rounded-lg text-text-dark dark:text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              placeholder="Ej: juan@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.email}
              </p>
            )}
          </div>

          {/* Tipo de Cita */}
          <div>
            <label htmlFor="type" className="block text-sm font-bold text-text-dark dark:text-white mb-2">
              Tipo de Cita <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border border-input-border dark:border-gray-700 rounded-lg text-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              {appointmentTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha y Horarios */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fecha */}
            <div>
              <label htmlFor="date" className="block text-sm font-bold text-text-dark dark:text-white mb-2">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border ${errors.date ? 'border-red-500' : 'border-input-border dark:border-gray-700'
                  } rounded-lg text-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.date}
                </p>
              )}
            </div>

            {/* Hora Inicio */}
            <div>
              <label htmlFor="startTime" className="block text-sm font-bold text-text-dark dark:text-white mb-2">
                Hora Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                min={config.start}
                max={config.end}
                className={`w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border ${errors.startTime ? 'border-red-500' : 'border-input-border dark:border-gray-700'
                  } rounded-lg text-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.startTime}
                </p>
              )}
            </div>

            {/* Hora Fin */}
            <div>
              <label htmlFor="endTime" className="block text-sm font-bold text-text-dark dark:text-white mb-2">
                Hora Fin <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                min={config.start}
                max={config.end}
                className={`w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border ${errors.endTime ? 'border-red-500' : 'border-input-border dark:border-gray-700'
                  } rounded-lg text-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all`}
              />
              {errors.endTime && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {errors.endTime}
                </p>
              )}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="notes" className="block text-sm font-bold text-text-dark dark:text-white mb-2">
              Notas (Opcional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-background-light dark:bg-background-dark border border-input-border dark:border-gray-700 rounded-lg text-text-dark dark:text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              placeholder="Observaciones adicionales..."
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-background-light dark:bg-background-dark border-t border-input-border dark:border-gray-700 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-text-dark dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium border border-input-border dark:border-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-primary text-text-dark font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">check</span>
            Agendar Turno
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
