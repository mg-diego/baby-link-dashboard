'use client'

import { Bar, BarChart, CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { Activity, Baby, Droplet } from 'lucide-react'
import { DashboardSection, type KpiProps } from '@/components/dashboard-section'
import { ChartCard } from '@/components/charts/chart-card'
import { TrendBarChart } from '@/components/charts/trend-bar-chart'
import { AXIS_TICK, C, dateAxisProps, GRID_PROPS } from '@/components/charts/theme'
import { ChartTooltip, TooltipCard, TooltipRow, type TooltipProps } from '@/components/charts/tooltip'
import { DIAPER_LABELS } from '@/lib/classify'
import { formatHour, formatLongDate } from '@/lib/time'
import type { DiaperStats } from './data'

const DIAPER_COLORS = { pee: '#EAB308', mixed: '#F59E0B', poo: '#B45309' }

function PoopTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as DiaperStats['poopTimeline'][number]
  return (
    <TooltipCard title={formatLongDate(d.date)}>
      <TooltipRow label="Hora" value={d.timeStr} color={DIAPER_COLORS.poo} />
    </TooltipCard>
  )
}

export default function DiapersClient({ stats }: { stats: DiaperStats }) {
  const { kpis, dailyComposition, wetTrends, hourlyPoop, poopTimeline } = stats

  const kpiData: KpiProps[] = [
    { icon: Activity, label: 'Media Cambios/Día', value: kpis.avgChanges },
    { icon: Droplet, label: 'Media Mojados/Día', value: kpis.avgWet, iconColorClass: 'text-secondary bg-secondary/20' },
    { icon: Baby, label: 'Media Sucios/Día', value: kpis.avgDirty, iconColorClass: 'text-error bg-error/20' },
  ]

  const tabs = [
    {
      label: 'Overview & Tendencias',
      content: (
        <>
          <ChartCard title="Composición Diaria">
            <TrendBarChart
              data={dailyComposition}
              bars={(['pee', 'mixed', 'poo'] as const).map(t => ({ key: t, name: DIAPER_LABELS[t], color: DIAPER_COLORS[t] }))}
              allowDecimals={false}
            />
          </ChartCard>

          <ChartCard title="Hidratación (Mojados)" description="Pañales con pipí por día y media de 7 días">
            <TrendBarChart
              data={wetTrends}
              bars={[{ key: 'wet', name: 'Total mojados', color: DIAPER_COLORS.pee }]}
              trendKey="wetTrend"
              trendColor="#CA8A04"
              formatValue={v => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
              allowDecimals={false}
            />
          </ChartCard>
        </>
      ),
    },
    {
      label: '💩 Patrones de Caca',
      content: (
        <>
          <ChartCard title="Distribución Horaria">
            <BarChart data={hourlyPoop}>
              <CartesianGrid {...GRID_PROPS} vertical={false} />
              <XAxis dataKey="hour" tick={AXIS_TICK} interval={3} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip content={<ChartTooltip formatLabel={l => l} />} cursor={{ fill: C.surfaceAlt }} />
              <Bar dataKey="count" name="Eventos" fill={DIAPER_COLORS.poo} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>

          <ChartCard title="Línea de Tiempo">
            <ScatterChart>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis {...dateAxisProps()} type="category" allowDuplicatedCategory={false} />
              <YAxis
                dataKey="hourDecimal" type="number" domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]}
                tickFormatter={v => formatHour(v)} tick={AXIS_TICK} reversed
              />
              <ZAxis range={[100, 100]} />
              <Tooltip content={PoopTooltip} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={poopTimeline} fill={DIAPER_COLORS.poo} />
            </ScatterChart>
          </ChartCard>
        </>
      ),
    },
  ]

  return (
    <DashboardSection
      title="🧷 Cambios de Pañal"
      description="Frecuencia y patrones de eliminación."
      kpis={kpiData}
      tabs={tabs}
    />
  )
}
