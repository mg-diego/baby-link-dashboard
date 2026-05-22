'use client'

import { useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

// 1. MOCK DATA (Simulando lo que te devolverá Supabase + tu lógica)
const mockSleepTrends = [
  { date: '01 May', durationHours: 11.5, avg7Days: 12.1 },
  { date: '02 May', durationHours: 12.2, avg7Days: 12.0 },
  { date: '03 May', durationHours: 10.8, avg7Days: 11.9 },
  { date: '04 May', durationHours: 13.1, avg7Days: 12.0 },
  { date: '05 May', durationHours: 12.5, avg7Days: 12.1 },
  { date: '06 May', durationHours: 11.9, avg7Days: 12.0 },
  { date: '07 May', durationHours: 12.4, avg7Days: 12.0 },
]

export default function SleePage() {
  const [activeTab, setActiveTab] = useState('trends')

  const tabs = [
    { id: 'trends', label: 'Tendencias' },
    { id: 'naps', label: 'Siestas' },
    { id: 'night', label: 'Noche' },
    { id: 'timeline', label: 'Timeline (Gantt)' },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* Cabecera y Selector de Pestañas */}
        <div className="border-b border-gray-200 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">💤 Patrones de Sueño</h1>
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido Dinámico según la pestaña */}
        
        {/* --- PESTAÑA: TENDENCIAS --- */}
        {activeTab === 'trends' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Total de sueño por día</h3>
                <p className="text-sm text-gray-500">Horas totales dormidas frente a la media móvil de 7 días.</p>
              </div>
              
              {/* Gráfico Recharts: ComposedChart (Barras + Línea) */}
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mockSleepTrends} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      domain={[0, 24]}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value} h`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                    
                    {/* Barra de sueño diario (Azul) */}
                    <Bar 
                      dataKey="durationHours" 
                      name="Total Dormido" 
                      fill="#60A5FA" 
                      radius={[6, 6, 0, 0]} 
                      maxBarSize={50}
                    />
                    
                    {/* Línea de Media Móvil (Naranja/Gris oscuro) */}
                    <Line 
                      type="monotone" 
                      dataKey="avg7Days" 
                      name="Media (7 días)" 
                      stroke="#4B5563" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Aquí irían los otros dos gráficos de la pestaña Trends: Hora de despertar y Hora de acostarse */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-[300px] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400">
                Gráfico: Hora de Despertar
              </div>
              <div className="h-[300px] bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400">
                Gráfico: Hora de Acostarse
              </div>
            </div>

          </div>
        )}

        {/* --- PESTAÑA: SIESTAS --- */}
        {activeTab === 'naps' && (
          <div className="h-[400px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            Gráfico Apilado de Siestas y Evolución de Wake Windows
          </div>
        )}

        {/* --- PESTAÑA: NOCHE --- */}
        {activeTab === 'night' && (
          <div className="h-[400px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            Histograma y Gráfico Scatter de Despertares
          </div>
        )}

        {/* --- PESTAÑA: TIMELINE --- */}
        {activeTab === 'timeline' && (
          <div className="h-[400px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
            Gráfico de Gantt (Próximamente con react-plotly.js)
          </div>
        )}

      </div>
    </div>
  )
}