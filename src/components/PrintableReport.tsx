import React from 'react';
import { Client, MeasurementRecord } from '../types';
import { PROFESSIONAL_PROFILE } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

// Anthropometric sections definition
const ANTHRO_SECTIONS = [
  {
    id: 'basic',
    title: 'Medidas Básicas',
    metrics: [
      { id: 'mass', label: 'Masa Corporal', unit: 'kg' },
      { id: 'stature', label: 'Estatura', unit: 'cm' },
      { id: 'sitting_height', label: 'Talla Sentado', unit: 'cm' },
    ]
  },
  {
    id: 'skinfolds',
    title: 'Pliegues Cutáneos',
    metrics: [
      { id: 'triceps', label: 'Tríceps', unit: 'mm' },
      { id: 'subscapular', label: 'Subescapular', unit: 'mm' },
      { id: 'biceps', label: 'Bíceps', unit: 'mm' },
      { id: 'iliac_crest', label: 'Cresta Ilíaca', unit: 'mm' },
      { id: 'supraspinale', label: 'Supraespinal', unit: 'mm' },
      { id: 'abdominal', label: 'Abdominal', unit: 'mm' },
      { id: 'front_thigh', label: 'Muslo Frontal', unit: 'mm' },
      { id: 'medial_calf', label: 'Pantorrilla Medial', unit: 'mm' },
    ]
  },
  {
    id: 'girths',
    title: 'Perímetros',
    metrics: [
      { id: 'head', label: 'Cabeza', unit: 'cm' },
      { id: 'neck', label: 'Cuello', unit: 'cm' },
      { id: 'arm_relaxed', label: 'Brazo Relajado', unit: 'cm' },
      { id: 'arm_flexed', label: 'Brazo Flexionado', unit: 'cm' },
      { id: 'forearm', label: 'Antebrazo', unit: 'cm' },
      { id: 'wrist', label: 'Muñeca', unit: 'cm' },
      { id: 'chest', label: 'Pecho', unit: 'cm' },
      { id: 'waist', label: 'Cintura', unit: 'cm' },
      { id: 'hips', label: 'Cadera', unit: 'cm' },
      { id: 'mid_thigh', label: 'Muslo Medio', unit: 'cm' },
      { id: 'calf_girth', label: 'Pantorrilla', unit: 'cm' },
      { id: 'ankle', label: 'Tobillo', unit: 'cm' },
    ]
  },
  {
    id: 'breadths',
    title: 'Diámetros Óseos',
    metrics: [
      { id: 'biacromial', label: 'Biacromial', unit: 'cm' },
      { id: 'biiliocristal', label: 'Biiliocristal', unit: 'cm' },
      { id: 'foot_length', label: 'Longitud del Pie', unit: 'cm' },
      { id: 'transverse_chest', label: 'Tórax Transverso', unit: 'cm' },
      { id: 'ap_chest_depth', label: 'Profundidad AP del Tórax', unit: 'cm' },
      { id: 'humerus', label: 'Húmero', unit: 'cm' },
      { id: 'femur', label: 'Fémur', unit: 'cm' },
    ]
  }
];

// Phantom reference values
const PHANTOM_REF: any = {
  mass: 64.58, stature: 170.18, sitting_height: 84.54,
  triceps: 11.00, subscapular: 10.80, biceps: 6.00,
  iliac_crest: 13.00, supraspinale: 9.50, abdominal: 15.60,
  front_thigh: 18.00, medial_calf: 11.50,
  head: 55.22, neck: 33.72, arm_relaxed: 27.47,
  arm_flexed: 29.93, forearm: 26.39, wrist: 16.30,
  chest: 91.68, waist: 76.08, hips: 97.49,
  mid_thigh: 54.80, calf_girth: 36.23, ankle: 22.45,
  biacromial: 37.72, biiliocristal: 27.34, foot_length: 25.76,
  transverse_chest: 27.15, ap_chest_depth: 18.60,
  humerus: 6.63, femur: 9.36
};

