'use client'

import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from 'recharts'
import { formatLongDate } from '@/lib/time'
import { renderMonthDividers } from './month-dividers'
import { AXIS_TICK, C, dateAxisProps, GRID_PROPS, LEGEND_PROPS } from './theme'
import { TooltipCard, TooltipRow, TrendRow, type TooltipProps } from './tooltip'

export interface BarSeries {
  key: string
  name: string
  color: string
}

interface TrendBarChartProps {
  data: { date: string }[]
  /** Una serie = barra simple; varias = barras apiladas. */
  bars: BarSeries[]
  /** Clave de la media móvil (ver `withTrend`). */
  trendKey?: string
  trendColor?: string
  formatValue?: (v: number) => string
  yTickFormatter?: (v: number) => string
  allowDecimals?: boolean
  dividerColor?: string
  legend?: boolean
}

/** Barras diarias (simples o apiladas) + línea de tendencia + divisores de mes. */
export function TrendBarChart({
  data, bars, trendKey, trendColor = C.trend,
  formatValue = v => String(v), yTickFormatter, allowDecimals = true,
  dividerColor = C.primary, legend = true,
}: TrendBarChartProps) {
  const stacked = bars.length > 1

  const renderTooltip = ({ active, payload, label }: TooltipProps) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload as Record<string, number | null>
    const trend = trendKey ? d[trendKey] : null
    return (
      <TooltipCard title={formatLongDate(String(label ?? ''))}>
        {bars
          .filter(b => !stacked || Number(d[b.key]) > 0)
          .map(b => <TooltipRow key={b.key} label={b.name} value={formatValue(Number(d[b.key] ?? 0))} color={b.color} />)}
        {trend !== null && trend !== undefined && <TrendRow value={formatValue(trend)} color={trendColor} />}
      </TooltipCard>
    )
  }

  return (
    <ComposedChart data={data}>
      <CartesianGrid {...GRID_PROPS} />
      <XAxis {...dateAxisProps()} />
      <YAxis tick={AXIS_TICK} allowDecimals={allowDecimals} tickFormatter={yTickFormatter} />
      {renderMonthDividers(data, dividerColor)}
      <Tooltip cursor={{ fill: C.surfaceAlt, opacity: 0.4 }} content={renderTooltip} />
      {legend && <Legend {...LEGEND_PROPS} />}
      {bars.map((b, i) => (
        <Bar
          key={b.key}
          dataKey={b.key}
          name={b.name}
          stackId={stacked ? 'stack' : undefined}
          fill={b.color}
          fillOpacity={0.85}
          maxBarSize={32}
          radius={i === bars.length - 1 ? [4, 4, 0, 0] : 0}
        />
      ))}
      {trendKey && (
        <Line
          type="monotone" dataKey={trendKey} name="Tendencia" stroke={trendColor}
          strokeWidth={3} strokeDasharray="5 5" dot={false} activeDot={false}
        />
      )}
    </ComposedChart>
  )
}
