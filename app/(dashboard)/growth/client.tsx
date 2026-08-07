'use client'

import React from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter } from 'recharts'
import { Scale, Ruler, Activity } from 'lucide-react'
import { DashboardSection, C } from '@/components/dashboard-section'

const GrowthTooltip = ({ active, payload, unit }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-surfaceAlt p-3 rounded-lg shadow-lg border border-outline text-sm min-w-[140px]">
        <p className="font-bold text-foreground mb-2">{data.age} meses</p>
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex justify-between text-sm py-0.5">
            <span className="opacity-80">{p.name}</span>
            <span className="font-bold" style={{ color: p.color }}>
              {p.value} {unit}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export default function GrowthClient({ stats }: { stats: any }) {
  const { weightPercentiles = [], heightPercentiles = [], headPercentiles = [], measurements = [] } = stats || {}

  const formatSeries = (data: any[]) => data.map(row => ({
    age: Number(row.Months ?? row.age),
    p1: Number(row.P1 ?? row.p1),
    p3: Number(row.P3 ?? row.p3),
    p10: Number(row.P10 ?? row.p10),
    p25: Number(row.P25 ?? row.p25),
    p50: Number(row.P50 ?? row.p50),
    p75: Number(row.P75 ?? row.p75),
    p90: Number(row.P90 ?? row.p90),
    p97: Number(row.P97 ?? row.p97),
    p99: Number(row.P99 ?? row.p99),
  }))

  const weightSeries = formatSeries(weightPercentiles)
  const heightSeries = formatSeries(heightPercentiles)
  const headSeries = formatSeries(headPercentiles)

  const latest = measurements.length > 0 
    ? measurements[measurements.length - 1] 
    : { weight: '-', height: '-', head: '-' }

  const kpiData = [
    { 
      icon: Scale, 
      label: "Peso Actual", 
      value: latest.weight !== '-' ? `${latest.weight} kg` : '-', 
      iconColorClass: "text-primary bg-primary/20" 
    },
    { 
      icon: Ruler, 
      label: "Altura Actual", 
      value: latest.height !== '-' ? `${latest.height} cm` : '-', 
      iconColorClass: "text-secondary bg-secondary/20" 
    },
    { 
      icon: Activity, 
      label: "Perímetro Craneal", 
      value: latest.head !== '-' ? `${latest.head} cm` : '-', 
      iconColorClass: "text-error bg-error/20" 
    },
  ]

  const tabsData = [
    {
      label: '⚖️ Peso',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Evolución del Peso (kg)</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                  <XAxis dataKey="age" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<GrowthTooltip unit="kg" />} cursor={{ stroke: C.outline, strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="p3" name="p3" stroke="#F87171" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p10" name="p10" stroke="#FCD34D" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p25" name="p25" stroke="#6EE7B7" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p50" name="p50" stroke="#10B981" dot={false} strokeWidth={3} />
                  <Line type="monotone" dataKey="p75" name="p75" stroke="#6EE7B7" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p90" name="p90" stroke="#FCD34D" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p97" name="p97" stroke="#F87171" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Scatter data={measurements} name="Medida Real" dataKey="weight" fill={C.primary} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )
    },
    {
      label: '📏 Altura',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Evolución de la Altura (cm)</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={heightSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                  <XAxis dataKey="age" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<GrowthTooltip unit="cm" />} cursor={{ stroke: C.outline, strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="p3" name="p3" stroke="#F87171" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p10" name="p10" stroke="#FCD34D" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p25" name="p25" stroke="#6EE7B7" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p50" name="p50" stroke="#10B981" dot={false} strokeWidth={3} />
                  <Line type="monotone" dataKey="p75" name="p75" stroke="#6EE7B7" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p90" name="p90" stroke="#FCD34D" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p97" name="p97" stroke="#F87171" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Scatter data={measurements} name="Medida Real" dataKey="height" fill={C.secondary} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )
    },
    {
      label: '🧠 Craneal',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Perímetro Craneal (cm)</h3>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={headSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                  <XAxis dataKey="age" stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke={C.muted} fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip content={<GrowthTooltip unit="cm" />} cursor={{ stroke: C.outline, strokeDasharray: '3 3' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="p3" name="p3" stroke="#F87171" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p10" name="p10" stroke="#FCD34D" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p25" name="p25" stroke="#6EE7B7" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p50" name="p50" stroke="#10B981" dot={false} strokeWidth={3} />
                  <Line type="monotone" dataKey="p75" name="p75" stroke="#6EE7B7" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p90" name="p90" stroke="#FCD34D" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Line type="monotone" dataKey="p97" name="p97" stroke="#F87171" strokeDasharray="3 3" dot={false} strokeWidth={1.5} />
                  <Scatter data={measurements} name="Medida Real" dataKey="head" fill={C.error} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <DashboardSection 
      title="📈 Crecimiento y Percentiles"
      description="Seguimiento de peso, altura y perímetro craneal."
      kpis={kpiData}
      tabs={tabsData}
    />
  )
}