interface PrintableReportProps {
  client: Client;
  currentRecord: MeasurementRecord;
  prevRecord: MeasurementRecord | null;
  calculations: any;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({ client, currentRecord, prevRecord, calculations }) => {
  const pageStyle: React.CSSProperties = {
    width: '210mm',
    height: '297mm',
    background: 'white',
    padding: '20mm',
    fontFamily: 'Arial, sans-serif',
    fontSize: '10pt',
    lineHeight: '1.4',
    color: '#000',
    boxSizing: 'border-box',
    overflow: 'hidden'
  };

  // Helper functions
  const getMetricValue = (record: MeasurementRecord | null, sectionId: string, metricId: string): number => {
    if (!record) return 0;
    const section = record.data[sectionId as keyof typeof record.data];
    return section ? (section as any)[metricId] || 0 : 0;
  };

  const calcDiff = (current: number, prev: number | null): number => {
    if (!prev) return 0;
    return current - prev;
  };

  const calcPercent = (current: number, prev: number | null): number => {
    if (!prev || prev === 0) return 0;
    return ((current - prev) / prev) * 100;
  };

  const getZScore = (value: number, metricId: string): number => {
    const ref = PHANTOM_REF[metricId];
    if (!ref) return 0;
    const sd = ref * 0.1;
    return (value - ref) / sd;
  };

  const d = currentRecord.data;

  // Prepare data for charts
  const girthsData = [
    { name: 'Brazo', value: d.girths.arm_relaxed, corrected: calculations.armCorr },
    { name: 'Muslo', value: d.girths.mid_thigh, corrected: calculations.thighCorr },
    { name: 'Pierna', value: d.girths.calf_girth, corrected: calculations.calfCorr }
  ];

  const skinfoldsProfileData = [
    { name: 'Tríceps', value: d.skinfolds.triceps },
    { name: 'Subesc.', value: d.skinfolds.subscapular },
    { name: 'Bíceps', value: d.skinfolds.biceps },
    { name: 'C.Ilíaca', value: d.skinfolds.iliac_crest },
    { name: 'Suprasp.', value: d.skinfolds.supraspinale },
    { name: 'Abdominal', value: d.skinfolds.abdominal },
    { name: 'Muslo', value: d.skinfolds.front_thigh },
    { name: 'Pierna', value: d.skinfolds.medial_calf }
  ];

  // Somatotype interpretation
  const getSomatotypeCategory = () => {
    const { endo, meso, ecto } = calculations.somato;
    if (endo > meso && endo > ecto) return 'Endomorfo';
    if (meso > endo && meso > ecto) return 'Mesomorfo';
    if (ecto > endo && ecto > meso) return 'Ectomorfo';
    if (Math.abs(endo - meso) < 0.5 && ecto < endo) return 'Endomorfo-Mesomorfo';
    if (Math.abs(meso - ecto) < 0.5 && endo < meso) return 'Mesomorfo-Ectomorfo';
    if (Math.abs(endo - ecto) < 0.5 && meso < endo) return 'Endomorfo-Ectomorfo';
    return 'Balanceado';
  };

  return (
    <div style={{ background: 'white' }}>
      {/* PÁGINA 1: HEADER Y DATOS */}
      <div className="pdf-page" style={pageStyle}>
        <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '3px solid #4ade80', paddingBottom: '15px' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24pt', color: '#000', fontWeight: 'bold' }}>INFORME ANTROPOMÉTRICO ISAK</h1>
          <p style={{ margin: '8px 0', fontSize: '12pt', fontWeight: '600' }}>{PROFESSIONAL_PROFILE.name}</p>
          <p style={{ margin: '5px 0', fontSize: '11pt' }}>ISAK Nivel {PROFESSIONAL_PROFILE.isak_level}</p>
          <p style={{ margin: '5px 0', fontSize: '10pt', color: '#666' }}>Fecha: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 15px 0', color: '#4ade80', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>DATOS DEL PACIENTE</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
            <tbody>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <td style={{ padding: '12px', border: '1px solid #d1d5db', fontWeight: 'bold', width: '35%' }}>Nombre</td>
                <td style={{ padding: '12px', border: '1px solid #d1d5db' }}>{client.name}</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>ID</td>
                <td style={{ padding: '12px', border: '1px solid #d1d5db' }}>{client.id}</td>
              </tr>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <td style={{ padding: '12px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>Edad</td>
                <td style={{ padding: '12px', border: '1px solid #d1d5db' }}>{client.age} años</td>
              </tr>
              <tr>
                <td style={{ padding: '12px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>Género</td>
                <td style={{ padding: '12px', border: '1px solid #d1d5db' }}>{client.gender}</td>
              </tr>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <td style={{ padding: '12px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>Objetivo</td>
                <td style={{ padding: '12px', border: '1px solid #d1d5db' }}>{client.goal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h2 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0 0 15px 0', color: '#4ade80', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>EVALUACIONES</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
            <thead>
              <tr style={{ backgroundColor: '#4ade80', color: 'white' }}>
                <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'left' }}>Fecha</th>
                <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'left' }}>Evaluador</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Actual</td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{currentRecord.date}</td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{currentRecord.evaluator}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Previa</td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{prevRecord?.date || 'N/A'}</td>
                <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{prevRecord?.evaluator || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PÁGINAS DE MEDICIONES */}
      {ANTHRO_SECTIONS.map((section) => {
        return (
          <div key={section.id} className="pdf-page" style={pageStyle}>
            <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 20px 0', color: '#4ade80', borderBottom: '2px solid #4ade80', paddingBottom: '10px' }}>
              {section.title.toUpperCase()}
            </h2>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '25px' }}>
              <thead>
                <tr style={{ backgroundColor: '#4ade80', color: 'white' }}>
                  <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'left' }}>Medida</th>
                  <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center', width: '15%' }}>Actual</th>
                  <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center', width: '15%' }}>Previa</th>
                  <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center', width: '12%' }}>Dif.</th>
                  <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center', width: '12%' }}>%</th>
                  <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center', width: '12%' }}>Z-Score</th>
                </tr>
              </thead>
              <tbody>
                {section.metrics.map((metric, idx) => {
                  const curr = getMetricValue(currentRecord, section.id, metric.id);
                  const prev = getMetricValue(prevRecord, section.id, metric.id);
                  const diff = calcDiff(curr, prev);
                  const percent = calcPercent(curr, prev);
                  const z = getZScore(curr, metric.id);

                  return (
                    <tr key={metric.id} style={{ backgroundColor: idx % 2 === 0 ? '#f9fafb' : 'white' }}>
                      <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>{metric.label}</td>
                      <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{curr} {metric.unit}</td>
                      <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{prev ? `${prev} ${metric.unit}` : 'N/A'}</td>
                      <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{prev ? (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)) : 'N/A'}</td>
                      <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{prev ? `${percent.toFixed(1)}%` : 'N/A'}</td>
                      <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{z.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div>
              <h3 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 15px 0', color: '#333' }}>Gráfico: Escore Z (Proporcionalidad)</h3>
              <div style={{ backgroundColor: '#f9fafb', padding: '15px', borderRadius: '6px' }}>
                {section.metrics.map((metric) => {
                  const curr = getMetricValue(currentRecord, section.id, metric.id);
                  const z = getZScore(curr, metric.id);
                  const barWidth = Math.min(Math.abs(z) * 25, 50);
                  const isPositive = z >= 0;

                  return (
                    <div key={metric.id} style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '9pt', marginBottom: '5px', color: '#374151', fontWeight: '500' }}>
                        {metric.label}: {z.toFixed(2)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', height: '20px' }}>
                        <div style={{ flex: 1, borderRight: '2px solid #374151', height: '100%' }}></div>
                        <div style={{ 
                          width: `${barWidth}%`, 
                          maxWidth: '50%',
                          height: '100%',
                          backgroundColor: Math.abs(z) > 2 ? '#ef4444' : Math.abs(z) > 1 ? '#f59e0b' : '#10b981',
                          marginLeft: isPositive ? '0' : 'auto',
                          marginRight: isPositive ? 'auto' : '0',
                          borderRadius: '3px'
                        }}></div>
                        {!isPositive && <div style={{ flex: 1, borderLeft: '2px solid #374151', height: '100%' }}></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {/* PÁGINA SOMATOTIPO CON INTERPRETACIÓN */}
      <div className="pdf-page" style={pageStyle}>
        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 20px 0', color: '#4ade80', borderBottom: '2px solid #4ade80', paddingBottom: '10px' }}>
          SOMATOTIPO (HEATH-CARTER)
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt', marginBottom: '25px' }}>
          <thead>
            <tr style={{ backgroundColor: '#4ade80', color: 'white' }}>
              <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'left' }}>Componente</th>
              <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'center', width: '20%' }}>Valor</th>
              <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'left' }}>Interpretación</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Endomorfia</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt' }}>
                {calculations.somato.endo.toFixed(1)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                {calculations.somato.endo > 5 ? 'Alta adiposidad relativa' : 'Normal'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Mesomorfia</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt' }}>
                {calculations.somato.meso.toFixed(1)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                {calculations.somato.meso > 5 ? 'Alto desarrollo músculo-esquelético' : 'Normal'}
              </td>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Ectomorfia</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', fontSize: '12pt' }}>
                {calculations.somato.ecto.toFixed(1)}
              </td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>
                {calculations.somato.ecto > 3 ? 'Gran linealidad relativa' : 'Normal'}
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 15px 0' }}>Triángulo Somatotípico</h3>
            <svg width="280" height="260" viewBox="0 0 200 180" style={{ border: '1px solid #e5e7eb' }}>
              <polygon points="100,20 20,160 180,160" fill="none" stroke="#999" strokeWidth="1"/>
              <text x="100" y="15" textAnchor="middle" fontSize="8" fontWeight="bold">ECTOMORFIA</text>
              <text x="10" y="175" textAnchor="start" fontSize="8" fontWeight="bold">ENDOMORFIA</text>
              <text x="190" y="175" textAnchor="end" fontSize="8" fontWeight="bold">MESOMORFIA</text>
              
              {(() => {
                const x = 100 + (calculations.somato.meso - calculations.somato.endo) * 6;
                const y = 100 - calculations.somato.ecto * 6;
                return <circle cx={x} cy={y} r="5" fill="#ef4444" stroke="#991b1b" strokeWidth="2"/>;
              })()}
            </svg>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 15px 0' }}>Interpretación</h3>
            <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #10b981', borderRadius: '8px', padding: '15px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '11pt', fontWeight: 'bold', color: '#047857' }}>
                Clasificación: {getSomatotypeCategory()}
              </p>
              <p style={{ margin: '0', fontSize: '10pt', lineHeight: '1.6' }}>
                {calculations.somato.endo > 5 && 'Predomina la adiposidad relativa. '}
                {calculations.somato.meso > 5 && 'Excelente desarrollo músculo-esquelético. '}
                {calculations.somato.ecto > 3 && 'Alta linealidad relativa. '}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* PÁGINA COMPOSICIÓN CORPORAL */}
      <div className="pdf-page" style={pageStyle}>
        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 20px 0', color: '#4ade80', borderBottom: '2px solid #4ade80', paddingBottom: '10px' }}>
          COMPOSICIÓN CORPORAL
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#4ade80', color: 'white' }}>
              <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'left' }}>Componente</th>
              <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'center' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>% Grasa Corporal (Faulkner)</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.bodyFatPerc.toFixed(1)}%</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Masa Grasa</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.fatMass.toFixed(1)} kg</td>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Masa Muscular</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.muscleMass.toFixed(1)} kg</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Masa Ósea</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.boneMass.toFixed(1)} kg</td>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Suma 6 Pliegues</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{calculations.sum6.toFixed(1)} mm</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Suma 8 Pliegues</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center' }}>{calculations.sum8.toFixed(1)} mm</td>
            </tr>
          </tbody>
        </table>

        <h3 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '30px 0 15px 0', color: '#4ade80', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>
          DISTRIBUCIÓN DE TEJIDO ADIPOSO
        </h3>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#4ade80', color: 'white' }}>
              <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'left' }}>Región</th>
              <th style={{ padding: '12px', border: '1px solid #22c55e', textAlign: 'center' }}>Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Superior (Tríceps + Subescapular + Bíceps)</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.adiposeSuperior.toFixed(1)}%</td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Central (Abdominal + Supraespinal + Cresta Ilíaca)</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.adiposeCentral.toFixed(1)}%</td>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Inferior (Muslo + Pantorrilla)</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.adiposeInferior.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PÁGINA DISTRIBUCIÓN ADIPOSO-MUSCULAR CON GRÁFICOS */}
      <div className="pdf-page" style={pageStyle}>
        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 20px 0', color: '#4ade80', borderBottom: '2px solid #4ade80', paddingBottom: '10px' }}>
          DISTRIBUCIÓN ADIPOSO-MUSCULAR
        </h2>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 15px 0' }}>Adiposidad y Muscularidad</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#4ade80', color: 'white' }}>
                <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'left' }}>Indicador</th>
                <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center' }}>Actual</th>
                <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center' }}>Perímetro Corregido</th>
                <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center' }}>Z-Score</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Sumatorio 6 pliegues (mm)</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.sum6.toFixed(1)}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>-</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>-</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Sumatorio 8 pliegues (mm)</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.sum8.toFixed(1)}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>-</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>-</td>
              </tr>
            </tbody>
          </table>

          <h3 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '20px 0 15px 0' }}>Muscularidad</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', marginBottom: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#4ade80', color: 'white' }}>
                <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'left' }}>Perímetro</th>
                <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center' }}>Total (cm)</th>
                <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center' }}>Corregido</th>
                <th style={{ padding: '10px', border: '1px solid #22c55e', textAlign: 'center' }}>Z-Score</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Brazo</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{d.girths.arm_relaxed.toFixed(1)}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.armCorr.toFixed(1)} cm</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.zArmCorr.toFixed(2)}</td>
              </tr>
              <tr>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Muslo</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{d.girths.mid_thigh.toFixed(1)}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.thighCorr.toFixed(1)} cm</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.zThighCorr.toFixed(2)}</td>
              </tr>
              <tr style={{ backgroundColor: '#f9fafb' }}>
                <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Pierna</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{d.girths.calf_girth.toFixed(1)}</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.calfCorr.toFixed(1)} cm</td>
                <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>{calculations.zCalfCorr.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
          <div style={{ flex: '0 0 55%' }}>
            <h4 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '10px' }}>Gráfico: Perímetros</h4>
            <div style={{ height: '220px', border: '1px solid #e5e7eb', padding: '15px', backgroundColor: '#f9fafb' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={girthsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" style={{ fontSize: '9pt' }} />
                  <YAxis style={{ fontSize: '9pt' }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '9pt' }} />
                  <Bar dataKey="value" fill="#3b82f6" name="Total" />
                  <Bar dataKey="corrected" fill="#10b981" name="Corregido" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ flex: '0 0 40%' }}>
            <h4 style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '10px' }}>Distribución Corporal</h4>
            <div style={{ position: 'relative', textAlign: 'center', border: '1px solid #e5e7eb', padding: '15px', backgroundColor: '#f9fafb', height: '220px' }}>
              <img 
                src="/cuerpohumano.png" 
                alt="Distribución corporal" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }}
              />
              {/* LEFT SIDE: ADIPOSE PERCENTAGES */}
              <div style={{ position: 'absolute', top: '18%', left: '0', display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '1px', width: '24px', backgroundColor: '#3b82f6' }}></div>
                <div style={{ marginLeft: '4px' }}>
                  <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#1e40af', margin: 0, textTransform: 'uppercase' }}>Superior</p>
                  <p style={{ fontSize: '10pt', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{calculations.adiposeSuperior.toFixed(1)}%</p>
                </div>
              </div>
              <div style={{ position: 'absolute', top: '42%', left: '0', display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '1px', width: '20px', backgroundColor: '#3b82f6' }}></div>
                <div style={{ marginLeft: '4px' }}>
                  <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#1e40af', margin: 0, textTransform: 'uppercase' }}>Central</p>
                  <p style={{ fontSize: '10pt', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{calculations.adiposeCentral.toFixed(1)}%</p>
                </div>
              </div>
              <div style={{ position: 'absolute', top: '75%', left: '0', display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '1px', width: '32px', backgroundColor: '#3b82f6' }}></div>
                <div style={{ marginLeft: '4px' }}>
                  <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#1e40af', margin: 0, textTransform: 'uppercase' }}>Inferior</p>
                  <p style={{ fontSize: '10pt', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{calculations.adiposeInferior.toFixed(1)}%</p>
                </div>
              </div>
              {/* RIGHT SIDE: MUSCLE PERCENTAGES */}
              <div style={{ position: 'absolute', top: '22%', right: '0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ marginRight: '4px', textAlign: 'right' }}>
                  <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#1e40af', margin: 0, textTransform: 'uppercase' }}>Brazo</p>
                  <p style={{ fontSize: '10pt', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{calculations.armPerc.toFixed(1)}%</p>
                </div>
                <div style={{ height: '1px', width: '20px', backgroundColor: '#3b82f6' }}></div>
              </div>
              <div style={{ position: 'absolute', top: '50%', right: '0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ marginRight: '4px', textAlign: 'right' }}>
                  <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#1e40af', margin: 0, textTransform: 'uppercase' }}>Muslo</p>
                  <p style={{ fontSize: '10pt', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{calculations.thighPerc.toFixed(1)}%</p>
                </div>
                <div style={{ height: '1px', width: '28px', backgroundColor: '#3b82f6' }}></div>
              </div>
              <div style={{ position: 'absolute', top: '75%', right: '0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <div style={{ marginRight: '4px', textAlign: 'right' }}>
                  <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#1e40af', margin: 0, textTransform: 'uppercase' }}>Pierna</p>
                  <p style={{ fontSize: '10pt', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{calculations.calfPerc.toFixed(1)}%</p>
                </div>
                <div style={{ height: '1px', width: '32px', backgroundColor: '#3b82f6' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PÁGINA DETALLE ANTROPOMÉTRICO CON PERFIL PLIEGUES */}
      <div className="pdf-page" style={pageStyle}>
        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 20px 0', color: '#4ade80', borderBottom: '2px solid #4ade80', paddingBottom: '10px' }}>
          DETALLE ANTROPOMÉTRICO
        </h2>

        <h3 style={{ fontSize: '13pt', fontWeight: 'bold', margin: '0 0 15px 0' }}>Perfil de Pliegues Cutáneos (mm)</h3>
        
        <div style={{ height: '180px', border: '1px solid #e5e7eb', padding: '15px', backgroundColor: '#f9fafb', marginBottom: '25px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={skinfoldsProfileData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" style={{ fontSize: '9pt' }} />
              <YAxis style={{ fontSize: '9pt' }} label={{ value: 'mm', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '0 0 12px 0' }}>Índices</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <tbody>
                <tr style={{ backgroundColor: '#f9fafb' }}>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>Índice adiposo muscular</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{calculations.adiposeMuscleIndex.toFixed(2)}</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', fontSize: '9pt' }}>
                    {calculations.adiposeMuscleIndex < 0.2 ? 'Bajo' : calculations.adiposeMuscleIndex > 0.3 ? 'Alto' : 'Medio-Alto'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>Índice músculo/óseo</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{calculations.muscleBoneIndex.toFixed(2)}</td>
                  <td style={{ padding: '8px', border: '1px solid #d1d5db', fontSize: '9pt' }}>
                    {calculations.muscleBoneIndex > 5 ? 'Bueno' : 'Normal'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PÁGINA GASTO ENERGÉTICO E ÍNDICES DE SALUD */}
      <div className="pdf-page" style={pageStyle}>
        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 20px 0', color: '#4ade80', borderBottom: '2px solid #4ade80', paddingBottom: '10px' }}>
          ESTIMACIÓN DE GASTO ENERGÉTICO
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt', marginBottom: '30px' }}>
          <thead>
            <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
              <th style={{ padding: '12px', border: '1px solid #2563eb', textAlign: 'left' }}>Harris & Benedict (1919)</th>
              <th style={{ padding: '12px', border: '1px solid #2563eb', textAlign: 'center', width: '20%' }}>1.5</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#f3f4f6' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>INTERPRETACIÓN</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db' }}>Activo. Baja actividad</td>
            </tr>
          </tbody>
        </table>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt', marginBottom: '30px' }}>
          <tbody>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', fontWeight: 'bold', width: '60%' }}>Metabolismo basal (kcal)</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'right', fontWeight: 'bold', fontSize: '14pt' }}>
                {calculations.bmr.toFixed(0)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', fontWeight: 'bold' }}>Gasto energético total (kcal)</td>
              <td style={{ padding: '10px', border: '1px solid #d1d5db', textAlign: 'right', fontWeight: 'bold', fontSize: '14pt' }}>
                {calculations.tdee.toFixed(0)}
              </td>
            </tr>
          </tbody>
        </table>

        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '30px 0 20px 0', color: '#3b82f6', borderBottom: '2px solid #3b82f6', paddingBottom: '10px' }}>
          ÍNDICES DE SALUD
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
              <th style={{ padding: '10px', border: '1px solid #2563eb', textAlign: 'left', width: '5%' }}></th>
              <th style={{ padding: '10px', border: '1px solid #2563eb', textAlign: 'left' }}>Indicador</th>
              <th style={{ padding: '10px', border: '1px solid #2563eb', textAlign: 'center', width: '15%' }}>Valor</th>
              <th style={{ padding: '10px', border: '1px solid #2563eb', textAlign: 'center', width: '20%' }}>Rango Saludable</th>
              <th style={{ padding: '10px', border: '1px solid #2563eb', textAlign: 'left', width: '30%' }}>Interpretación</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const waist = d.girths.waist;
              const waistHip = d.girths.waist / d.girths.hips;
              const conicity = calculations.conicityIndex;
              const abdominal = d.skinfolds.abdominal;
              const bmi = d.basic.mass / Math.pow(d.basic.stature / 100, 2);
              const triceps = d.skinfolds.triceps;

              const getColor = (condition: boolean) => condition ? '#10b981' : condition === false ? '#ef4444' : '#f59e0b';
              
              return (
                <>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColor(waist >= 70 && waist <= 90), margin: '0 auto' }}></div>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Perímetro cintura (cm)</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', backgroundColor: getColor(waist >= 70 && waist <= 90), color: 'white' }}>
                      {waist.toFixed(0)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>70-90</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                      {waist < 70 ? 'Riesgo cardiometabólico bajo' : waist > 90 ? 'Riesgo aumentado' : 'Normal'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColor(waistHip < 0.84), margin: '0 auto' }}></div>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Índice cintura cadera</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', backgroundColor: getColor(waistHip < 0.84), color: 'white' }}>
                      {waistHip.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{'<'} 0.84</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                      {waistHip < 0.84 ? 'Riesgo bajo' : 'Moderado riesgo'}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColor(conicity >= 1.0 && conicity <= 1.4), margin: '0 auto' }}></div>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Índice de conicidad</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', backgroundColor: getColor(conicity >= 1.0 && conicity <= 1.4), color: 'white' }}>
                      {conicity.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>1-1.4</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                      {conicity > 1.4 ? 'Cuenta más lejos de la unidad, más grasa' : 'Normal'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColor(abdominal < 12), margin: '0 auto' }}></div>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Pliegue abdominal (mm)</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', backgroundColor: getColor(abdominal < 12), color: 'white' }}>
                      {abdominal.toFixed(0)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{'<'} 12</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                      {abdominal > 12 ? 'Excesivo > 12' : 'Normal'}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColor(bmi >= 18.5 && bmi <= 24.9), margin: '0 auto' }}></div>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>IMC (kg/m2)</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', backgroundColor: getColor(bmi >= 18.5 && bmi <= 24.9), color: 'white' }}>
                      {bmi.toFixed(1)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>18.5-24.9</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                      {bmi >= 30 ? 'Obesidad grado 1' : bmi >= 25 ? 'Sobrepeso' : 'Normal'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: getColor(triceps < 12), margin: '0 auto' }}></div>
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Pliegue tríceps (mm)</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold', backgroundColor: getColor(triceps < 12), color: 'white' }}>
                      {triceps.toFixed(0)}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center' }}>{'<'} 12</td>
                    <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>
                      {triceps > 12 ? 'Excesivo > 12' : 'Normal'}
                    </td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>
      </div>

      {/* PÁGINA ÍNDICES DE RENDIMIENTO */}
      <div className="pdf-page" style={pageStyle}>
        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', margin: '0 0 20px 0', color: '#3b82f6', borderBottom: '2px solid #3b82f6', paddingBottom: '10px' }}>
          ÍNDICES DE RENDIMIENTO
        </h2>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
              <th style={{ padding: '10px', border: '1px solid #2563eb', textAlign: 'left' }}>Indicador</th>
              <th style={{ padding: '10px', border: '1px solid #2563eb', textAlign: 'center', width: '20%' }}>Valor</th>
              <th style={{ padding: '10px', border: '1px solid #2563eb', textAlign: 'left', width: '45%' }}>Clasificación actual</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Diferencia brazo contraído - relajado</td>
              <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>
                {(d.girths.arm_flexed - d.girths.arm_relaxed).toFixed(1)} cm
              </td>
              <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Desarrollo muscular</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Área superficie corporal</td>
              <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>
                {calculations.bsa.toFixed(2)}
              </td>
              <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Valor normal: 1.9 m2</td>
            </tr>
            <tr style={{ backgroundColor: '#f9fafb' }}>
              <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>Índice de pérdida de calor IPC</td>
              <td style={{ padding: '8px', border: '1px solid #d1d5db', textAlign: 'center', fontWeight: 'bold' }}>
                {calculations.ipc.toFixed(0)}
              </td>
              <td style={{ padding: '8px', border: '1px solid #d1d5db' }}>A mayor área, mayor capacidad para disipar calor</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
