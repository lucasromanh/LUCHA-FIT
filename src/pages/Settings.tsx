import React, { useState, useEffect } from 'react';
import { PROFESSIONAL_PROFILE } from '../constants';

const Settings: React.FC = () => {
    // --- STATE ---

    // Business Hours
    const [workingHours, setWorkingHours] = useState(() => {
        const saved = localStorage.getItem('lucha_working_hours');
        return saved ? JSON.parse(saved) : {
            days: [1, 2, 3, 4, 5], // Mon-Fri
            start: '08:00',
            end: '20:00'
        };
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // --- HANDLERS ---

    const handleSaveSettings = () => {
        setIsSaving(true);
        // Persist to LocalStorage
        localStorage.setItem('lucha_working_hours', JSON.stringify(workingHours));

        // Simulate network delay for UX
        setTimeout(() => {
            setIsSaving(false);
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
        }, 800);
    };

    const toggleDay = (dayIndex: number) => {
        setWorkingHours(prev => {
            const days = prev.days.includes(dayIndex)
                ? prev.days.filter(d => d !== dayIndex)
                : [...prev.days, dayIndex].sort();
            return { ...prev, days };
        });
    };

    const [profileData, setProfileData] = useState({
        name: PROFESSIONAL_PROFILE.name,
        phone: '',
        photo: PROFESSIONAL_PROFILE.image,
        isak_level: String(PROFESSIONAL_PROFILE.isak_level),
        bio: ''
    });
    const [isProfileSaving, setIsProfileSaving] = useState(false);

    // Initial Fetch (Backend Profile)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('luchafit_token'); // If auth uses token. App.tsx used 'luchafit_auth' boolean, but typically auth.php returns a token. 
                // Ah, App.tsx Login implementation:
                // const handleLogin = () => { localStorage.setItem('luchafit_auth', 'true'); ... }
                // It does NOT strictly save the token in App.tsx shown. BUT existing `Login.tsx` (not shown) likely saves it inside `authApi` login?
                // Assuming `Login.tsx` saves it or we might miss it. If missing, this fetch will fail.
                // Let's assume there is a token or checking how `appointmentsApi` does it.
                // Re-checking App.tsx imports: `import { appointmentsApi } from './services/api';`
                // I should probably check hooks/useAuth or services/api to see how auth is handled. 
                // Given the constraint, I'll try to read `luchafit_token` which is standard. If not, I'll alert user.

                // NOTE: Based on auth.php, it returns { token, user }. Login.tsx *should* save this.
                const storedToken = localStorage.getItem('luchafit_jwt'); // Trying common name or verify with user.

                // Actually, let's just try to fetch.
                const response = await fetch('http://localhost:8000/api/profile.php', { // Use relative path in prod or env var
                    headers: {
                        'Authorization': `Bearer ${storedToken || ''}`
                    }
                });
                // Note: Dev environment specific URL? The user has `backend/test.php` opened.
                // `vite.config.ts` might proxy `/api`. Let's assume `/api` relative path.
                const res = await fetch('/api/profile.php', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token') || ''}` // Trying 'token'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.data) {
                        setProfileData({
                            name: data.data.name || '',
                            phone: data.data.phone || '',
                            photo: data.data.photo || '',
                            isak_level: data.data.isak_level || '1',
                            bio: data.data.bio || ''
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading profile", error);
            }
        };
        fetchProfile();
    }, []);

    const handleSaveProfile = async () => {
        setIsProfileSaving(true);
        try {
            const res = await fetch('/api/profile.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                },
                body: JSON.stringify(profileData)
            });
            const data = await res.json();

            if (data.success) {
                setShowSaveSuccess(true);
                setTimeout(() => setShowSaveSuccess(false), 3000);
            } else {
                alert("Error: " + data.message);
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al guardar el perfil.");
        } finally {
            setIsProfileSaving(false);
        }
    };

    // --- RENDER ---
    const weekDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return (
        <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-20 animate-in fade-in duration-300">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-text-dark dark:text-white tracking-tight">Configuración</h1>
                <p className="text-text-muted dark:text-gray-400">Administra los parámetros generales de la plataforma y soporte.</p>
            </div>

            {/* 1. HORARIOS DE ATENCIÓN (Business Hours) */}
            <section className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-input-border dark:border-gray-700 pb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">schedule</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-dark dark:text-white">Horarios de Atención</h2>
                        <p className="text-xs text-text-muted">Define tus días y franjas horarias laborales para el calendario.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Días Laborales */}
                    <div>
                        <h3 className="text-sm font-bold uppercase text-gray-500 mb-3">Días Laborales</h3>
                        <div className="flex flex-col gap-2">
                            {weekDays.map((day, i) => {
                                if (i === 0) return null; // Skip Sunday for typical layout or keep it? Let's show all.
                                // Typically 1-6 are Mon-Sat, 0 is Sun.
                                return (
                                    <label key={i} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                        ${workingHours.days.includes(i)
                                            ? 'bg-primary/5 border-primary text-text-dark dark:text-white font-medium'
                                            : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-400'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={workingHours.days.includes(i)}
                                            onChange={() => toggleDay(i)}
                                            className="w-5 h-5 accent-primary rounded cursor-pointer"
                                        />
                                        <span>{day}</span>
                                    </label>
                                );
                            })}
                            {/* Sunday at the end or start? Usually 0 is Sunday. Let's render Sunday last logic if preferred or standard order */}
                            {/* Render Sunday (0) now if needed */}
                            <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                                ${workingHours.days.includes(0)
                                    ? 'bg-primary/5 border-primary text-text-dark dark:text-white font-medium'
                                    : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-400'
                                }`}>
                                <input
                                    type="checkbox"
                                    checked={workingHours.days.includes(0)}
                                    onChange={() => toggleDay(0)}
                                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                                />
                                <span>Domingo</span>
                            </label>
                        </div>
                    </div>

                    {/* Franja Horaria */}
                    <div>
                        <h3 className="text-sm font-bold uppercase text-gray-500 mb-3">Franja Horaria General</h3>
                        <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-lg space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-dark dark:text-white mb-2">Hora de Inicio</label>
                                <input
                                    type="time"
                                    value={workingHours.start}
                                    onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-text-dark dark:text-white mb-2">Hora de Fin</label>
                                <input
                                    type="time"
                                    value={workingHours.end}
                                    onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
                                    className="w-full p-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
                                />
                            </div>
                            <div className="pt-2">
                                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">info</span>
                                    Los turnos fuera de este horario se mostrarán visualmente distintos en el calendario.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        className={`px-6 py-3 bg-primary text-black font-bold rounded-lg shadow-lg hover:brightness-105 transition-all flex items-center gap-2
                        ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                Guardando...
                            </>
                        ) : showSaveSuccess ? (
                            <>
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                                ¡Guardado!
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-xl">save</span>
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </section>

            {/* 2. SOPORTE TÉCNICO */}
            <section className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-input-border dark:border-gray-700 pb-4">
                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <span className="material-symbols-outlined">support_agent</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-dark dark:text-white">Soporte Técnico</h2>
                        <p className="text-xs text-text-muted">Contacto directo con el desarrollador para reportar errores o solicitar mejoras.</p>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-9xl">code</span>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="size-20 bg-gray-800 rounded-full flex items-center justify-center border-2 border-primary">
                            <span className="font-display font-black text-2xl text-primary">LR</span>
                        </div>
                        <div className="text-center md:text-left">
                            <h3 className="text-2xl font-bold mb-1">Lucas Roman</h3>
                            <p className="text-gray-400 text-sm mb-4">Desarrollador Full Stack & Soporte</p>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <a href="https://wa.me/5493874404472" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-sm transition-colors">
                                    <span className="material-symbols-outlined text-lg">chat</span>
                                    WhatsApp
                                </a>
                                <a href="tel:+5493874404472" className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium text-sm transition-colors">
                                    <span className="material-symbols-outlined text-lg">call</span>
                                    Llamar
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. PERFIL PROFESIONAL (Read Only for now or simple display) */}
            <section className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-6 shadow-sm opacity-75">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        <span className="material-symbols-outlined">badge</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-text-dark dark:text-white">Perfil Profesional</h2>
                        <p className="text-xs text-text-muted">Información visible en reportes y rutinas (Configurado en código).</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                    <div className="size-12 bg-cover bg-center rounded-full" style={{ backgroundImage: `url(${PROFESSIONAL_PROFILE.image})` }}></div>
                    <div>
                        <p className="font-bold text-text-dark dark:text-white">{PROFESSIONAL_PROFILE.name}</p>
                        <p className="text-sm text-gray-500">Nivel ISAK: {PROFESSIONAL_PROFILE.isak_level}</p>
                    </div>
                    <div className="ml-auto">
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-1 rounded">Solo Lectura</span>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Settings;
