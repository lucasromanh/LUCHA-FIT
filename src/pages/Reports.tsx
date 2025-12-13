import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, YAxis, CartesianGrid, Legend, ReferenceLine, LineChart, Line } from 'recharts';
import { ASSETS, CHART_DATA, CLIENTS, MOCK_HISTORY } from '../constants';
import { Client, MeasurementRecord, AnthropometricData } from '../types';

type ViewMode = 'list' | 'details' | 'new';

// --- CONFIGURATION: ANTHROPOMETRY SECTIONS ---
const ANTHRO_SECTIONS = [
    {
        id: 'basic',
        title: '1. Medidas Básicas',
        icon: 'straighten',
        metrics: [
            { id: 'mass', num: 1, label: 'Masa corporal', unit: 'kg' },
            { id: 'stature', num: 2, label: 'Talla', unit: 'cm' },
            { id: 'sitting_height', num: 3, label: 'Talla sentado', unit: 'cm' },
            { id: 'arm_span', num: 4, label: 'Envergadura', unit: 'cm' },
        ]
    },
    {
        id: 'skinfolds',
        title: '2. Pliegues Cutáneos',
        icon: 'pinch',
        metrics: [
            { id: 'triceps', num: 5, label: 'Tríceps', unit: 'mm' },
            { id: 'subscapular', num: 6, label: 'Subescapular', unit: 'mm' },
            { id: 'biceps', num: 7, label: 'Bíceps', unit: 'mm' },
            { id: 'iliac_crest', num: 8, label: 'Cresta ilíaca', unit: 'mm' },
            { id: 'supraspinale', num: 9, label: 'Supraespinal', unit: 'mm' },
            { id: 'abdominal', num: 10, label: 'Abdominal', unit: 'mm' },
            { id: 'thigh', num: 11, label: 'Muslo', unit: 'mm' },
            { id: 'calf', num: 12, label: 'Pierna', unit: 'mm' },
        ]
    },
    {
        id: 'girths',
        title: '3. Perímetros',
        icon: 'architecture',
        metrics: [
            { id: 'arm_relaxed', num: 13, label: 'Brazo relajado', unit: 'cm' },
            { id: 'arm_flexed', num: 14, label: 'Brazo flexionado', unit: 'cm' },
            { id: 'waist', num: 15, label: 'Cintura', unit: 'cm' },
            { id: 'hips', num: 16, label: 'Caderas', unit: 'cm' },
            { id: 'mid_thigh', num: 17, label: 'Muslo medio', unit: 'cm' },
            { id: 'calf_girth', num: 18, label: 'Pierna', unit: 'cm' },
        ]
    },
    {
        id: 'breadths',
        title: '4. Diámetros Óseos',
        icon: 'accessibility_new',
        metrics: [
            { id: 'humerus', num: 19, label: 'Húmero', unit: 'cm' },
            { id: 'bistyloid', num: 20, label: 'Biestiloideo', unit: 'cm' },
            { id: 'femur', num: 21, label: 'Fémur', unit: 'cm' },
        ]
    }
];

// --- PHANTOM DATA FOR Z-SCORE CALCULATION (Reference: Ross & Wilson) ---
const PHANTOM_REF: Record<string, { mean: number; sd: number }> = {
    mass: { mean: 75, sd: 10 },
    stature: { mean: 170.18, sd: 6 },
    triceps: { mean: 12, sd: 4 },
    subscapular: { mean: 15, sd: 5 },
    biceps: { mean: 5, sd: 2 },
    iliac_crest: { mean: 18, sd: 6 },
    supraspinale: { mean: 10, sd: 3 },
    abdominal: { mean: 20, sd: 7 },
    thigh: { mean: 15, sd: 5 },
    calf: { mean: 10, sd: 4 },
    arm_relaxed: { mean: 30, sd: 3 },
    arm_flexed: { mean: 32, sd: 3.5 },
    waist: { mean: 80, sd: 8 },
    hips: { mean: 98, sd: 6 },
    mid_thigh: { mean: 55, sd: 5 },
    calf_girth: { mean: 36, sd: 3 },
    humerus: { mean: 7, sd: 0.5 },
    femur: { mean: 9.5, sd: 0.6 },
    bistyloid: { mean: 5.5, sd: 0.4 }
};

interface MeasurementValues {
    [key: string]: {
        v1: string;
        v2: string;
        v3: string;
    };
}

interface ReportsProps {
    externalClient?: Client | null;
    externalViewMode?: 'new' | 'details' | 'list';
}

