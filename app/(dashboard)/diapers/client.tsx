'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line, ScatterChart, Scatter, ZAxis, Rectangle
} from 'recharts'
import { Droplet, Baby, Activity } from 'lucide-react'
import { DashboardSection, ChartTooltip, C } from '@/components/dashboard-section'

// --- Custom Tooltips ---
const ScatterTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surfaceAlt p-3 rounded-lg shadow-lg border border-outline text-sm">
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
      <div className="bg-surfaceAlt p-3 rounded-lg shadow-lg border border-outline text-sm">
        <p className="font-bold text-foreground">{data.date}</p>
        <p className="text-error">Días sin caca: {data.daysWithoutPoo}</p>
      </div>
    )
  }
  return null
}

// --- Componente Principal ---
export default function DiapersClient({ stats }: { stats: any }) {
  const { kpis, dailyComposition, wetTrends, hourlyPoop, poopTimeline, constipationAlerts, nightCorrelations } = stats

  // 1. Configuración de KPIs
  const kpiData = [
    { 
      icon: Activity, 
      label: "Media Cambios/Día", 
      value: kpis.avgChanges, 
      iconColorClass: "text-primary bg-primary/20" 
    },
    { 
      icon: Droplet, 
      label: "Media Mojados/Día", 
      value: kpis.avgWet, 
      iconColorClass: "text-secondary bg-secondary/20" 
    },
    { 
      icon: Baby, 
      label: "Media Sucios/Día", 
      value: kpis.avgDirty, 
      iconColorClass: "text-error bg-error/20" 
    },
  ]

  // 2. Configuración de Pestañas
  const tabsData = [
    {
      label: 'Overview & Tendencias',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Gráfico Apilado */}
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Composición Diaria</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyComposition} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                  <XAxis dataKey="date" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: C.surfaceAlt }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="Pee" stackId="a" fill="#EAB308" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Mixed" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="Poo" stackId="a" fill="#B45309" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Tendencia Mojados */}
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Hidratación (Mojados)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={wetTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                  <XAxis dataKey="date" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: C.surfaceAlt }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="count" name="Total Mojados" fill="#EAB308" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="rolling" name="Media (7d)" stroke="#CA8A04" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )
    },
    {
      label: '💩 Patrones de Caca',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Histograma de Horas */}
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Distribución Horaria</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyPoop} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                  <XAxis dataKey="hour" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: C.surfaceAlt }} />
                  <Bar dataKey="count" name="Eventos" fill="#B45309" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scatter Timeline */}
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Línea de Tiempo</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis dataKey="date" type="category" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis 
                    dataKey="hourDecimal" 
                    type="number" 
                    domain={[0, 24]} 
                    ticks={[0, 4, 8, 12, 16, 20, 24]}
                    tickFormatter={(val) => `${val.toString().padStart(2, '0')}:00`}
                    stroke={C.muted} 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    reversed
                  />
                  <ZAxis range={[100, 100]} />
                  <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={poopTimeline} fill="#B45309" shape="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )
    },
    {
      label: '⚠️ Salud y Noche',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Alerta de Estreñimiento */}
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Alerta de Regularidad (Estreñimiento)</h3>
            <p className="text-xs text-onSurface/40 mb-3">Días consecutivos sin registrar un pañal sucio.</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={constipationAlerts} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                  <XAxis dataKey="date" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomAlertTooltip />} cursor={{ fill: C.surfaceAlt }} />
                  <Bar 
                    dataKey="daysWithoutPoo" 
                    name="Días sin caca"
                    shape={(props: any) => {
                      const barColor = props.payload.daysWithoutPoo >= 3 ? C.error : C.muted;
                      return <Rectangle {...props} fill={barColor} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Correlación Sueño vs Pañales Nocturnos */}
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Correlación: Pañales Nocturnos vs Despertares</h3>
            <p className="text-xs text-onSurface/40 mb-3">Eventos ocurridos entre las 22:00 y las 06:00.</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={nightCorrelations} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                  <XAxis dataKey="date" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: C.surfaceAlt }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar dataKey="nightDiapers" name="Pañales Nocturnos" fill={C.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="nightWakings" name="Despertares" stroke={C.error} strokeWidth={3} dot={true} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )
    }
  ]

  // 3. Renderizamos a través del componente Layout Genérico
  return (
    <DashboardSection 
      title="🧷 Cambios de Pañal"
      description="Frecuencia y patrones de eliminación."
      kpis={kpiData}
      tabs={tabsData}
    />
  )
}