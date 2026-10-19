'use client'

import { CartesianGrid, ComposedChart, Legend, Line, Scatter, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, Ruler, Scale } from 'lucide-react'
import { DashboardSection, type KpiProps } from '@/components/dashboard-section'
import { ChartCard } from '@/components/charts/chart-card'
import { AXIS_TICK, C, GRID_PROPS, LEGEND_PROPS } from '@/components/charts/theme'
import { TooltipCard, TooltipRow, type TooltipProps } from '@/components/charts/tooltip'
import type { GrowthStats, Measurement, Percentile, PercentileRow } from './data'

const PERCENTILE_STYLE: Record<Percentile, { color: string; width: number; dashed: boolean }> = {
  p3: { color: '#F87171', width: 1.5, dashed: true },
  p10: { color: '#FCD34D', width: 1.5, dashed: true },
  p25: { color: '#6EE7B7', width: 1.5, dashed: false },
  p50: { color: '#10B981', width: 3, dashed: false },
  p75: { color: '#6EE7B7', width: 1.5, dashed: false },
  p90: { color: '#FCD34D', width: 1.5, dashed: true },
  p97: { color: '#F87171', width: 1.5, dashed: true },
}

function PercentileChart({ percentiles, measurements, metric, unit, color }: {
  percentiles: PercentileRow[]
  measurements: Measurement[]
  metric: 'weight' | 'height' | 'head'
  unit: string
  color: string
}) {
  const renderTooltip = ({ active, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null
    const age = (payload[0].payload as { age: number }).age
    return (
      <TooltipCard title={`${age} meses`}>
        {payload.map(p => (
          <TooltipRow key={`${p.name}-${p.dataKey}`} label={p.name} value={`${p.value} ${unit}`} color={p.color} />
        ))}
      </TooltipCard>
    )
  }

  return (
    <ComposedChart data={percentiles} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid {...GRID_PROPS} vertical={false} />
      <XAxis
        dataKey="age" type="number" domain={['dataMin', 'dataMax']} allowDecimals={false}
        tick={AXIS_TICK} tickFormatter={v => `${v}m`}
      />
      <YAxis tick={AXIS_TICK} domain={['auto', 'auto']} />
      <Tooltip content={renderTooltip} cursor={{ stroke: C.outline, strokeDasharray: '3 3' }} />
      <Legend {...LEGEND_PROPS} />
      {(Object.keys(PERCENTILE_STYLE) as Percentile[]).map(p => {
        const s = PERCENTILE_STYLE[p]
        return (
          <Line
            key={p} type="monotone" dataKey={p} name={p.toUpperCase()} stroke={s.color} strokeWidth={s.width}
            strokeDasharray={s.dashed ? '3 3' : undefined} dot={false} activeDot={false}
          />
        )
      })}
      <Scatter data={measurements} dataKey={metric} name="Medida real" fill={color} />
    </ComposedChart>
  )
}

export default function GrowthClient({ stats }: { stats: GrowthStats }) {
  const { percentiles, measurements } = stats
  const latest = measurements.at(-1)

  const kpiData: KpiProps[] = [
    { icon: Scale, label: 'Peso Actual', value: latest ? `${latest.weight} kg` : '-' },
    { icon: Ruler, label: 'Altura Actual', value: latest ? `${latest.height} cm` : '-', iconColorClass: 'text-secondary bg-secondary/20' },
    { icon: Activity, label: 'Perímetro Craneal', value: latest ? `${latest.head} cm` : '-', iconColorClass: 'text-error bg-error/20' },
  ]

  const tabs = [
    {
      label: '⚖️ Peso',
      content: (
        <ChartCard title="Evolución del Peso (kg)" height={350}>
          <PercentileChart percentiles={percentiles.weight} measurements={measurements} metric="weight" unit="kg" color={C.primary} />
        </ChartCard>
      ),
    },
    {
      label: '📏 Altura',
      content: (
        <ChartCard title="Evolución de la Altura (cm)" height={350}>
          <PercentileChart percentiles={percentiles.height} measurements={measurements} metric="height" unit="cm" color={C.secondary} />
        </ChartCard>
      ),
    },
    {
      label: '🧠 Craneal',
      content: (
        <ChartCard title="Perímetro Craneal (cm)" height={350}>
          <PercentileChart percentiles={percentiles.head} measurements={measurements} metric="head" unit="cm" color={C.error} />
        </ChartCard>
      ),
    },
  ]

  return (
    <DashboardSection
      title="📈 Crecimiento y Percentiles"
      description="Seguimiento de peso, altura y perímetro craneal."
      kpis={kpiData}
      tabs={tabs}
    />
  )
}
