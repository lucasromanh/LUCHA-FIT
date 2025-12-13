import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_DATA, CLIENTS } from '../constants';
import { Client } from '../types';

type ViewMode = 'list' | 'details' | 'new';

const Reports: React.FC = () => {
  const [view, setView] = useState<ViewMode>('list');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // --- CLIENT LIST LOGIC ---
  const filteredClients = useMemo(() => {
    if (!searchTerm) return CLIENTS;
    const lowerTerm = searchTerm.toLowerCase();
    return CLIENTS.filter(c => 
      c.name.toLowerCase().includes(lowerTerm) || 
      c.id.toLowerCase().includes(lowerTerm)
    );
  }, [searchTerm]);

  const handleSelectClientForReport = (client: Client) => {
    setSelectedClient(client);
    setView('details');
  };

  const handleSelectClientForNew = (client: Client) => {
    setSelectedClient(client);
    setView('new');
  };

  const handleBack = () => {
    setView('list');
    setSelectedClient(null);
  };

  // --- VIEW: CLIENT SELECTION LIST ---
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-8 animate-in fade-in duration-300">
        <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black text-text-dark dark:text-white tracking-tight">Mediciones y Seguimiento</h1>
            <p className="text-text-muted dark:text-gray-400">Selecciona un atleta para registrar una nueva medición o ver su evolución histórica.</p>
        </div>

        {/* Search Bar */}
        <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
            <input 
            type="text" 
            placeholder="Buscar atleta por nombre o ID..." 
            className="w-full pl-12 pr-4 h-14 bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl text-text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map(client => (
                <div key={client.id} className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all group flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        {client.image ? (
                            <div className="size-14 rounded-full bg-cover bg-center border-2 border-input-border dark:border-gray-600" style={{ backgroundImage: `url('${client.image}')` }}></div>
                        ) : (
                            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">
                                {client.name.substring(0,2).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-lg text-text-dark dark:text-white leading-tight">{client.name}</h3>
                            <p className="text-xs text-text-muted dark:text-gray-400 font-medium">ID: #{client.id}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                ${client.status === 'Activo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                                  client.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 
                                  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                {client.status}
                            </span>
                        </div>
                    </div>
                    
                    <div className="h-px bg-input-border dark:bg-gray-700 w-full"></div>

                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button 
                            onClick={() => handleSelectClientForNew(client)}
                            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-text-dark dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            Nueva Medición
                        </button>
                        <button 
                            onClick={() => handleSelectClientForReport(client)}
                            disabled={client.status === 'Pendiente'} // Example logic
                            className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-input-border dark:border-gray-600 text-text-dark dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                            Ver Progreso
                        </button>
                    </div>
                    {client.lastVisit && (
                        <p className="text-[10px] text-center text-gray-400 mt-1">
                            Última visita: {client.lastVisit}
                        </p>
                    )}
                </div>
            ))}
        </div>
      </div>
    );
  }

  // --- VIEW: NEW MEASUREMENT FORM ---
  if (view === 'new' && selectedClient) {
      return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-5 duration-300">
             {/* Header with Back Button */}
            <div className="flex items-center gap-4 border-b border-input-border dark:border-gray-700 pb-4">
                <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-black text-text-dark dark:text-white">Nueva Medición Antropométrica</h1>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                        <span>Paciente:</span>
                        <span className="font-bold text-text-dark dark:text-white">{selectedClient.name}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Column */}
                <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">straighten</span>
                        Datos Básicos
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase text-text-muted">Peso (kg)</label>
                            <input type="number" placeholder="0.0" className="w-full rounded-lg border border-input-border dark:border-gray-600 bg-background-light dark:bg-black/20 p-2.5 text-text-dark dark:text-white focus:ring-primary focus:border-primary" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase text-text-muted">Talla (cm)</label>
                            <input type="number" placeholder="0" className="w-full rounded-lg border border-input-border dark:border-gray-600 bg-background-light dark:bg-black/20 p-2.5 text-text-dark dark:text-white focus:ring-primary focus:border-primary" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase text-text-muted">Talla Sentado (cm)</label>
                            <input type="number" placeholder="0" className="w-full rounded-lg border border-input-border dark:border-gray-600 bg-background-light dark:bg-black/20 p-2.5 text-text-dark dark:text-white focus:ring-primary focus:border-primary" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-bold uppercase text-text-muted">Envergadura (cm)</label>
                            <input type="number" placeholder="0" className="w-full rounded-lg border border-input-border dark:border-gray-600 bg-background-light dark:bg-black/20 p-2.5 text-text-dark dark:text-white focus:ring-primary focus:border-primary" />
                        </div>
                    </div>

                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">pinch</span>
                        Pliegues Cutáneos (mm)
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        {['Tríceps', 'Subescapular', 'Bíceps', 'Cresta Ilíaca', 'Supraespinal', 'Abdominal', 'Muslo Medial', 'Pantorrilla'].map(site => (
                             <div key={site} className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold uppercase text-text-muted truncate" title={site}>{site}</label>
                                <input type="number" placeholder="0" className="w-full rounded-lg border border-input-border dark:border-gray-600 bg-background-light dark:bg-black/20 p-2 text-sm text-text-dark dark:text-white focus:ring-primary focus:border-primary" />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-input-border dark:border-gray-700">
                        <button onClick={handleBack} className="px-6 py-2.5 rounded-lg border border-input-border dark:border-gray-600 text-text-dark dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            Cancelar
                        </button>
                        <button className="px-6 py-2.5 rounded-lg bg-primary text-black font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                            Guardar Medición
                        </button>
                    </div>
                </div>

                {/* Info Column */}
                <div className="flex flex-col gap-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined">info</span>
                            Protocolo ISAK
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                            Recuerda realizar las mediciones en el lado derecho del cuerpo, independientemente de la lateralidad del sujeto. Asegúrate de que la piel esté seca y libre de lociones.
                        </p>
                    </div>
                    
                    <div className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-5 shadow-sm">
                         <h4 className="font-bold text-text-dark dark:text-white mb-4">Historial Reciente</h4>
                         <div className="flex flex-col gap-3 relative">
                            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-input-border dark:bg-gray-700"></div>
                            {[
                                {date: '15 Ene 2024', weight: '78.5 kg'},
                                {date: '12 Dic 2023', weight: '79.2 kg'},
                                {date: '10 Nov 2023', weight: '80.5 kg'},
                            ].map((h, i) => (
                                <div key={i} className="flex items-center gap-3 relative z-10">
                                    <div className="size-4 rounded-full bg-primary border-2 border-white dark:border-surface-dark"></div>
                                    <div className="text-sm">
                                        <p className="font-medium text-text-dark dark:text-white">{h.date}</p>
                                        <p className="text-xs text-text-muted">{h.weight}</p>
                                    </div>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- VIEW: REPORTS DETAILS (Original Code with minor tweaks) ---
  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-right-5 duration-300">
      {/* Breadcrumbs & Back */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <button onClick={handleBack} className="text-text-muted hover:text-primary transition-colors font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Volver a lista
        </button>
        <span className="material-symbols-outlined text-[16px] text-gray-300">chevron_right</span>
        <span className="text-text-muted font-medium">Informes</span>
        <span className="material-symbols-outlined text-[16px] text-gray-300">chevron_right</span>
        <div className="flex items-center gap-2">
          {selectedClient?.image ? (
              <div className="size-6 rounded-full bg-cover bg-center" style={{ backgroundImage: `url('${selectedClient.image}')` }}></div>
          ) : (
             <div className="size-6 rounded-full bg-primary text-black flex items-center justify-center text-xs font-bold">{selectedClient?.name.charAt(0)}</div>
          )}
          <span className="text-text-dark dark:text-white font-medium">{selectedClient?.name || 'Cliente'}</span>
        </div>
      </div>

      {/* Page Heading & Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-dashed border-input-border dark:border-white/10 pb-6">
        <div className="flex flex-col gap-2 max-w-2xl">
          <h1 className="text-text-dark dark:text-white text-3xl lg:text-4xl font-bold tracking-tight">Informes y Comparativas</h1>
          <p className="text-text-muted dark:text-gray-400 text-base leading-relaxed">
            Analiza la evolución antropométrica de <span className="font-bold text-text-dark dark:text-white">{selectedClient?.name}</span>. Selecciona dos fechas para comparar el progreso, generar gráficos y exportar el informe final.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-5 h-11 rounded-lg border border-input-border dark:border-white/10 bg-white dark:bg-white/5 text-text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-medium text-sm shadow-sm">
            <span className="material-symbols-outlined text-[20px]">mail</span>
            <span>Enviar por Correo</span>
          </button>
          <button className="flex items-center gap-2 px-5 h-11 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Date Selection Control Panel */}
      <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-input-border dark:border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-6 w-full items-center">
          {/* Date 1 */}
          <div className="flex flex-col gap-2 w-full md:w-auto flex-1">
            <label className="text-xs uppercase font-bold text-text-muted tracking-wider">Fecha Inicial (A)</label>
            <div className="relative">
              <select className="w-full appearance-none bg-[#f8fcf9] dark:bg-black/20 border border-input-border dark:border-white/10 text-text-dark dark:text-white rounded-lg pl-10 pr-8 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer font-medium">
                <option>15 Enero 2024 - Primera Consulta</option>
                <option>15 Febrero 2024 - Seguimiento</option>
              </select>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary">calendar_today</span>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">expand_more</span>
            </div>
          </div>
          {/* Swap Button */}
          <button className="bg-[#e7f3eb] dark:bg-white/5 p-2 rounded-full text-primary hover:bg-primary hover:text-white transition-colors mt-6 md:mt-6 rotate-90 md:rotate-0">
            <span className="material-symbols-outlined">compare_arrows</span>
          </button>
          {/* Date 2 */}
          <div className="flex flex-col gap-2 w-full md:w-auto flex-1">
            <label className="text-xs uppercase font-bold text-text-muted tracking-wider">Fecha Final (B)</label>
            <div className="relative">
              <select className="w-full appearance-none bg-[#f8fcf9] dark:bg-black/20 border border-input-border dark:border-white/10 text-text-dark dark:text-white rounded-lg pl-10 pr-8 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer font-medium">
                <option>15 Abril 2024 - Actual</option>
                <option>15 Marzo 2024 - Seguimiento</option>
              </select>
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary">calendar_today</span>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Metrics & Summary */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Quick Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">monitor_weight</span>
              </div>
              <p className="text-text-muted text-sm font-medium mb-1">Peso Total</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-dark dark:text-white">{selectedClient?.weight || 78.5}</span>
                <span className="text-sm text-text-muted">kg</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary bg-[#e7f3eb] dark:bg-primary/20 px-2 py-0.5 rounded text-xs">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                <span>-2.4 kg</span>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">fitness_center</span>
              </div>
              <p className="text-text-muted text-sm font-medium mb-1">Masa Muscular</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-dark dark:text-white">42.1</span>
                <span className="text-sm text-text-muted">%</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary bg-[#e7f3eb] dark:bg-primary/20 px-2 py-0.5 rounded text-xs">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                <span>+1.2 %</span>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-5 rounded-xl border border-input-border dark:border-white/5 shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">water_drop</span>
              </div>
              <p className="text-text-muted text-sm font-medium mb-1">Grasa Corporal</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-dark dark:text-white">{selectedClient?.bodyFat || 18.5}</span>
                <span className="text-sm text-text-muted">%</span>
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-primary bg-[#e7f3eb] dark:bg-primary/20 px-2 py-0.5 rounded text-xs">
                <span className="material-symbols-outlined text-[14px]">trending_down</span>
                <span>-3.1 %</span>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-input-border dark:border-white/5 flex justify-between items-center bg-[#fcfdfd] dark:bg-white/5">
              <h3 className="font-bold text-lg text-text-dark dark:text-white">Mediciones Corporales</h3>
              <button className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1">
                Ver historial completo
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8fcf9] dark:bg-white/5 text-xs uppercase text-text-muted font-bold tracking-wider">
                    <th className="p-4 border-b border-input-border dark:border-white/5 w-1/3">Métrica</th>
                    <th className="p-4 border-b border-input-border dark:border-white/5 text-right">15 Ene (A)</th>
                    <th className="p-4 border-b border-input-border dark:border-white/5 text-right">15 Abr (B)</th>
                    <th className="p-4 border-b border-input-border dark:border-white/5 text-right">Dif.</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-text-dark dark:text-white divide-y divide-input-border dark:divide-white/5">
                  <tr className="hover:bg-[#f8fcf9] dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-400"></span> Cintura
                    </td>
                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">88 cm</td>
                    <td className="p-4 text-right font-bold">84 cm</td>
                    <td className="p-4 text-right text-primary font-bold">-4 cm</td>
                  </tr>
                  <tr className="hover:bg-[#f8fcf9] dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium flex items-center gap-2">
                      <span className="size-2 rounded-full bg-purple-400"></span> Cadera
                    </td>
                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">102 cm</td>
                    <td className="p-4 text-right font-bold">99 cm</td>
                    <td className="p-4 text-right text-primary font-bold">-3 cm</td>
                  </tr>
                  <tr className="hover:bg-[#f8fcf9] dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium flex items-center gap-2">
                      <span className="size-2 rounded-full bg-orange-400"></span> Brazo Relax
                    </td>
                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">32 cm</td>
                    <td className="p-4 text-right font-bold">33 cm</td>
                    <td className="p-4 text-right text-primary font-bold">+1 cm</td>
                  </tr>
                  <tr className="hover:bg-[#f8fcf9] dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium flex items-center gap-2">
                      <span className="size-2 rounded-full bg-red-400"></span> Muslo Medial
                    </td>
                    <td className="p-4 text-right text-gray-500 dark:text-gray-400">56 cm</td>
                    <td className="p-4 text-right font-bold">54 cm</td>
                    <td className="p-4 text-right text-primary font-bold">-2 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Progress Chart */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm p-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-text-dark dark:text-white">Gráfico de Evolución</h3>
              <div className="flex bg-[#f0f7f2] dark:bg-white/10 rounded-lg p-1 gap-1">
                <button className="px-3 py-1 text-xs font-bold rounded bg-white dark:bg-surface-dark text-text-dark dark:text-white shadow-sm">Peso</button>
                <button className="px-3 py-1 text-xs font-medium rounded text-text-muted hover:bg-white/50 transition-colors">% Grasa</button>
                <button className="px-3 py-1 text-xs font-medium rounded text-text-muted hover:bg-white/50 transition-colors">IMC</button>
              </div>
            </div>
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA}>
                  <defs>
                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#13ec5b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#13ec5b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#4c9a66" tick={{fill: '#4c9a66', fontSize: 12}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{backgroundColor: '#102216', border: '1px solid #13ec5b', borderRadius: '8px', color: '#fff'}} />
                  <Area type="monotone" dataKey="peso" stroke="#13ec5b" strokeWidth={3} fillOpacity={1} fill="url(#colorPeso)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Comparison */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm p-5 h-full">
            <h3 className="font-bold text-lg text-text-dark dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">visibility</span>
              Comparativa Visual
            </h3>
            <div className="flex flex-col gap-6">
              {/* Photo Card Front */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm font-medium text-text-muted">
                  <span>Vista Frontal</span>
                </div>
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5 group">
                  {/* Before */}
                  <div className="absolute inset-0 w-1/2 overflow-hidden border-r-2 border-white z-10 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBxLTVmn6mXei4mhAmPvqQk_iBT7JjMc0789eOT7PnySJt6TpiR4BUneN_dY19_y82wtMPhFa20Bt60F9mPDOucicqUb8-41X_MwNJzChAJ3e1QLgAzAx7oIbIuve5u6qAkS5Fik8ceBXx4HHNGNycNAQG7tmQ9QB2aJ4M4-8EYaZaUFHbwscyizeQjCenrA_6NaR7QM95yOUfq5jPxgeHmYULzeaGPHQHfIE53aL9vFTK3kpK0vrGmVGbxrWi7DMUwY8Qn26k_3RM')" }}>
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm">ANTES: 15 Ene</div>
                  </div>
                  {/* After */}
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBoXStpErv95bZ-B84CX4caJnMSfgzjUfbercIr_tRVIJPQXLysXwrOkmAbZs66k-CJnd7S56hFnac01SilfkuiAA1UWW7WA14V64SHnnfqoDPN5unJzlJgr3oDHb1ZUS3BLSOFjLcGQVZh4h4GXx9RhoTpG7sjBwMeS3Wb-WindZPwurGARGGMQXwGxhBc_MvdA2l_Ql7i3RE_2b2-P2W-VI12mC-vCyrlruNX8pS3_BVYgVIQSm-cZ6VEnPhtzWGrUFoeDgdBxMo')" }}>
                    <div className="absolute top-2 right-2 bg-primary text-white text-[10px] px-2 py-1 rounded shadow-sm font-bold">AHORA: 15 Abr</div>
                  </div>
                  {/* Slider Handle Simulation */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-8 -ml-4 flex items-center justify-center z-20 cursor-ew-resize">
                    <div className="size-8 bg-white rounded-full shadow-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">code</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photo Card Side (Smaller) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-text-muted">Lateral (A)</span>
                  <div className="aspect-[3/4] rounded-lg bg-gray-200 dark:bg-white/10 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBF-b8yQ2ZBrM8MdzJyCvPRoWQz9rNPh9cOhrIDtmFYgvwR5aqHZ5xTlpWiK93OGcAWmsIsSz-KozlHE7_EVLMU2gMOCnxXCfci4ijEZcbHx3WUfo1fH2qN8MmspUKROdFCqcKCYJqGfsfh7yiMkzJ-Dvsld6tgEAcrIpGFQA1Hv7u1pREIGXrcOKw9jh3cZ_rC2fOLXwhqDsMxCUBEh5tTsXu7ILOHbE6SCbx8y_QzkrngptcmtCMWo76H4UZWgeiBX5pJg-Bi0WM')" }}></div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-bold text-text-muted">Lateral (B)</span>
                  <div className="aspect-[3/4] rounded-lg bg-gray-200 dark:bg-white/10 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD6Y9N1_Je6ylPEQpiVLCeszm1JynHDKmyACOCpSeOsSegPGWsZAD5rqb_4Vi1aQISjfgTFlyeg29_AUnzm8vA4-t9EMZFYsOJd3_vouVJdG_f6xt9Kby02UeLovcH0OfER20iy1ljP6p_vcj5xrVB_nAJ0rRfrZxUnLqkJjG0O0JK5IR8Un_BgElUAI42IcOydAAWnUHc8TWFUuQia2je2owkDS4A87EiaELAOPM7AqZtaFwOAyfYV1ca9ENWVRv03x82aLt7UR4w')" }}></div>
                </div>
              </div>

              <button className="w-full mt-auto py-3 rounded-lg border-2 border-dashed border-input-border dark:border-white/20 text-text-muted hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium">
                <span className="material-symbols-outlined">add_a_photo</span>
                Subir nuevas fotos
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;