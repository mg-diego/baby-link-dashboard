'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Area, Bar, BarChart, type BarShapeProps, CartesianGrid, ComposedChart, Legend, Line, LineChart,
  Rectangle, ReferenceLine, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from 'recharts'
import { BellRing, Clock, Moon, Sparkles, Sunrise, Target } from 'lucide-react'
import { DashboardSection, KpiCard, type KpiProps } from '@/components/dashboard-section'
import { ChartCard } from '@/components/charts/chart-card'
import { renderMonthDividers } from '@/components/charts/month-dividers'
import { TrendBarChart } from '@/components/charts/trend-bar-chart'
import { AXIS_TICK, C, dateAxisProps, GRID_PROPS, LEGEND_PROPS } from '@/components/charts/theme'
import { ChartTooltip, TooltipCard, TooltipRow, TrendRow, type TooltipProps } from '@/components/charts/tooltip'
import { average, groupBy, withTrend } from '@/lib/stats'
import { formatHour, formatLongDate, isWeekend } from '@/lib/time'
import type { GanttStatus, SleepStats } from './data'

const STATUS: Record<GanttStatus, { color: string; label: string }> = {
  night_solid: { color: '#6BCFA0', label: 'Sueño sólido' },
  night_interrupted: { color: '#FFAA60', label: 'Sueño interrumpido' },
  night_waking: { color: '#FF5C5C', label: 'Despertar nocturno' },
  nap: { color: '#A78BFA', label: 'Siesta' },
}

const NAP_COLORS = ['#B8A0E8', '#9B7FDB', '#7B5FC4', '#5C40A0', '#3D2280']
const PREDICTION_MARGIN_MIN = 15
const fmt1 = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))

// ── Timeline (gantt vertical en SVG) ─────────────────────────────────────────

const CHART_H = 800
const TOP = 28
const COL_W = 100
const LEFT = 52
const TOTAL_H = TOP + CHART_H
const Y_TICKS = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]

const hourToY = (h: number) => TOP + (h / 24) * CHART_H
const durToH = (d: number) => (d / 24) * CHART_H

