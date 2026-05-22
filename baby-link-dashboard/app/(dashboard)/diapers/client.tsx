'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line, ScatterChart, Scatter, ZAxis, Rectangle
} from 'recharts'
import { Droplet, Baby, Activity, AlertTriangle } from 'lucide-react'

const ScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surface-containerHighest p-3 rounded-lg shadow-lg border border-outline text-sm">
        <p className="font-bold text-foreground">{data.date}</p>
        <p className="text-primary">Hora: {data.timeStr}</p>
      </div>
    )
  }
  return null
}

const CustomAlertTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surface-containerHighest p-3 rounded-lg shadow-lg border border-outline text-sm">
        <p className="font-bold text-foreground">{data.date}</p>
        <p className="text-error">Días sin caca: {data.daysWithoutPoo}</p>
      </div>
    )
  }
  return null
}

export default function DiapersClient({ stats }: { stats: any }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { kpis, dailyComposition, wetTrends, hourlyPoop, poopTimeline, constipationAlerts, nightCorrelations } = stats

  return (
    <div className="space-y-6">
      <div className="bg-surface p-8 rounded-2xl shadow-sm border border-outline">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">🧷 Cambios de Pañal</h1>
          <p className="text-onSurfaceVariant">Frecuencia y patrones de eliminación.</p>
        </div>

        {/* --- KPIs Rápidos --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface-containerHighest p-4 rounded-xl border border-outline flex items-center gap-4">
            <div className="bg-primary/20 p-3 rounded-lg text-primary"><Activity size={24}/></div>
            <div>
              <p className="text-sm text-onSurfaceVariant">Media Cambios/Día</p>
              <p className="text-2xl font-bold text-foreground">{kpis.avgChanges}</p>
            </div>
          </div>
          <div className="bg-surface-containerHighest p-4 rounded-xl border border-outline flex items-center gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-lg text-yellow-500"><Droplet size={24}/></div>
            <div>
              <p className="text-sm text-onSurfaceVariant">Media Mojados/Día</p>
              <p className="text-2xl font-bold text-foreground">{kpis.avgWet}</p>
            </div>
          </div>
          <div className="bg-surface-containerHighest p-4 rounded-xl border border-outline flex items-center gap-4">
            <div className="bg-amber-700/20 p-3 rounded-lg text-amber-600"><Baby size={24}/></div>
            <div>
              <p className="text-sm text-onSurfaceVariant">Media Sucios/Día</p>
              <p className="text-2xl font-bold text-foreground">{kpis.avgDirty}</p>
            </div>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="border-b border-outline mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-onSurfaceVariant hover:text-foreground'
              }`}
            >
              Overview & Tendencias
            </button>
            <button
              onClick={() => setActiveTab('poop')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'poop' ? 'border-amber-600 text-amber-600' : 'border-transparent text-onSurfaceVariant hover:text-foreground'
              }`}
            >
              💩 Patrones de Caca
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === 'health' ? 'border-error text-error' : 'border-transparent text-onSurfaceVariant hover:text-foreground'
              }`}
            >
              <AlertTriangle size={16} /> Salud y Noche
            </button>
          </nav>
        </div>

        {/* --- CONTENIDO DE TABS --- */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Gráfico Apilado */}
            <div className="bg-background p-6 rounded-xl border border-outline w-full">
              <h3 className="text-lg font-semibold text-foreground mb-1">Composición Diaria</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyComposition} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E3250" />
                    <XAxis dataKey="date" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#242746', borderColor: '#2E3250', color: '#E8EAF6' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="Pee" stackId="a" fill="#EAB308" radius={[0, 0, 4, 4]} />
                    <Bar dataKey="Mixed" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="Poo" stackId="a" fill="#B45309" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráfico de Tendencia Mojados */}
            <div className="bg-background p-6 rounded-xl border border-outline w-full">
              <h3 className="text-lg font-semibold text-foreground mb-1">Hidratación (Mojados)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={wetTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E3250" />
                    <XAxis dataKey="date" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#242746', borderColor: '#2E3250', color: '#E8EAF6' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="count" name="Total Mojados" fill="#EAB308" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Line type="monotone" dataKey="rolling" name="Media (7d)" stroke="#CA8A04" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'poop' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Histograma de Horas */}
            <div className="bg-background p-6 rounded-xl border border-outline w-full">
              <h3 className="text-lg font-semibold text-foreground mb-1">Distribución Horaria</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyPoop} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E3250" />
                    <XAxis dataKey="hour" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#242746', borderColor: '#2E3250', color: '#E8EAF6' }} cursor={{fill: '#242746'}}/>
                    <Bar dataKey="count" name="Eventos" fill="#B45309" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scatter Timeline */}
            <div className="bg-background p-6 rounded-xl border border-outline w-full">
              <h3 className="text-lg font-semibold text-foreground mb-1">Línea de Tiempo</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E3250" />
                    <XAxis dataKey="date" type="category" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis 
                      dataKey="hourDecimal" 
                      type="number" 
                      domain={[0, 24]} 
                      ticks={[0, 4, 8, 12, 16, 20, 24]}
                      tickFormatter={(val) => `${val.toString().padStart(2, '0')}:00`}
                      stroke="#7986CB" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      reversed
                    />
                    <ZAxis range={[100, 100]} />
                    <Tooltip content={<ScatterTooltip />} cursor={{strokeDasharray: '3 3'}} />
                    <Scatter data={poopTimeline} fill="#B45309" shape="circle" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Alerta de Estreñimiento */}
            <div className="bg-background p-6 rounded-xl border border-outline w-full">
              <h3 className="text-lg font-semibold text-foreground mb-1">Alerta de Regularidad (Estreñimiento)</h3>
              <p className="text-xs text-onSurfaceVariant mb-6">Días consecutivos sin registrar un pañal sucio.</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={constipationAlerts} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E3250" />
                    <XAxis dataKey="date" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomAlertTooltip />} cursor={{fill: '#242746'}} />
                    <Bar 
                      dataKey="daysWithoutPoo" 
                      name="Días sin caca"
                      shape={(props: any) => {
                        const barColor = props.payload.daysWithoutPoo >= 3 ? '#F09595' : '#7986CB';
                        return <Rectangle {...props} fill={barColor} />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Correlación Sueño vs Pañales Nocturnos */}
            <div className="bg-background p-6 rounded-xl border border-outline w-full">
              <h3 className="text-lg font-semibold text-foreground mb-1">Correlación: Pañales Nocturnos vs Despertares</h3>
              <p className="text-xs text-onSurfaceVariant mb-6">Eventos ocurridos entre las 22:00 y las 06:00.</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={nightCorrelations} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2E3250" />
                    <XAxis dataKey="date" stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#7986CB" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#242746', borderColor: '#2E3250', color: '#E8EAF6' }} />
                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                    <Bar dataKey="nightDiapers" name="Pañales Nocturnos" fill="#7BB8F0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Line type="monotone" dataKey="nightWakings" name="Despertares (Night Wakings)" stroke="#F09595" strokeWidth={3} dot={true} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}