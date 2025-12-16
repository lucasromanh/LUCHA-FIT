import React from 'react';
import { PROFESSIONAL_PROFILE } from '../constants';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'clients', label: 'Pacientes', icon: 'group' },
    { id: 'calendar', label: 'Calendario', icon: 'calendar_month' },
    { id: 'reports', label: 'Mediciones', icon: 'show_chart' },
    { id: 'routines', label: 'Rutinas', icon: 'fitness_center' },
    { id: 'settings', label: 'Configuración', icon: 'settings' },
  ];

  // State for dynamic profile
  const [profile, setProfile] = React.useState({
    name: PROFESSIONAL_PROFILE.name,
    photo: PROFESSIONAL_PROFILE.image,
    isak_level: String(PROFESSIONAL_PROFILE.isak_level)
  });

  // Reverted: No longer fetching from API to prevent blocking/errors as requested.
  // Profile data is static constant to ensure stability.

  return (
    <aside className="hidden lg:flex w-64 flex-col h-full bg-surface-light dark:bg-surface-dark border-r border-input-border dark:border-gray-800 flex-shrink-0">
      {/* Brand */}
      <div className="p-6 border-b border-input-border dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary flex items-center justify-center text-text-dark font-bold text-xl shrink-0">
            LF
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-dark dark:text-white text-lg font-bold leading-tight tracking-tight">LUCHA-FIT</h1>
            <p className="text-text-muted dark:text-gray-400 text-xs font-medium">Panel Profesional</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg group transition-colors w-full text-left
              ${currentPage === item.id
                ? 'bg-[#e7f3eb] dark:bg-primary/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-text-dark dark:hover:text-white hover:bg-[#e7f3eb] dark:hover:bg-primary/10'
              }`}
          >
            <span className={`material-symbols-outlined ${currentPage === item.id ? 'text-text-dark dark:text-primary' : 'group-hover:text-text-dark dark:group-hover:text-white'}`}>
              {item.icon}
            </span>
            <span className={`text-sm font-medium ${currentPage === item.id ? 'text-text-dark dark:text-white' : ''}`}>
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-input-border dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="size-10 rounded-full bg-cover bg-center border-2 border-primary"
            style={{ backgroundImage: `url('${profile.photo}')` }}
          ></div>
          <div className="flex flex-col overflow-hidden">
            <p className="text-sm font-bold text-text-dark dark:text-white truncate" title={profile.name}>{profile.name}</p>
            <p className="text-xs text-text-muted dark:text-gray-400 truncate">ISAK Nivel {profile.isak_level}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg h-10 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-text-dark dark:text-white text-sm font-bold transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">logout</span>
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;