function SleepCalendar({ ganttByDate }: { ganttByDate: SleepStats['ganttByDate'] }) {
  const [nightMode, setNightMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
  }, [ganttByDate, nightMode])

  // Modo noche: cada columna va de 12:00 a 12:00 del día siguiente.
  const columns = useMemo(() => {
    if (!nightMode) {
      return ganttByDate.map(day => ({
        ...day,
        events: day.events.map(e => ({ ...e, displayHour: e.startHour, displayDuration: e.duration })),
      }))
    }
    return ganttByDate.map((day, i) => {
      const pm = day.events
        .filter(e => e.startHour >= 12)
        .map(e => ({ ...e, displayHour: e.startHour - 12, displayDuration: Math.min(e.duration, 24 - (e.startHour - 12)) }))
      const am = (ganttByDate[i + 1]?.events ?? [])
        .filter(e => e.startHour < 12)
        .map(e => ({ ...e, displayHour: e.startHour + 12, displayDuration: Math.min(e.duration, 24 - (e.startHour + 12)) }))
      return { ...day, events: [...pm, ...am] }
    })
  }, [ganttByDate, nightMode])

  if (!ganttByDate.length) return <p className="text-on-surface/40 text-sm">Sin datos</p>

  const svgW = columns.length * COL_W
  const yTickLabel = (h: number) => `${((nightMode ? h + 12 : h) % 24).toString().padStart(2, '0')}:00`

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-4">
          {Object.values(STATUS).map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-xs text-on-surface/60">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              {label}
            </span>
          ))}
        </div>
        <button
          onClick={() => setNightMode(n => !n)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            nightMode ? 'bg-primary-container text-primary border-primary/30' : 'bg-surface-container text-on-surface/60 border-outline'
          }`}
        >
          {nightMode ? '🌙 Modo noche' : '☀️ Modo día'}
        </button>
      </div>

      <div className="flex">
        <div className="shrink-0 relative border-r border-outline/30" style={{ width: LEFT, height: TOTAL_H }}>
          {Y_TICKS.map(h => (
            <div
              key={h}
              className="absolute right-2 text-xs text-on-surface/40 select-none -translate-y-1/2"
              style={{ top: hourToY(h) }}
            >
              {yTickLabel(h)}
            </div>
          ))}
        </div>

        <div ref={scrollRef} className="overflow-x-auto flex-1 scrollbar-custom">
          <svg width={svgW} height={TOTAL_H}>
            {Y_TICKS.map(h => (
              <line
                key={h} x1={0} y1={hourToY(h)} x2={svgW} y2={hourToY(h)}
                stroke={C.outline} strokeWidth={h === 0 || h === 24 ? 1 : 0.5}
              />
            ))}

            {nightMode && (
              <line
                x1={0} y1={hourToY(12)} x2={svgW} y2={hourToY(12)}
                stroke={C.primary} strokeWidth={1} strokeDasharray="4 3" opacity={0.4}
              />
            )}

            {columns.map((col, i) => {
              const x = i * COL_W
              const weekend = isWeekend(col.date)
              return (
                <g key={col.date}>
                  <rect
                    x={x} y={TOP} width={COL_W} height={CHART_H}
                    fill={i % 2 === 0 ? 'rgba(26,29,46,0.4)' : 'rgba(36,39,70,0.2)'}
                  />
                  {weekend && <rect x={x} y={TOP} width={COL_W} height={CHART_H} fill={C.primary} fillOpacity={0.06} />}
                  <line x1={x} y1={0} x2={x} y2={TOTAL_H} stroke={C.outline} strokeWidth={0.5} />
                  <text
                    x={x + COL_W / 2} y={TOP - 8} textAnchor="middle" fontSize={10}
                    fill={weekend ? C.primary : C.onSurface}
                    opacity={weekend ? 0.9 : 0.6}
                    fontWeight={weekend ? 600 : 400}
                  >
                    {col.label}
                  </text>

                  {col.events.map((ev, j) => {
                    const PAD = 5
                    return (
                      <rect
                        key={j}
                        x={x + PAD} y={hourToY(ev.displayHour)}
                        width={COL_W - PAD * 2} height={Math.max(2, durToH(ev.displayDuration))}
                        fill={STATUS[ev.status].color} rx={3} opacity={0.85}
                      >
                        <title>{`${STATUS[ev.status].label}\n${ev.startTimeStr} – ${ev.endTimeStr}\n${ev.durationStr}`}</title>
                      </rect>
                    )
                  })}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}

// ── Gráficas reutilizadas dentro de la sección ───────────────────────────────

/** Hora del día (despertar / acostarse) por fecha, con tendencia y media. */
function TimeOfDayChart({ data, name, color }: {
  data: SleepStats['wakeUpTimes']
  name: string
  color: string
}) {
  const withAvg = withTrend(data, 'hourDecimal')
  return (
    <LineChart data={withAvg}>
      <CartesianGrid {...GRID_PROPS} />
      <XAxis {...dateAxisProps()} />
      <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} tick={AXIS_TICK} tickFormatter={formatHour} />
      {renderMonthDividers(withAvg, C.primary)}
      <Tooltip content={<ChartTooltip formatValue={formatHour} />} />
      <Line type="monotone" dataKey="hourDecimal" name={name} stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      <Line type="monotone" dataKey="hourDecimalTrend" name="Tendencia" stroke={C.trend} strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
      <ReferenceLine y={average(data.map(d => d.hourDecimal))} stroke={C.muted} strokeDasharray="4 4" />
    </LineChart>
  )
}

/** Error de predicción en minutos, coloreado según el margen. */
function DeviationChart({ data, dataKey, name, labelKey }: {
  data: object[]
  dataKey: string
  name: string
  labelKey: string
}) {
  const colorFor = (err: number) =>
    Math.abs(err) <= PREDICTION_MARGIN_MIN ? C.good : Math.abs(err) <= 30 ? C.warn : C.error

  return (
    <BarChart data={data}>
      <CartesianGrid {...GRID_PROPS} vertical={false} />
      <XAxis dataKey={labelKey} type="category" tick={AXIS_TICK} tickFormatter={(v: string) => v.split(' - ')[0]} />
      <YAxis tick={AXIS_TICK} tickFormatter={v => `${v}m`} />
      <Tooltip content={<ChartTooltip formatValue={v => `${v} min`} formatLabel={l => l} />} cursor={{ fill: C.surfaceAlt }} />
      <ReferenceLine y={0} stroke={C.muted} />
      <Bar
        dataKey={dataKey}
        name={name}
        shape={(props: BarShapeProps) => (
          <Rectangle {...props} fill={colorFor(Number(props.payload?.[dataKey]))} fillOpacity={0.85} />
        )}
      />
    </BarChart>
  )
}

function WakeWindowTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload as { date: string; windows: { name: string; str: string }[]; avgWindowTrend: number | null }
  return (
    <TooltipCard title={formatLongDate(d.date)}>
      {d.windows.map(w => <TooltipRow key={w.name} label={w.name} value={w.str} color={C.primary} />)}
      {d.avgWindowTrend !== null && <TrendRow value={`${d.avgWindowTrend.toFixed(1)}h`} color={C.trendAlt} />}
    </TooltipCard>
  )
}

function NightWakingTooltip({ active, payload }: TooltipProps) {
  const d = payload?.[0]?.payload as SleepStats['nightWakingScatter'][number] | undefined
  if (!active || !d?.timeStr) return null
  return (
    <TooltipCard title={formatLongDate(d.date)}>
      <TooltipRow label="Hora" value={d.timeStr} color={C.error} />
      <TooltipRow label="Duración" value={d.durationStr} color={C.error} />
    </TooltipCard>
  )
}

// ── Sección ──────────────────────────────────────────────────────────────────

export default function SleepClient({ stats }: { stats: SleepStats }) {
  const { kpis, ganttByDate, dailySleep, wakeUpTimes, bedTimes, napRaw, wakeWindows,
    nightWakingsByDay, nightWakingScatter, cursedHour, predictions } = stats

  const data = useMemo(() => {
    // Siestas: duración apilada por orden del día + nº de siestas
    const napRanks = [...new Set(napRaw.map(n => n.napRank))]
    const napDays = [...groupBy(napRaw, n => n.date)]
    const napStack = withTrend(
      napDays.map(([date, naps]) => ({
        date,
        ...Object.fromEntries(naps.map(n => [n.napRank, n.durationHours])),
        totalNaps: naps.reduce((s, n) => s + n.durationHours, 0),
      })),
      'totalNaps'
    )
    const napCount = withTrend(napDays.map(([date, naps]) => ({ date, count: naps.length })), 'count')

    // Ventanas de vigilia por día
    const windowNames = [...new Set(wakeWindows.map(w => w.windowName))]
    const wakeChart = withTrend(
      [...groupBy(wakeWindows, w => w.date)].map(([date, list]) => ({
        date,
        ...Object.fromEntries(list.map(w => [w.windowName, w.durationHours])),
        windows: list.map(w => ({ name: w.windowName, str: w.durationStr })),
        avgWindow: average(list.map(w => w.durationHours)),
      })),
      'avgWindow'
    )

    // Despertares: rellenar con 0 los días sin despertares
    const wakingsByDate = new Map(nightWakingsByDay.map(nw => [nw.date, nw]))
    const wakingsPadded = dailySleep.map(({ date }) => wakingsByDate.get(date) ?? { date, totalMin: 0, count: 0 })
    const scatterByDate = groupBy(nightWakingScatter, nw => nw.date)
    // Eje Y de 18:00 a 06:00: la madrugada se desplaza +24h
    type ScatterPoint = Omit<SleepStats['nightWakingScatter'][number], 'hourDecimal'> & { hourDecimal: number | null }
    const wakingScatter = dailySleep.flatMap(({ date }): ScatterPoint[] =>
      scatterByDate.get(date)?.map(nw => ({ ...nw, hourDecimal: nw.hourDecimal < 18 ? nw.hourDecimal + 24 : nw.hourDecimal }))
      ?? [{ date, hourDecimal: null, durationMin: 0, timeStr: '', durationStr: '' }]
    )

    return {
      napRanks, napStack, napCount, windowNames, wakeChart,
      wakingsCount: withTrend(wakingsPadded, 'count'),
      wakingsPadded, wakingScatter,
      dailySleep: withTrend(dailySleep, 'totalHours'),
      maxCursed: Math.max(1, ...cursedHour.map(h => h.count)),
    }
  }, [napRaw, wakeWindows, nightWakingsByDay, nightWakingScatter, dailySleep, cursedHour])

  const kpiData: KpiProps[] = [
    { icon: Moon, label: 'Sueño total promedio', value: kpis.avgTotalSleep },
    { icon: Sunrise, label: 'Hora de despertar', value: kpis.avgWakeTime, iconColorClass: 'text-yellow-500 bg-yellow-500/20' },
    { icon: Clock, label: 'Hora de dormir', value: kpis.avgBedTime, iconColorClass: 'text-secondary bg-secondary/20' },
    { icon: BellRing, label: 'Despertares noct', value: kpis.avgNightWakings, iconColorClass: 'text-error bg-error/20' },
  ]

  const avgAbsError = (values: number[]) => (values.length ? `${Math.round(average(values.map(Math.abs)))} min` : '--')
  const napPredictions = predictions.naps.map(n => ({ ...n, label: `${n.date} - ${n.timeStr}` }))

  const tabs = [
    {
      label: 'Timeline',
      content: (
        <div>
          <p className="text-sm text-on-surface/50 mb-4">
            Periodos de sueño por día. Hover sobre cada barra para ver detalles.
          </p>
          <SleepCalendar ganttByDate={ganttByDate} />
        </div>
      ),
    },
    {
      label: 'Tendencias',
      content: (
        <>
          <ChartCard title="Horas de sueño totales por día" height={280}>
            <ComposedChart data={data.dailySleep}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis {...dateAxisProps()} />
              <YAxis
                allowDecimals={false} tick={AXIS_TICK}
                domain={[(min: number) => Math.floor(min - 0.5), (max: number) => Math.ceil(max + 0.5)]}
              />
              {renderMonthDividers(data.dailySleep, C.primary)}
              <Tooltip content={<ChartTooltip formatValue={v => `${v.toFixed(1)}h`} />} />
              <Area type="monotone" dataKey="totalHours" name="Sueño total" stroke={C.primary} fill={C.primary} fillOpacity={0.15} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="totalHoursTrend" name="Tendencia" stroke={C.trend} strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="avg" name="Promedio" stroke={C.muted} strokeDasharray="4 4" dot={false} strokeWidth={1.5} activeDot={false} />
            </ComposedChart>
          </ChartCard>

          <ChartCard title="Hora de despertar" height={240}>
            <TimeOfDayChart data={wakeUpTimes} name="Despertar" color={C.amber} />
          </ChartCard>

          <ChartCard title="Hora de dormir" height={240}>
            <TimeOfDayChart data={bedTimes} name="Hora dormir" color={C.error} />
          </ChartCard>
        </>
      ),
    },
    {
      label: 'Siestas',
      content: (
        <>
          <ChartCard title="Cantidad de siestas por día">
            <TrendBarChart
              data={data.napCount}
              bars={[{ key: 'count', name: 'Total siestas', color: C.primary }]}
              trendKey="countTrend"
              formatValue={fmt1}
              allowDecimals={false}
              legend={false}
            />
          </ChartCard>

          <ChartCard title="Duración de siestas por día">
            <TrendBarChart
              data={data.napStack}
              bars={data.napRanks.map((rank, i) => ({ key: rank, name: rank, color: NAP_COLORS[i % NAP_COLORS.length] }))}
              trendKey="totalNapsTrend"
              trendColor={C.trendAlt}
              formatValue={v => `${v.toFixed(2)}h`}
              yTickFormatter={v => `${v.toFixed(1)}h`}
            />
          </ChartCard>

          <ChartCard title="Ventanas de vigilia" description="Tiempo despierto entre siesta y siesta / hora de dormir">
            <ComposedChart data={data.wakeChart}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis {...dateAxisProps()} />
              <YAxis domain={[0, 'dataMax + 0.5']} tick={AXIS_TICK} tickFormatter={v => `${v.toFixed(1)}h`} />
              {renderMonthDividers(data.wakeChart, C.primary)}
              <Tooltip cursor={{ fill: C.surfaceAlt, opacity: 0.4 }} content={WakeWindowTooltip} />
              {data.windowNames.map((name, i) => {
                const fill = NAP_COLORS[i % NAP_COLORS.length]
                return (
                  <Line
                    key={name} name={name} dataKey={name} type="monotone" stroke="transparent"
                    dot={{ r: 4, fill, strokeWidth: 0, opacity: 0.6 }}
                    activeDot={{ r: 6, fill, strokeWidth: 0 }}
                  />
                )
              })}
              <Line type="monotone" dataKey="avgWindowTrend" name="Tendencia" stroke={C.trendAlt} strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
              <Legend {...LEGEND_PROPS} />
            </ComposedChart>
          </ChartCard>
        </>
      ),
    },
    {
      label: 'Despertares',
      content: (
        <>
          <ChartCard title="Cantidad de despertares por noche" description="Número total de veces que se ha despertado durante la noche">
            <TrendBarChart
              data={data.wakingsCount}
              bars={[{ key: 'count', name: 'Despertares', color: C.error }]}
              trendKey="countTrend"
              formatValue={fmt1}
              allowDecimals={false}
              legend={false}
            />
          </ChartCard>

          <ChartCard title="Tiempo total despierto por noche" description="Suma de duración de todos los despertares nocturnos">
            <TrendBarChart
              data={data.wakingsPadded}
              bars={[{ key: 'totalMin', name: 'Minutos despierto', color: C.error }]}
              formatValue={v => `${v.toFixed(0)} min`}
              yTickFormatter={v => `${v.toFixed(0)}m`}
              legend={false}
            />
          </ChartCard>

          <ChartCard title="Distribución horaria de despertares" description="Burbujas más grandes = despertares más largos">
            <ScatterChart>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis {...dateAxisProps()} type="category" allowDuplicatedCategory={false} />
              <YAxis dataKey="hourDecimal" name="Hora" tick={AXIS_TICK} domain={[18, 30]} tickFormatter={v => formatHour(v % 24)} />
              <ZAxis dataKey="durationMin" range={[20, 400]} />
              {renderMonthDividers(data.wakingScatter, C.primary)}
              <Tooltip cursor={{ stroke: C.outline }} content={NightWakingTooltip} />
              <Scatter data={data.wakingScatter} fill={C.error} fillOpacity={0.7} />
            </ScatterChart>
          </ChartCard>

          <ChartCard title="La “hora maldita” 🕰️" description="Distribución de despertares por hora">
            <BarChart data={cursedHour}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="hour" tick={{ ...AXIS_TICK, fontSize: 10 }} interval={3} />
              <YAxis tick={AXIS_TICK} allowDecimals={false} />
              <Tooltip content={<ChartTooltip formatValue={v => `${v} veces`} formatLabel={l => l} />} />
              <Bar
                dataKey="count"
                name="Despertares"
                radius={[3, 3, 0, 0]}
                shape={(props: BarShapeProps) => {
                  const count = Number(props.payload?.count)
                  return (
                    <Rectangle
                      {...props}
                      fill={C.error}
                      fillOpacity={count === data.maxCursed ? 1 : 0.2 + (count / data.maxCursed) * 0.6}
                    />
                  )
                }}
              />
            </BarChart>
          </ChartCard>
        </>
      ),
    },
    {
      label: '✨ Predicciones',
      content: (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard
              icon={Moon} label="Desfase medio bedtime" iconColorClass="bg-indigo-500/20 text-indigo-400"
              value={avgAbsError(predictions.bedtime.map(p => p.errorMinutes))}
            />
            <KpiCard
              icon={Target} label="Desfase medio inicio siestas" iconColorClass="bg-emerald-500/20 text-emerald-400"
              value={avgAbsError(predictions.naps.map(p => p.errorStartMinutes))}
            />
            <KpiCard
              icon={Sparkles} label="Desfase medio duración" iconColorClass="bg-amber-500/20 text-amber-400"
              value={avgAbsError(predictions.naps.map(p => p.realDuration - p.predDuration))}
            />
          </div>

          <ChartCard title="Desviación: Hora de Dormir (Bedtime)" description="Minutos de error. Arriba del 0 = durmió más tarde de lo predicho.">
            <DeviationChart data={predictions.bedtime} dataKey="errorMinutes" name="Desviación" labelKey="date" />
          </ChartCard>

          <ChartCard title="Desviación: Hora de Inicio de Siestas" description="Error en la hora a la que realmente se durmió vs la predicción.">
            <DeviationChart data={napPredictions} dataKey="errorStartMinutes" name="Desviación de inicio" labelKey="label" />
          </ChartCard>

          <ChartCard title="Estimación: Duración de Siestas" description="Comparativa de minutos reales vs los estimados por la IA.">
            <ComposedChart data={napPredictions}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="label" type="category" tick={AXIS_TICK} tickFormatter={(v: string) => v.split(' - ')[0]} />
              <YAxis tick={AXIS_TICK} tickFormatter={v => `${v}m`} />
              <Tooltip content={<ChartTooltip formatValue={v => `${v} min`} formatLabel={l => l} />} cursor={{ fill: C.surfaceAlt }} />
              <Legend {...LEGEND_PROPS} />
              <Bar dataKey="realDuration" name="Duración real" fill={C.secondary} radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Line type="monotone" dataKey="predDuration" name="Estimación IA" stroke={C.amber} strokeWidth={3} dot={{ r: 4, fill: C.amber }} />
            </ComposedChart>
          </ChartCard>
        </>
      ),
    },
  ]

  return (
    <DashboardSection
      title="💤 Patrones de Sueño"
      description="Visualiza el registro de sueño o promedios."
      kpis={kpiData}
      tabs={tabs}
    />
  )
}