const Reports: React.FC<ReportsProps> = ({ externalClient, externalViewMode }) => {
    const [view, setView] = useState<ViewMode>('list');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // New Measurement State
    const [measurements, setMeasurements] = useState<MeasurementValues>({});
    const [formErrors, setFormErrors] = useState<string[]>([]);

    // Detailed Report State
    const [currentRecord, setCurrentRecord] = useState<MeasurementRecord | null>(null);
    const [prevRecord, setPrevRecord] = useState<MeasurementRecord | null>(null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initialize with external props
    useEffect(() => {
        if (externalClient) {
            setSelectedClient(externalClient);

            if (externalViewMode === 'new') {
                initNewForm();
                setView('new');
            } else {
                loadClientData(externalClient.id);
                setView('details');
            }
        }
    }, [externalClient, externalViewMode]);

    const initNewForm = () => {
        const initData: MeasurementValues = {};
        ANTHRO_SECTIONS.forEach(section => {
            section.metrics.forEach(m => {
                initData[m.id] = { v1: '', v2: '', v3: '' };
            });
        });
        setMeasurements(initData);
        setFormErrors([]);
    };

    const loadClientData = (clientId: string) => {
        // Mock loading data from DB
        const history = MOCK_HISTORY[clientId] || [];
        if (history.length > 0) {
            setCurrentRecord(history[0]);
            if (history.length > 1) {
                setPrevRecord(history[1]);
            } else {
                setPrevRecord(null);
            }
        } else {
            setCurrentRecord(null);
            setPrevRecord(null);
        }
    };

    // --- CALCULATION HELPERS ---

    const getMetricValue = (record: MeasurementRecord | null, sectionId: string, metricId: string): number => {
        if (!record || !record.data) return 0;
        // @ts-ignore
        return record.data[sectionId]?.[metricId] || 0;
    };

    const calcDiff = (curr: number, prev: number) => curr - prev;
    const calcPercent = (curr: number, prev: number) => prev === 0 ? 0 : ((curr - prev) / prev) * 100;

    const getZScore = (val: number, metricId: string) => {
        const ref = PHANTOM_REF[metricId];
        if (!ref || val === 0) return 0;
        return (val - ref.mean) / ref.sd;
    };

    const calcCorrectedGirth = (girthCm: number, skinfoldMm: number) => {
        return girthCm - (Math.PI * (skinfoldMm / 10));
    };

    const calcFaulkner = (triceps: number, subscap: number, supra: number, abd: number) => {
        const sum4 = triceps + subscap + supra + abd;
        return (sum4 * 0.153) + 5.783;
    };

    const calcSomatotype = (data: AnthropometricData) => {
        if (!data) return { endo: 0, meso: 0, ecto: 0, x: 0, y: 0 };

        const { triceps, subscapular, supraspinale } = data.skinfolds;
        const { humerus, femur } = data.breadths;
        const { arm_flexed, calf_girth } = data.girths;
        const { stature, mass } = data.basic;
        const calf_skinfold = data.skinfolds.calf;

        // Endomorphy
        const sum3 = triceps + subscapular + supraspinale;
        const endo = -0.7182 + (0.1451 * sum3) - (0.00068 * Math.pow(sum3, 2)) + (0.0000014 * Math.pow(sum3, 3));

        // Mesomorphy
        const arm_corr = arm_flexed - (triceps / 10);
        const calf_corr = calf_girth - (calf_skinfold / 10);
        const meso = (0.858 * humerus) + (0.601 * femur) + (0.188 * arm_corr) + (0.161 * calf_corr) - (0.131 * stature) + 4.5;

        // Ectomorphy
        const hwr = stature / Math.pow(mass, 0.3333);
        let ecto = 0;
        if (hwr >= 40.75) ecto = (0.732 * hwr) - 28.58;
        else if (hwr >= 38.25) ecto = (0.463 * hwr) - 17.63;
        else ecto = 0.1;

        // Chart Coordinates
        const x = ecto - endo;
        const y = (2 * meso) - (ecto + endo);

        return { endo, meso, ecto, x, y };
    };

    // --- DERIVED VALUES ---
    const d = currentRecord?.data;
    const somato = d ? calcSomatotype(d) : { endo: 0, meso: 0, ecto: 0, x: 0, y: 0 };
    const bodyFatPerc = d ? calcFaulkner(d.skinfolds.triceps, d.skinfolds.subscapular, d.skinfolds.supraspinale, d.skinfolds.abdominal) : 0;
    const fatMass = d ? (d.basic.mass * (bodyFatPerc / 100)) : 0;
    const muscleMass = d ? (d.basic.mass - fatMass) : 0;
    const boneMass = d ? (d.basic.mass * 0.14) : 0;

    // Corrected Girths
    const armCorr = d ? calcCorrectedGirth(d.girths.arm_relaxed, d.skinfolds.triceps) : 0;
    const thighCorr = d ? calcCorrectedGirth(d.girths.mid_thigh, d.skinfolds.thigh) : 0;
    const calfCorr = d ? calcCorrectedGirth(d.girths.calf_girth, d.skinfolds.calf) : 0;

    // Z-Scores
    const zArmCorr = armCorr > 0 ? getZScore(armCorr, 'arm_relaxed') : 0;
    const zThighCorr = thighCorr > 0 ? getZScore(thighCorr, 'mid_thigh') : 0;
    const zCalfCorr = calfCorr > 0 ? getZScore(calfCorr, 'calf_girth') : 0;

    // Percents for Muscle Man (Right Side)
    const armPerc = d && d.girths.arm_relaxed > 0 ? (armCorr / d.girths.arm_relaxed) * 100 : 0;
    const thighPerc = d && d.girths.mid_thigh > 0 ? (thighCorr / d.girths.mid_thigh) * 100 : 0;
    const calfPerc = d && d.girths.calf_girth > 0 ? (calfCorr / d.girths.calf_girth) * 100 : 0;

    // Percents for Adipose Man (Left Side) - Calculated from Skinfolds distribution
    const totalSkinfolds = d ? (d.skinfolds.triceps + d.skinfolds.subscapular + d.skinfolds.biceps + d.skinfolds.iliac_crest + d.skinfolds.supraspinale + d.skinfolds.abdominal + d.skinfolds.thigh + d.skinfolds.calf) : 1;

    // Superior: Triceps + Subscap + Biceps
    const adiposeSuperior = d ? ((d.skinfolds.triceps + d.skinfolds.subscapular + d.skinfolds.biceps) / totalSkinfolds) * 100 : 0;
    // Central: Abdominal + Supraespinal + Cresta Iliaca
    const adiposeCentral = d ? ((d.skinfolds.abdominal + d.skinfolds.supraspinale + d.skinfolds.iliac_crest) / totalSkinfolds) * 100 : 0;
    // Inferior: Muslo + Pantorrilla
    const adiposeInferior = d ? ((d.skinfolds.thigh + d.skinfolds.calf) / totalSkinfolds) * 100 : 0;


    // Sums & Indices
    const sum6 = d ? (d.skinfolds.triceps + d.skinfolds.subscapular + d.skinfolds.supraspinale + d.skinfolds.abdominal + d.skinfolds.thigh + d.skinfolds.calf) : 0;
    const sum8 = d ? (sum6 + d.skinfolds.biceps + d.skinfolds.iliac_crest) : 0;
    const adiposeMuscleIndex = muscleMass > 0 ? fatMass / muscleMass : 0;
    const muscleBoneIndex = boneMass > 0 ? muscleMass / boneMass : 0;

    // Advanced Indices (Performance)
    const bsa = d ? 0.007184 * Math.pow(d.basic.mass, 0.425) * Math.pow(d.basic.stature, 0.725) : 0;
    const ipc = d ? (bsa * 100) : 0; // Simplified scaling from example
    const cormic = d ? d.basic.sitting_height / d.basic.stature : 0;
    const manouvrier = d ? ((d.basic.stature - d.basic.sitting_height) / d.basic.sitting_height) * 100 : 0;
    const relativeSpan = d ? d.basic.arm_span / d.basic.stature : 0;
    const conicityIndex = d ? (d.girths.waist / 100) / (0.109 * Math.sqrt(d.basic.mass / (d.basic.stature / 100))) : 0;

    // Energy
    const bmr = d ? (66.5 + (13.75 * d.basic.mass) + (5.003 * d.basic.stature) - (6.755 * (selectedClient?.age || 25))) : 0;
    const tdee = bmr * 1.5;

    const barChartData = [
        { name: 'Brazo', raw: d?.girths.arm_relaxed, corr: armCorr },
        { name: 'Muslo', raw: d?.girths.mid_thigh, corr: thighCorr },
        { name: 'Pierna', raw: d?.girths.calf_girth, corr: calfCorr },
    ];

    const skinfoldsChartData = [
        { name: 'Tríceps', val: d?.skinfolds.triceps || 0 },
        { name: 'Subescap', val: d?.skinfolds.subscapular || 0 },
        { name: 'Bíceps', val: d?.skinfolds.biceps || 0 },
        { name: 'C. Ilíaca', val: d?.skinfolds.iliac_crest || 0 },
        { name: 'Supraesp', val: d?.skinfolds.supraspinale || 0 },
        { name: 'Abdominal', val: d?.skinfolds.abdominal || 0 },
        { name: 'Muslo', val: d?.skinfolds.thigh || 0 },
        { name: 'Pierna', val: d?.skinfolds.calf || 0 },
    ];

    // --- ACTIONS (Unchanged) ---
    const handleSendMail = () => { if (selectedClient) alert(`Enviando informe por correo a: ${selectedClient.email || 'correo@cliente.com'}`); };
    const handleExportPDF = () => { if (selectedClient) alert(`Generando PDF profesional...`); };
    const handleExportExcel = () => { if (selectedClient) alert(`Generando Excel detallado...`); };
    const handleUploadClick = () => { fileInputRef.current?.click(); };
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { setUploadedImage(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const filteredClients = useMemo(() => {
        if (!searchTerm) return CLIENTS;
        const lowerTerm = searchTerm.toLowerCase();
        return CLIENTS.filter(c => c.name.toLowerCase().includes(lowerTerm) || c.id.toLowerCase().includes(lowerTerm));
    }, [searchTerm]);

    const handleSelectClientForReport = (client: Client) => { setSelectedClient(client); loadClientData(client.id); setView('details'); };
    const handleSelectClientForNew = (client: Client) => { setSelectedClient(client); initNewForm(); setView('new'); };
    const handleBack = () => { setView('list'); setSelectedClient(null); setFormErrors([]); };

    const handleNewInputChange = (metricId: string, field: 'v1' | 'v2' | 'v3', value: string) => {
        if (!/^\d*\.?\d*$/.test(value)) return;
        setMeasurements(prev => ({ ...prev, [metricId]: { ...prev[metricId], [field]: value } }));
    };

    // --- ISAK LOGIC HELPERS ---

    // Define allowed difference (Threshold) per section type
    const getAllowedDiff = (sectionId: string) => {
        switch (sectionId) {
            case 'skinfolds': return 1.0; // > 1mm
            case 'breadths': return 0.2; // > 2mm (0.2cm)
            case 'girths': return 0.5; // > 5mm (0.5cm)
            case 'basic': return 0.5; // Default safe threshold for basics
            default: return 9999;
        }
    };

    // Check if 3rd measurement is required based on v1 and v2 difference
    const needsThirdMeasure = (metricId: string, sectionId: string) => {
        const m = measurements[metricId];
        if (!m || !m.v1 || !m.v2) return false;
        const v1 = parseFloat(m.v1);
        const v2 = parseFloat(m.v2);
        if (isNaN(v1) || isNaN(v2)) return false;

        const threshold = getAllowedDiff(sectionId);
        return Math.abs(v1 - v2) > threshold;
    };

    // Calculate Final Value (Mean of 2 or Median of 3)
    const calculateFinalValue = (metricId: string, sectionId: string) => {
        const m = measurements[metricId];
        if (!m) return '-';
        const v1 = parseFloat(m.v1);
        const v2 = parseFloat(m.v2);
        const v3 = parseFloat(m.v3);

        // Need at least 2 values
        if (isNaN(v1) || isNaN(v2)) return '-';

        const thirdNeeded = needsThirdMeasure(metricId, sectionId);

        // If 3rd needed and provided, use Median
        if (thirdNeeded && !isNaN(v3)) {
            const values = [v1, v2, v3].sort((a, b) => a - b);
            return values[1].toFixed(2); // Median is the middle value
        }

        // Default: Average of 2
        return ((v1 + v2) / 2).toFixed(2);
    };

    const validateAndSaveNew = () => { alert("Medición guardada correctamente."); handleBack(); };

    const ZScoreRow = ({ label, value, metricId }: { label: string, value: number, metricId: string }) => {
        const z = getZScore(value, metricId);
        const clampedZ = Math.max(-3.5, Math.min(3.5, z));
        const leftPos = ((clampedZ + 4) / 8) * 100;
        return (
            <div className="flex items-center text-xs py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5">
                <div className="w-32 truncate font-medium text-text-dark dark:text-gray-300 pr-2" title={label}>{label}</div>
                <div className="flex-1 relative h-6 flex items-center">
                    <div className="absolute inset-0 flex justify-between px-[12.5%] text-[8px] text-gray-300">
                        <div className="h-full w-px bg-blue-100 dark:bg-blue-900/30"></div>
                        <div className="h-full w-px bg-blue-100 dark:bg-blue-900/30"></div>
                        <div className="h-full w-px bg-blue-100 dark:bg-blue-900/30"></div>
                        <div className="h-full w-0.5 bg-blue-300 dark:bg-blue-700"></div>
                        <div className="h-full w-px bg-blue-100 dark:bg-blue-900/30"></div>
                        <div className="h-full w-px bg-blue-100 dark:bg-blue-900/30"></div>
                        <div className="h-full w-px bg-blue-100 dark:bg-blue-900/30"></div>
                    </div>
                    <div className="absolute w-full h-px bg-blue-200 dark:bg-blue-800"></div>
                    <div className="absolute size-2.5 bg-blue-500 rounded-full shadow-sm border border-white z-10 transform -translate-x-1/2 transition-all duration-500" style={{ left: `${leftPos}%` }}></div>
                </div>
                <div className="w-12 text-right font-bold text-blue-600 dark:text-blue-400 pl-2">{z.toFixed(2)}</div>
            </div>
        );
    };

    // 1. LIST VIEW
    if (view === 'list') {
        return (
            <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-text-dark dark:text-white tracking-tight">Mediciones y Seguimiento</h1>
                    <p className="text-text-muted dark:text-gray-400">Selecciona un paciente para registrar una nueva medición o ver su evolución histórica.</p>
                </div>
                <div className="relative group">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">search</span>
                    <input type="text" placeholder="Buscar paciente por nombre o ID..." className="w-full pl-12 pr-4 h-14 bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl text-text-dark dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map(client => (
                        <div key={client.id} className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl p-5 hover:shadow-lg transition-all group flex flex-col gap-4">
                            <div className="flex items-center gap-4">
                                {client.image ? (
                                    <div className="size-14 rounded-full bg-cover bg-center border-2 border-input-border dark:border-gray-600" style={{ backgroundImage: `url('${client.image}')` }}></div>
                                ) : (
                                    <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">{client.name.substring(0, 2).toUpperCase()}</div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-text-dark dark:text-white leading-tight">{client.name}</h3>
                                    <p className="text-xs text-text-muted dark:text-gray-400 font-medium">ID: #{client.id}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${client.status === 'Activo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : client.status === 'Pendiente' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{client.status}</span>
                                </div>
                            </div>
                            <div className="h-px bg-input-border dark:bg-gray-700 w-full"></div>
                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <button onClick={() => handleSelectClientForNew(client)} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-text-dark dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-opacity"><span className="material-symbols-outlined text-[18px]">add</span> Nueva Medición</button>
                                <button onClick={() => handleSelectClientForReport(client)} disabled={client.status === 'Pendiente'} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-input-border dark:border-gray-600 text-text-dark dark:text-white font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-[18px]">bar_chart</span> Ver Progreso</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. NEW MEASUREMENT FORM
    if (view === 'new' && selectedClient) {
        return (
            <div id="anthro-form-container" className="flex flex-col gap-6 animate-in slide-in-from-right-5 duration-300 h-full overflow-y-auto pb-20">
                <div className="flex items-center justify-between gap-4 border-b border-input-border dark:border-gray-700 pb-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"><span className="material-symbols-outlined">arrow_back</span></button>
                        <div>
                            <h1 className="text-2xl font-black text-text-dark dark:text-white">Protocolo Antropométrico</h1>
                            <div className="flex items-center gap-2 text-sm text-text-muted"><span>Paciente:</span><span className="font-bold text-text-dark dark:text-white">{selectedClient.name}</span></div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-8">
                    {ANTHRO_SECTIONS.map((section) => (
                        <div key={section.id} className="bg-surface-light dark:bg-surface-dark border border-input-border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-gray-50 dark:bg-white/5 px-6 py-4 border-b border-input-border dark:border-gray-700 flex items-center gap-2"><span className="material-symbols-outlined text-primary">{section.icon}</span><h3 className="font-bold text-lg text-text-dark dark:text-white uppercase tracking-wide">{section.title}</h3></div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-input-border dark:border-gray-700 text-xs text-text-muted uppercase bg-white dark:bg-surface-dark">
                                            <th className="px-4 py-3 w-12 text-center">Nº</th><th className="px-4 py-3 min-w-[150px]">Medida</th><th className="px-2 py-3 w-24 text-center">1ª Toma</th><th className="px-2 py-3 w-24 text-center">2ª Toma</th><th className="px-2 py-3 w-24 text-center">3ª Toma</th><th className="px-4 py-3 w-24 text-center bg-gray-50/50 dark:bg-white/5">Valor Final</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-input-border dark:divide-gray-700">
                                        {section.metrics.map((metric) => {
                                            const isThirdRequired = needsThirdMeasure(metric.id, section.id);
                                            return (
                                                <tr key={metric.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                                    <td className="px-4 py-3 text-center font-bold text-gray-400">{metric.num}</td>
                                                    <td className="px-4 py-3 font-medium text-text-dark dark:text-white">{metric.label} ({metric.unit})</td>

                                                    {/* V1 Input */}
                                                    <td className="px-2 py-2">
                                                        <input type="number" placeholder="0.0" value={measurements[metric.id]?.v1 || ''} onChange={(e) => handleNewInputChange(metric.id, 'v1', e.target.value)} className="w-full text-center rounded-lg border border-input-border dark:border-gray-600 bg-white dark:bg-black/20 p-2 focus:ring-primary focus:border-primary text-text-dark dark:text-white" />
                                                    </td>

                                                    {/* V2 Input */}
                                                    <td className="px-2 py-2">
                                                        <input type="number" placeholder="0.0" value={measurements[metric.id]?.v2 || ''} onChange={(e) => handleNewInputChange(metric.id, 'v2', e.target.value)} className="w-full text-center rounded-lg border border-input-border dark:border-gray-600 bg-white dark:bg-black/20 p-2 focus:ring-primary focus:border-primary text-text-dark dark:text-white" />
                                                    </td>

                                                    {/* V3 Input - Conditionally Enabled */}
                                                    <td className="px-2 py-2 relative">
                                                        <input
                                                            type="number"
                                                            placeholder="-"
                                                            value={measurements[metric.id]?.v3 || ''}
                                                            disabled={!isThirdRequired}
                                                            onChange={(e) => handleNewInputChange(metric.id, 'v3', e.target.value)}
                                                            className={`w-full text-center rounded-lg border p-2 transition-colors ${isThirdRequired
                                                                ? 'border-orange-300 dark:border-orange-500 bg-white dark:bg-black/20 text-text-dark dark:text-white focus:ring-orange-500 focus:border-orange-500'
                                                                : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-300 cursor-not-allowed'
                                                                }`}
                                                        />
                                                        {isThirdRequired && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                                                    </td>

                                                    {/* Calculated Result */}
                                                    <td className="px-4 py-3 text-center font-bold text-text-dark dark:text-white bg-gray-50/50 dark:bg-white/5">
                                                        {calculateFinalValue(metric.id, section.id)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    <div className="flex justify-end gap-4 pt-4 border-t border-input-border dark:border-gray-700">
                        <button onClick={handleBack} className="px-6 py-3 rounded-lg border border-input-border dark:border-gray-600 font-bold">Cancelar</button>
                        <button onClick={validateAndSaveNew} className="px-8 py-3 rounded-lg bg-primary text-black font-bold">Guardar Medición</button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. REPORTS & COMPARISON VIEW
    return (
        <div className="flex flex-col gap-6 animate-in slide-in-from-right-5 duration-300 pb-20">
            {/* ... (Existing Report View Code remains unchanged) ... */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-dashed border-input-border dark:border-white/10 pb-6">
                <div className="flex flex-col gap-2 max-w-2xl">
                    <div className="flex items-center gap-2 mb-2"><button onClick={handleBack} className="text-text-muted hover:text-primary transition-colors font-medium flex items-center gap-1 text-sm"><span className="material-symbols-outlined text-[16px]">arrow_back</span> Volver</button><span className="text-gray-300">|</span><span className="text-primary font-bold uppercase tracking-wider text-xs bg-primary/10 px-2 py-0.5 rounded">Informe ISAK</span></div>
                    <h1 className="text-text-dark dark:text-white text-3xl lg:text-4xl font-bold tracking-tight">{selectedClient?.name}</h1>
                    <p className="text-text-muted dark:text-gray-400 text-sm">{selectedClient?.gender} • {selectedClient?.age} Años • {selectedClient?.goal}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={handleSendMail} className="flex items-center gap-2 px-5 h-11 rounded-lg border border-input-border dark:border-white/10 bg-white dark:bg-white/5 text-text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-medium text-sm shadow-sm"><span className="material-symbols-outlined text-[20px] text-gray-500">mail</span> <span>Enviar por Correo</span></button>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-5 h-11 rounded-lg border border-input-border dark:border-white/10 bg-white dark:bg-white/5 text-text-dark dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors font-medium text-sm shadow-sm"><span className="material-symbols-outlined text-[20px] text-green-600">table_view</span> <span>Excel</span></button>
                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-5 h-11 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-0.5"><span className="material-symbols-outlined text-[20px]">picture_as_pdf</span> <span>Generar PDF</span></button>
                </div>
            </div>

            <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-input-border dark:border-white/5 flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-6 w-full items-center">
                    <div className="flex flex-col gap-2 w-full md:w-auto flex-1">
                        <label className="text-xs uppercase font-bold text-text-muted tracking-wider">Evaluación Previa (Referencia)</label>
                        <select className="input-field cursor-pointer font-medium" disabled value={prevRecord?.date || ''}>
                            {prevRecord ? <option value={prevRecord.date}>{prevRecord.date} - Evaluador: {prevRecord.evaluator}</option> : <option>Sin evaluación previa</option>}
                        </select>
                    </div>
                    <span className="material-symbols-outlined text-primary rotate-90 md:rotate-0">arrow_forward</span>
                    <div className="flex flex-col gap-2 w-full md:w-auto flex-1">
                        <label className="text-xs uppercase font-bold text-text-muted tracking-wider">Evaluación Actual</label>
                        <select className="input-field cursor-pointer font-bold text-text-dark dark:text-white bg-primary/5 border-primary" value={currentRecord?.date || ''} onChange={() => { }}>
                            {currentRecord ? <option value={currentRecord.date}>{currentRecord.date} - Evaluador: {currentRecord.evaluator}</option> : <option>Sin datos</option>}
                        </select>
                    </div>
                </div>
            </div>

            {!currentRecord ? (
                <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-xl text-gray-500">No hay mediciones registradas.<button onClick={() => { initNewForm(); setView('new'); }} className="block mx-auto mt-4 text-primary font-bold hover:underline">Crear primera medición</button></div>
            ) : (
                <>
                    {/* --- SECTIONS 1: METRICS TABLES & Z-SCORES --- */}
                    {ANTHRO_SECTIONS.map((section) => (
                        <div key={section.id} className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm overflow-hidden">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 border-b border-input-border dark:border-white/5 flex items-center gap-2 justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">{section.icon}</span>
                                    <h3 className="font-bold text-text-dark dark:text-white uppercase">{section.title}</h3>
                                </div>
                            </div>
                            <div className="flex flex-col lg:flex-row">
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-white dark:bg-surface-dark border-b border-input-border dark:border-white/5 text-xs uppercase text-text-muted">
                                                <th className="p-3">Medida</th><th className="p-3 text-right">Actual</th><th className="p-3 text-right text-gray-400">Previa</th><th className="p-3 text-right">Dif.</th><th className="p-3 text-right">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-input-border dark:divide-white/5">
                                            {section.metrics.map(metric => {
                                                const curr = getMetricValue(currentRecord, section.id, metric.id);
                                                const prev = getMetricValue(prevRecord, section.id, metric.id);
                                                const diff = calcDiff(curr, prev);
                                                const percent = calcPercent(curr, prev);
                                                return (
                                                    <tr key={metric.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                                        <td className="p-3 font-medium text-text-dark dark:text-white">{metric.label} <span className="text-xs text-gray-400">({metric.unit})</span></td>
                                                        <td className="p-3 text-right font-bold">{curr}</td>
                                                        <td className="p-3 text-right text-gray-500">{prev || '-'}</td>
                                                        <td className={`p-3 text-right font-medium ${diff > 0 ? 'text-blue-500' : diff < 0 ? 'text-orange-500' : 'text-gray-400'}`}>{prev ? (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)) : '-'}</td>
                                                        <td className="p-3 text-right text-xs">{prev ? <span className={`px-1.5 py-0.5 rounded ${percent > 0 ? 'bg-blue-100 text-blue-700' : percent < 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{Math.abs(percent).toFixed(1)}%</span> : '-'}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="w-full lg:w-[400px] border-l border-input-border dark:border-white/5 bg-gray-50/50 dark:bg-black/10 p-4">
                                    <h4 className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-3 text-center">Escore Z (Proporcionalidad)</h4>
                                    <div className="flex justify-between text-[10px] text-gray-400 px-12 mb-1"><span>-4</span><span>0</span><span>+4</span></div>
                                    <div className="flex flex-col">{section.metrics.map(metric => { const val = getMetricValue(currentRecord, section.id, metric.id); if (val === 0) return null; return <ZScoreRow key={metric.id} label={metric.label} value={val} metricId={metric.id} />; })}</div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* --- SECTION 2: SOMATOTYPE & BODY COMPOSITION --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm p-0 overflow-hidden flex flex-col h-full">
                            <div className="bg-primary text-white p-3 font-bold px-5">Somatotipo (Heath-Carter)</div>
                            <div className="p-5 flex flex-col items-center justify-center flex-1">
                                <div className="w-full max-w-[400px] aspect-square relative">
                                    <svg viewBox="0 0 200 180" className="w-full h-full">
                                        <defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" /></pattern></defs>
                                        <rect width="200" height="180" fill="url(#grid)" />
                                        <path d="M 100 10 L 10 160 L 190 160 Z" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" />
                                        <text x="100" y="8" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#374151">MESOMORFO</text>
                                        <text x="10" y="170" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#374151">ENDOMORFO</text>
                                        <text x="190" y="170" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#374151">ECTOMORFO</text>
                                        <line x1="100" y1="160" x2="100" y2="100" stroke="#d1d5db" strokeWidth="1" />
                                        <line x1="100" y1="100" x2="55" y2="85" stroke="#d1d5db" strokeWidth="1" />
                                        <line x1="100" y1="100" x2="145" y2="85" stroke="#d1d5db" strokeWidth="1" />
                                        <circle cx="100" cy="20" r="3" fill="#fbbf24" opacity="0.5" />
                                        <circle cx="20" cy="150" r="3" fill="#3b82f6" opacity="0.5" />
                                        <circle cx="180" cy="150" r="3" fill="#ef4444" opacity="0.5" />
                                        <circle cx={100 + (somato.x * 6)} cy={100 - (somato.y * 6)} r="4" fill="#0ea5e9" stroke="white" strokeWidth="2" />
                                    </svg>
                                    <div className="absolute top-2 right-2 bg-white/80 p-1 rounded text-[10px] text-gray-500 border border-gray-200">X: {somato.x.toFixed(1)}, Y: {somato.y.toFixed(1)}</div>
                                </div>
                                <div className="flex gap-4 mt-4 text-center w-full justify-center border-t border-gray-100 pt-4">
                                    <div><p className="text-xs text-gray-500 uppercase font-bold">Endo</p><p className="text-xl font-black text-blue-600">{somato.endo.toFixed(1)}</p></div>
                                    <div><p className="text-xs text-gray-500 uppercase font-bold">Meso</p><p className="text-xl font-black text-green-600">{somato.meso.toFixed(1)}</p></div>
                                    <div><p className="text-xs text-gray-500 uppercase font-bold">Ecto</p><p className="text-xl font-black text-orange-600">{somato.ecto.toFixed(1)}</p></div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="bg-white dark:bg-surface-dark p-3 border-b border-gray-200 dark:border-gray-700 font-bold px-5">Interpretación</div>
                            <div className="p-0 flex-1 overflow-x-auto">
                                <table className="w-full text-sm h-full">
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        <tr className="bg-white dark:bg-surface-dark"><td className="p-4 font-bold text-lg border-r border-gray-200 dark:border-gray-700 w-1/3 align-middle">Endomorfia</td><td className={`p-4 align-middle ${somato.endo > 5 ? 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500' : ''}`}>Alta adiposidad relativa; grasa subcutánea abundante; redondez en tronco y extremidades.</td></tr>
                                        <tr className="bg-white dark:bg-surface-dark"><td className="p-4 font-bold text-lg border-r border-gray-200 dark:border-gray-700 align-middle">Mesomorfia</td><td className={`p-4 align-middle ${somato.meso > 5 ? 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500' : ''}`}>Alto desarrollo músculo-esquelético relativo; diámetros óseos grandes; músculos de gran volumen.</td></tr>
                                        <tr className="bg-white dark:bg-surface-dark"><td className="p-4 font-bold text-lg border-r border-gray-200 dark:border-gray-700 align-middle">Ectomorfia</td><td className={`p-4 align-middle ${somato.ecto > 3 ? 'bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500' : ''}`}>Gran volumen por unidad de altura; extremidades relativamente voluminosas.</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="col-span-1 lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm p-0 overflow-hidden">
                            <div className="bg-blue-600 text-white p-3 font-bold px-5">Distribución Adiposo-Muscular</div>
                            <div className="p-6 flex flex-col md:flex-row gap-8 items-center">
                                {/* Bar Chart Section */}
                                <div className="flex-1 w-full h-[350px] min-h-[350px]">
                                    <h4 className="text-sm font-bold text-center mb-4 text-gray-500">Perímetros: Total vs Corregido (cm)</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart layout="vertical" data={barChartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12, fontWeight: 'bold' }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                            <Legend />
                                            <Bar dataKey="raw" name="Total (cm)" fill="#0284c7" barSize={25} radius={[0, 4, 4, 0]} />
                                            <Bar dataKey="corr" name="Corregido (cm)" fill="#0ea5e9" barSize={25} radius={[0, 4, 4, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                {/* Muscle Man Section */}
                                <div className="w-full md:w-[400px] relative bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col items-center p-4">
                                    <div className="flex justify-between w-full mb-2 font-bold text-sm border-b border-gray-100 pb-2"><span className="text-blue-600">Masa Adiposa</span><span className="text-blue-800">Masa Muscular</span></div>
                                    <div className="relative w-full h-[400px]">
                                        {/* Gender Neutral Anatomical Illustration */}
                                        <img src={ASSETS.body} alt="Anatomía Muscular" className="w-full h-full object-contain opacity-80" />

                                        {/* RIGHT SIDE: MUSCLE PERCENTAGES */}
                                        <div className="absolute top-[25%] right-0 w-32 flex items-center justify-end"><div className="mr-1 text-right"><p className="text-[10px] font-bold text-blue-800 uppercase">Brazo</p><p className="text-sm font-black text-blue-600">{armPerc.toFixed(1)}%</p></div><div className="h-px w-8 bg-blue-600"></div></div>
                                        <div className="absolute top-[55%] right-0 w-32 flex items-center justify-end"><div className="mr-1 text-right"><p className="text-[10px] font-bold text-blue-800 uppercase">Muslo</p><p className="text-sm font-black text-blue-600">{thighPerc.toFixed(1)}%</p></div><div className="h-px w-12 bg-blue-600"></div></div>
                                        <div className="absolute top-[80%] right-0 w-32 flex items-center justify-end"><div className="mr-1 text-right"><p className="text-[10px] font-bold text-blue-800 uppercase">Pierna</p><p className="text-sm font-black text-blue-600">{calfPerc.toFixed(1)}%</p></div><div className="h-px w-14 bg-blue-600"></div></div>

                                        {/* LEFT SIDE: ADIPOSE PERCENTAGES (UPDATED) */}
                                        <div className="absolute top-[20%] left-0 w-32 flex items-center"><div className="h-px w-10 bg-blue-600"></div><div className="ml-1"><p className="text-[10px] font-bold text-blue-800 uppercase">Superior</p><p className="text-sm font-black text-blue-600">{adiposeSuperior.toFixed(1)}%</p></div></div>
                                        <div className="absolute top-[45%] left-0 w-32 flex items-center"><div className="h-px w-8 bg-blue-600"></div><div className="ml-1"><p className="text-[10px] font-bold text-blue-800 uppercase">Central</p><p className="text-sm font-black text-blue-600">{adiposeCentral.toFixed(1)}%</p></div></div>
                                        <div className="absolute top-[80%] left-0 w-32 flex items-center"><div className="h-px w-14 bg-blue-600"></div><div className="ml-1"><p className="text-[10px] font-bold text-blue-800 uppercase">Inferior</p><p className="text-sm font-black text-blue-600">{adiposeInferior.toFixed(1)}%</p></div></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm p-0 overflow-hidden">
                            <div className="bg-blue-600 text-white p-3 font-bold px-5 flex justify-between items-center">
                                <span>Detalle Antropométrico</span>
                                <span className="text-xs bg-white/20 px-2 py-1 rounded">Evaluación Integral</span>
                            </div>
                            <div className="p-6 flex flex-col gap-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <h4 className="text-blue-600 dark:text-blue-400 font-bold mb-2 border-b border-gray-200 pb-1">Adiposidad</h4>
                                        <table className="w-full text-sm">
                                            <thead><tr className="text-left text-gray-500 font-bold border-b border-gray-100"><th className="py-2">Indicador</th><th className="py-2 text-right">Actual</th></tr></thead>
                                            <tbody>
                                                <tr className="border-b border-gray-50"><td className="py-2">Sumatoria 6 pliegues (mm)</td><td className="py-2 text-right font-bold">{sum6.toFixed(1)}</td></tr>
                                                <tr><td className="py-2">Sumatoria 8 pliegues (mm)</td><td className="py-2 text-right font-bold">{sum8.toFixed(1)}</td></tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div>
                                        <h4 className="text-blue-600 dark:text-blue-400 font-bold mb-2 border-b border-gray-200 pb-1">Muscularidad</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <table className="w-full text-sm">
                                                <thead><tr className="text-left text-gray-500 font-bold border-b border-gray-100"><th className="py-2">Perímetro Corregido</th><th className="py-2 text-right">cm</th></tr></thead>
                                                <tbody>
                                                    <tr className="border-b border-gray-50"><td className="py-2">Brazo</td><td className="py-2 text-right font-bold">{armCorr.toFixed(2)}</td></tr>
                                                    <tr className="border-b border-gray-50"><td className="py-2">Muslo</td><td className="py-2 text-right font-bold">{thighCorr.toFixed(2)}</td></tr>
                                                    <tr><td className="py-2">Pierna</td><td className="py-2 text-right font-bold">{calfCorr.toFixed(2)}</td></tr>
                                                </tbody>
                                            </table>
                                            <table className="w-full text-sm">
                                                <thead><tr className="text-left text-gray-500 font-bold border-b border-gray-100"><th className="py-2">Z-Score</th><th className="py-2 text-right">Valor</th></tr></thead>
                                                <tbody>
                                                    <tr className="border-b border-gray-50"><td className="py-2">Z Brazo corr.</td><td className="py-2 text-right font-bold text-blue-600">{zArmCorr.toFixed(2)}</td></tr>
                                                    <tr className="border-b border-gray-50"><td className="py-2">Z Muslo corr.</td><td className="py-2 text-right font-bold text-blue-600">{zThighCorr.toFixed(2)}</td></tr>
                                                    <tr><td className="py-2">Z Pierna corr.</td><td className="py-2 text-right font-bold text-blue-600">{zCalfCorr.toFixed(2)}</td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[250px] w-full">
                                    <h4 className="text-center font-bold text-sm mb-4">Perfil de pliegues (mm)</h4>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={skinfoldsChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="val" name="Actual" stroke="#0284c7" strokeWidth={2} dot={{ r: 4, fill: "#0284c7" }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-collapse">
                                        <thead><tr className="border-b border-gray-200 font-bold text-gray-700"><th className="py-3 pr-4">Índice</th><th className="py-3 px-4 text-center">Valor actual</th><th className="py-3 px-4 text-center">Clasificación</th><th className="py-3 pl-4">Interpretación</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100">
                                            <tr><td className="py-4 font-bold">Índice adiposo muscular</td><td className="py-4 text-center font-bold text-blue-600">{adiposeMuscleIndex.toFixed(2)}</td><td className="py-4 text-center"><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-bold">Medio-Alto</span></td><td className="py-4 text-gray-600 text-xs max-w-xs">Expresa cuántos kg de masa adiposa tiene que transportar cada kg de masa muscular.</td></tr>
                                            <tr><td className="py-4 font-bold">Índice músculo/óseo</td><td className="py-4 text-center font-bold text-green-600">{muscleBoneIndex.toFixed(2)}</td><td className="py-4 text-center"><span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-bold">Bueno</span></td><td className="py-4 text-gray-600 text-xs max-w-xs">Expresa los kg de masa muscular en función de la estructura ósea.</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION: ESTIMACION DE GASTO ENERGETICO (NEW) --- */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="bg-blue-600 text-white p-2 font-bold px-5">Estimación de gasto energético</div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">
                                    <span className="text-sm font-medium">Harris & Benedict (1919)</span>
                                    <span className="font-bold">1,5</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-500 uppercase">Interpretación</span>
                                    <span className="text-sm">Activo. Baja actividad</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-3">
                                <div className="text-center font-bold text-sm mb-2 uppercase border-b border-gray-200 dark:border-gray-600 pb-1">Actual</div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Metabolismo basal (kcal)</span>
                                    <span className="font-bold text-lg">{bmr.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Gasto energético total (kcal)</span>
                                    <span className="font-black text-xl text-blue-600">{tdee.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION: ÍNDICES DE SALUD (TRAFFIC LIGHT) (UPDATED) --- */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="bg-blue-600 text-white p-2 font-bold px-5">Índices de salud</div>
                        <div className="p-0 overflow-x-auto">
                            <div className="flex">
                                {/* Traffic Light Visual */}
                                <div className="w-16 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center gap-2 border-r border-gray-200 dark:border-gray-700 py-4 shrink-0">
                                    <div className="w-12 h-32 bg-gray-300 dark:bg-gray-600 rounded-full flex flex-col items-center justify-between p-2 shadow-inner">
                                        <div className="w-8 h-8 rounded-full bg-red-500 shadow-md border-2 border-red-600"></div>
                                        <div className="w-8 h-8 rounded-full bg-yellow-500 shadow-md border-2 border-yellow-600"></div>
                                        <div className="w-8 h-8 rounded-full bg-green-500 shadow-md border-2 border-green-600"></div>
                                    </div>
                                </div>

                                <table className="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700">
                                            <th className="py-3 px-4">Indicador</th>
                                            <th className="py-3 px-4 text-center">Valor</th>
                                            <th className="py-3 px-4 text-center">Rango Saludable</th>
                                            <th className="py-3 px-4">Interpretación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark">
                                        {/* Waist */}
                                        <tr>
                                            <td className="p-4 font-medium">Perímetro cintura (cm)</td>
                                            <td className={`p-4 text-center font-bold text-white ${d.girths.waist > 90 ? 'bg-yellow-500' : 'bg-green-500'}`}>{d.girths.waist}</td>
                                            <td className="p-4 text-center text-gray-500">70-90</td>
                                            <td className="p-4">Riesgo cardiometabólico {d.girths.waist > 90 ? 'aumentado' : 'bajo'}</td>
                                        </tr>
                                        {/* Waist/Hip Ratio */}
                                        <tr>
                                            <td className="p-4 font-medium">Índice cintura cadera</td>
                                            <td className={`p-4 text-center font-bold text-white ${(d.girths.waist / d.girths.hips) > 0.85 ? 'bg-yellow-500' : 'bg-green-500'}`}>{(d.girths.waist / d.girths.hips).toFixed(2)}</td>
                                            <td className="p-4 text-center text-gray-500">{'< 0.84'}</td>
                                            <td className="p-4">Moderado riesgo</td>
                                        </tr>
                                        {/* Conicity */}
                                        <tr>
                                            <td className="p-4 font-medium">Índice de conicidad</td>
                                            <td className={`p-4 text-center font-bold text-white ${conicityIndex > 1.25 ? 'bg-green-500' : 'bg-green-500'}`}>{conicityIndex.toFixed(2)}</td>
                                            <td className="p-4 text-center text-gray-500">1-1,4</td>
                                            <td className="p-4 text-xs">Cuanto más lejos de la unidad, más grasa</td>
                                        </tr>
                                        {/* Abdominal Skinfold */}
                                        <tr>
                                            <td className="p-4 font-medium">Pliegue abdominal (mm)</td>
                                            <td className={`p-4 text-center font-bold text-white ${d.skinfolds.abdominal > 20 ? 'bg-red-500' : 'bg-green-500'}`}>{d.skinfolds.abdominal}</td>
                                            <td className="p-4 text-center text-gray-500">{'< 12'}</td>
                                            <td className="p-4">{d.skinfolds.abdominal > 12 ? 'Excesivo > 12' : 'Normal'}</td>
                                        </tr>
                                        {/* BMI */}
                                        <tr>
                                            <td className="p-4 font-medium">IMC (kg/m2)</td>
                                            <td className={`p-4 text-center font-bold text-white ${(d.basic.mass / Math.pow(d.basic.stature / 100, 2)) > 25 ? 'bg-red-500' : 'bg-green-500'}`}>{(d.basic.mass / Math.pow(d.basic.stature / 100, 2)).toFixed(1)}</td>
                                            <td className="p-4 text-center text-gray-500">18.5-24.9</td>
                                            <td className="p-4">Obesidad grado 1</td>
                                        </tr>
                                        {/* Triceps Skinfold */}
                                        <tr>
                                            <td className="p-4 font-medium">Pliegue tríceps (mm)</td>
                                            <td className={`p-4 text-center font-bold text-white ${d.skinfolds.triceps > 15 ? 'bg-red-500' : 'bg-green-500'}`}>{d.skinfolds.triceps}</td>
                                            <td className="p-4 text-center text-gray-500">{'< 12'}</td>
                                            <td className="p-4">Excesivo {'>'} 12</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* --- SECTION: ÍNDICES DE RENDIMIENTO (NEW) --- */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm overflow-hidden">
                        <div className="bg-blue-600 text-white p-2 font-bold px-5">Índices de rendimiento</div>
                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300">
                                        <th className="py-3 px-4">Indicador</th>
                                        <th className="py-3 px-4 text-center">Valor</th>
                                        <th className="py-3 px-4">Clasificación actual</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark">
                                    <tr>
                                        <td className="p-4 font-medium">Diferencia brazo contraído - relajado</td>
                                        <td className="p-4 text-center font-bold">{(d.girths.arm_flexed - d.girths.arm_relaxed).toFixed(1)} cm</td>
                                        <td className="p-4 text-gray-500"></td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Área superficie corporal</td>
                                        <td className="p-4 text-center font-bold">{bsa.toFixed(2)}</td>
                                        <td className="p-4">Valor normal: 1.9 m2</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Índice de pérdida de calor IPC</td>
                                        <td className="p-4 text-center font-bold">{ipc.toFixed(0)}</td>
                                        <td className="p-4 text-xs max-w-xs">A mayor área, mayor capacidad para disipar calor</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Índice córmico</td>
                                        <td className="p-4 text-center font-bold">{cormic.toFixed(2)}</td>
                                        <td className="p-4">Macrocórmico (Tronco largo)</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Índice de Manouvrier</td>
                                        <td className="p-4 text-center font-bold">{manouvrier.toFixed(0)}</td>
                                        <td className="p-4">Miembros inferiores medianos</td>
                                    </tr>
                                    <tr>
                                        <td className="p-4 font-medium">Envergadura relativa</td>
                                        <td className="p-4 text-center font-bold">{relativeSpan.toFixed(2)}</td>
                                        <td className="p-4">Envergadura menor a la talla</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- SECTION 4: COMPARATIVA VISUAL --- */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-input-border dark:border-white/5 shadow-sm p-5">
                        <h3 className="font-bold text-lg text-text-dark dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">visibility</span>
                            Comparativa Visual
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Current Photo */}
                            <div className="flex flex-col gap-2">
                                <span className="text-sm font-bold text-gray-500">Foto Actual ({currentRecord.date})</span>
                                <div className="aspect-[3/4] bg-gray-100 dark:bg-white/5 rounded-lg overflow-hidden relative border border-input-border dark:border-gray-700">
                                    {uploadedImage ? (
                                        <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <span className="material-symbols-outlined text-4xl">image_not_supported</span>
                                            <span className="text-xs">Sin imagen</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col justify-center gap-4">
                                <p className="text-sm text-gray-500">Sube las fotos de la evaluación actual para generar la comparativa visual en el informe PDF.</p>

                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                <button
                                    onClick={handleUploadClick}
                                    className="py-3 px-4 rounded-lg border-2 border-dashed border-primary/50 text-primary font-bold hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined">add_a_photo</span>
                                    Subir nuevas fotos
                                </button>
                            </div>
                        </div>
                    </div>

                </>
            )}
        </div>
    );
};

export default Reports;