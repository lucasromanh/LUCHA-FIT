import React, { useState } from 'react';
import { CLIENTS } from '../constants';
import { Client } from '../types';

const Clients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredClients = CLIENTS.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? client.status.toLowerCase() === filterStatus.toLowerCase() : true;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-col gap-8 flex h-full">
        {/* Page Heading & Actions */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl md:text-4xl font-black text-text-dark dark:text-white tracking-tight">Gestión de Clientes</h2>
            <p className="text-text-muted dark:text-gray-400 text-base font-normal max-w-xl">
              Visualiza y administra los datos antropométricos y el progreso de tus pacientes.
            </p>
          </div>
          <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark active:scale-95 transition-all text-black font-bold h-12 px-6 rounded-lg shadow-lg shadow-primary/20 whitespace-nowrap">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Nuevo Cliente</span>
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-text-muted dark:text-gray-400 text-sm font-medium">Total Clientes</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-md text-[20px]">groups</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-text-dark dark:text-white">124</span>
              <span className="text-sm font-semibold text-primary mb-1.5 flex items-center">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> 5%
              </span>
            </div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-text-muted dark:text-gray-400 text-sm font-medium">Planes Activos</p>
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-md text-[20px]">fitness_center</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-text-dark dark:text-white">85</span>
              <span className="text-sm font-semibold text-primary mb-1.5 flex items-center">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> 2%
              </span>
            </div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-text-muted dark:text-gray-400 text-sm font-medium">Revisiones Pendientes</p>
              <span className="material-symbols-outlined text-orange-500 bg-orange-500/10 p-1.5 rounded-md text-[20px]">pending_actions</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-text-dark dark:text-white">12</span>
              <span className="text-sm font-medium text-text-muted dark:text-gray-500 mb-1.5">esta semana</span>
            </div>
          </div>
          <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-gray-700 shadow-sm flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <p className="text-text-muted dark:text-gray-400 text-sm font-medium">Nuevos (Mes)</p>
              <span className="material-symbols-outlined text-blue-500 bg-blue-500/10 p-1.5 rounded-md text-[20px]">person_add</span>
            </div>
            <div className="flex items-end gap-2 mt-2">
              <span className="text-3xl font-bold text-text-dark dark:text-white">8</span>
              <span className="text-sm font-semibold text-primary mb-1.5 flex items-center">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> 10%
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Table Section */}
        <div className="flex flex-col bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          {/* Search Toolbar */}
          <div className="p-4 md:p-5 border-b border-input-border dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-surface-dark">
            <div className="relative w-full md:w-96 group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
              <input 
                className="w-full pl-10 pr-4 py-2.5 bg-background-light dark:bg-gray-800 border border-input-border dark:border-gray-700 rounded-lg text-sm text-text-dark dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" 
                placeholder="Buscar por nombre, email o ID..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <div className="relative w-full md:w-48">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">filter_list</span>
                <select 
                  className="w-full appearance-none pl-10 pr-8 py-2.5 bg-background-light dark:bg-gray-800 border border-input-border dark:border-gray-700 rounded-lg text-sm text-text-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Todos los Estados</option>
                  <option value="active">Activos</option>
                  <option value="inactive">Inactivos</option>
                  <option value="pending">Pendientes</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] pointer-events-none">expand_more</span>
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-input-border dark:border-gray-700 rounded-lg hover:bg-background-light dark:hover:bg-gray-800 transition-colors text-text-dark dark:text-white">
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span className="hidden sm:inline text-sm font-medium">Exportar</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fcf9] dark:bg-gray-800/50 border-b border-input-border dark:border-gray-700">
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Edad / Sexo</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Peso Actual</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Última Visita</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase text-text-muted dark:text-gray-400 tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-input-border dark:divide-gray-700">
                {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-background-light dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                        {client.image ? (
                            <div className="size-10 rounded-full bg-cover bg-center border border-gray-200" style={{ backgroundImage: `url('${client.image}')` }}></div>
                        ) : (
                            <div className="size-10 rounded-full bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-800 flex items-center justify-center text-primary font-bold text-lg">
                                {client.name.split(' ').map(n => n[0]).join('').substring(0,2)}
                            </div>
                        )}
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold text-text-dark dark:text-white">{client.name}</p>
                            <p className="text-xs text-text-muted dark:text-gray-500">ID: #{client.id}</p>
                        </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-dark dark:text-gray-300">{client.age} Años</div>
                        <div className="text-xs text-text-muted dark:text-gray-500">{client.gender}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-dark dark:text-white">{client.weight} kg</span>
                        {client.weightDiff !== 0 && (
                            <span className={`text-xs font-medium flex items-center px-1.5 py-0.5 rounded ${client.weightDiff < 0 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20'}`}>
                                {client.weightDiff > 0 ? '+' : ''}{client.weightDiff}kg
                            </span>
                        )}
                        {client.weightDiff === 0 && (
                            <span className="text-xs font-medium text-gray-500 flex items-center bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">--</span>
                        )}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-muted dark:text-gray-400">
                        {client.lastVisit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {client.status === 'Activo' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                <span className="size-1.5 rounded-full bg-green-500"></span> Activo
                            </span>
                        )}
                        {client.status === 'Pendiente' && (
                             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
                             <span className="size-1.5 rounded-full bg-yellow-500"></span> Pendiente
                         </span>
                        )}
                        {client.status === 'Inactivo' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                            <span className="size-1.5 rounded-full bg-gray-400"></span> Inactivo
                        </span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors" title="Ver Ficha">
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400 transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button className="p-1.5 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors" title="Eliminar">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                        </div>
                    </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-input-border dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-surface-dark">
            <span className="text-sm text-text-muted dark:text-gray-400">
                Mostrando <span className="font-medium text-text-dark dark:text-white">1</span> a <span className="font-medium text-text-dark dark:text-white">{filteredClients.length}</span> de <span className="font-medium text-text-dark dark:text-white">124</span> resultados
            </span>
            <div className="flex items-center gap-2">
              <button className="flex items-center justify-center p-2 rounded-lg border border-input-border dark:border-gray-700 hover:bg-background-light dark:hover:bg-gray-800 disabled:opacity-50 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg bg-primary text-black font-semibold text-sm">1</button>
              <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-gray-800 text-text-muted dark:text-gray-400 text-sm transition-colors">2</button>
              <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-gray-800 text-text-muted dark:text-gray-400 text-sm transition-colors">3</button>
              <span className="text-gray-400">...</span>
              <button className="min-w-[32px] h-8 flex items-center justify-center rounded-lg hover:bg-background-light dark:hover:bg-gray-800 text-text-muted dark:text-gray-400 text-sm transition-colors">12</button>
              <button className="flex items-center justify-center p-2 rounded-lg border border-input-border dark:border-gray-700 hover:bg-background-light dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Clients;
