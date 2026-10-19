'use client'

import { CartesianGrid, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { Milk, Timer, Utensils } from 'lucide-react'
import { DashboardSection, type KpiProps } from '@/components/dashboard-section'
import { ChartCard } from '@/components/charts/chart-card'
import { TrendBarChart } from '@/components/charts/trend-bar-chart'
import { AXIS_TICK, C, GRID_PROPS } from '@/components/charts/theme'
import { TooltipCard, TooltipRow, type TooltipProps } from '@/components/charts/tooltip'
import { withTrend } from '@/lib/stats'
import { formatHour, formatLongDate } from '@/lib/time'
import type { FeedStats } from './data'

const MILK_COLORS = [C.secondary, '#7AD6D6', '#F6B15C', '#6BCFA0']

function BottleScatterTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as FeedStats['bottleScatter'][number]
  return (
    <TooltipCard title={formatLongDate(d.date)}>
      <TooltipRow label="Hora" value={formatHour(d.hourDecimal)} color={C.secondary} />
      <TooltipRow label="Cantidad" value={`${d.amountMl} ml`} color={C.secondary} />
      <TooltipRow label="Tipo" value={d.milkType} color={C.secondary} />
    </TooltipCard>
  )
}

export default function FeedingClient({ stats }: { stats: FeedStats }) {
  const { kpis, dailyComposition, nursingTrends, nursingGaps, bottleByType, bottleScatter, milkTypes } = stats

  const kpiData: KpiProps[] = [
    { icon: Utensils, label: 'Tomas / Día', value: kpis.avgFeeds },
    { icon: Milk, label: 'Media Biberón (ml)', value: `${kpis.avgMl} ml`, iconColorClass: 'text-secondary bg-secondary/20' },
    { icon: Timer, label: 'Media Pecho (min)', value: `${kpis.avgNursingMins} m`, iconColorClass: 'text-error bg-error/20' },
  ]

  const tabs = [
    {
      label: 'Pecho',
      content: (
        <>
          <ChartCard title="Minutos de Pecho Diarios" description="Tiempo total al pecho desglosado por lado">
            <TrendBarChart
              data={withTrend(nursingTrends, 'totalMins')}
              bars={[
                { key: 'L', name: 'Izquierdo', color: C.error },
                { key: 'R', name: 'Derecho', color: '#E8A0A0' },
                { key: 'U', name: 'Indefinido', color: '#DCA0A0' },
              ]}
              trendKey="totalMinsTrend"
              formatValue={v => `${v.toFixed(0)} m`}
              yTickFormatter={v => `${v}m`}
              dividerColor={C.error}
            />
          </ChartCard>

          <ChartCard title="Tiempo Medio Entre Tomas" description="Distancia promedio en horas entre cada toma de pecho">
            <TrendBarChart
              data={withTrend(nursingGaps, 'avgGapH')}
              bars={[{ key: 'avgGapH', name: 'Promedio', color: C.error }]}
              trendKey="avgGapHTrend"
              formatValue={v => `${v.toFixed(1)} h`}
              yTickFormatter={v => `${v}h`}
              dividerColor={C.error}
            />
          </ChartCard>
        </>
      ),
    },
    {
      label: 'Biberón',
      content: (
        <>
          <ChartCard title="Volumen Ingerido por Tipo" description="Cantidad total diaria segmentada por tipo de leche">
            <TrendBarChart
              data={bottleByType}
              bars={milkTypes.map((type, i) => ({ key: type, name: type, color: MILK_COLORS[i % MILK_COLORS.length] }))}
              formatValue={v => `${v} ml`}
              yTickFormatter={v => `${v}ml`}
              dividerColor={C.secondary}
            />
          </ChartCard>

          <ChartCard title="Frecuencia de Biberones" description="Cantidad total de tomas de biberón por día">
            <TrendBarChart
              data={withTrend(dailyComposition, 'bottle')}
              bars={[{ key: 'bottle', name: 'Biberones', color: C.secondary }]}
              trendKey="bottleTrend"
              formatValue={v => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
              allowDecimals={false}
              dividerColor={C.secondary}
            />
          </ChartCard>

          <ChartCard title="Distribución Horaria y Tamaños" description="Relación entre la hora de la toma y la cantidad ingerida">
            <ScatterChart>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis
                dataKey="hourDecimal" type="number" domain={[0, 24]} ticks={[0, 4, 8, 12, 16, 20, 24]}
                tick={AXIS_TICK} tickFormatter={v => formatHour(v)} name="Hora"
              />
              <YAxis dataKey="amountMl" type="number" tick={AXIS_TICK} tickFormatter={v => `${v}ml`} name="Cantidad" />
              <ZAxis range={[60, 60]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} content={BottleScatterTooltip} />
              <Scatter data={bottleScatter} fill={C.secondary} fillOpacity={0.6} />
            </ScatterChart>
          </ChartCard>
        </>
      ),
    },
    {
      label: 'Sólidos',
      content: (
        <ChartCard title="Tomas de Sólidos por Día" description="Cantidad de veces que ha comido sólidos al día">
          <TrendBarChart
            data={withTrend(dailyComposition, 'solids')}
            bars={[{ key: 'solids', name: 'Tomas', color: C.primary }]}
            trendKey="solidsTrend"
            formatValue={v => (Number.isInteger(v) ? String(v) : v.toFixed(1))}
            allowDecimals={false}
          />
        </ChartCard>
      ),
    },
  ]

  return (
    <DashboardSection
      title="🍼 Alimentación"
      description="Análisis detallado de pecho, biberones y sólidos."
      kpis={kpiData}
      tabs={tabs}
    />
  )
}
