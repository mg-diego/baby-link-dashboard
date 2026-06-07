'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Utensils, Milk, Timer } from 'lucide-react'
import { DashboardSection, ChartTooltip, C } from '@/components/dashboard-section'

export default function FeedingClient({ stats }: { stats: any }) {
  const { kpis, dailyComposition, bottleTrends, nursingTrends } = stats

  // 1. Preparamos los KPIs para el Layout Genérico
  const kpiData = [
    { 
      icon: Utensils, 
      label: "Tomas / Día", 
      value: kpis.avgFeeds, 
      iconColorClass: "text-primary bg-primary/20" 
    },
    { 
      icon: Milk, 
      label: "Media Biberón (ml)", 
      value: `${kpis.avgMl} ml`, 
      iconColorClass: "text-secondary bg-secondary/20" 
    },
    { 
      icon: Timer, 
      label: "Media Pecho (min)", 
      value: `${kpis.avgNursingMins} m`, 
      iconColorClass: "text-error bg-error/20" 
    },
  ]

  // 2. Preparamos el contenido de cada pestaña
  const tabsData = [
    {
      label: 'Composición Diaria',
      content: (
        <div className="animate-in fade-in duration-500">
          <h3 className="text-lg font-semibold text-foreground mb-6">Tipos de Tomas por Día</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyComposition} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                <XAxis dataKey="date" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: C.surfaceAlt }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="nursing" name="Pecho" stackId="a" fill={C.error} radius={[0, 0, 4, 4]} />
                <Bar dataKey="bottle" name="Biberón" stackId="a" fill={C.secondary} />
                <Bar dataKey="solids" name="Sólidos" stackId="a" fill={C.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      label: 'Volumen Biberón',
      content: (
        <div className="animate-in fade-in duration-500">
          <h3 className="text-lg font-semibold text-foreground mb-6">Cantidad Diaria (ml)</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bottleTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                <XAxis dataKey="date" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: C.surfaceAlt }} />
                <Bar dataKey="totalMl" name="Mililitros" fill={C.secondary} radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      label: 'Duración Pecho',
      content: (
        <div className="animate-in fade-in duration-500">
          <h3 className="text-lg font-semibold text-foreground mb-6">Minutos de Pecho Diarios</h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nursingTrends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                <XAxis dataKey="date" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: C.surfaceAlt }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="L" name="Izquierdo" stackId="a" fill={C.error} radius={[0, 0, 4, 4]} />
                <Bar dataKey="R" name="Derecho" stackId="a" fill="#E8A0A0" />
                <Bar dataKey="U" name="Indefinido" stackId="a" fill="#DCA0A0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }
  ]

  // 3. Renderizamos a través del componente Layout
  return (
    <DashboardSection 
      title="🍼 Alimentación"
      description="Tomas de pecho, biberón y sólidos."
      kpis={kpiData}
      tabs={tabsData}
    />
  )
}