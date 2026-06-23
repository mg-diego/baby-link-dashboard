'use client'

import {
  Area, LineChart, Line, BarChart, Bar,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
  ComposedChart, Rectangle,
  ZAxis
} from 'recharts'
import { Moon, Clock, Sunrise, BellRing, Target, Sparkles } from 'lucide-react'
import { SleepStats } from './data'
import { DashboardSection, ChartTooltip, C } from '@/components/dashboard-section'
import { useEffect, useMemo, useRef, useState } from 'react'
import { renderMonthDividers } from '@/components/month-divider'
import { formatHour, isWeekend, withTrend } from '@/utils/utils'
import { ChartLazyLoader } from '@/components/chart-lazy-loader'

const TICK_STYLE = { fill: '#E8EAF6', fontSize: 11, opacity: 0.5 }

const STATUS_COLORS: Record<string, string> = {
  night_solid: '#6BCFA0',
  night_interrupted: '#FFAA60',
  night_waking: '#FF5C5C',
  nap: '#A78BFA',
}
const STATUS_LABELS: Record<string, string> = {
  night_solid: 'Sueño sólido',
  night_interrupted: 'Sueño interrumpido',
  night_waking: 'Despertar nocturno',
  nap: 'Siesta',
}

// Dimensiones
const CHART_H = 800
const TOP = 28
const COL_W = 100
const LEFT = 52
const totalH = TOP + CHART_H

const hourToY = (h: number) => TOP + (h / 24) * CHART_H
const durToH = (d: number) => (d / 24) * CHART_H

function SleepCalendar({ ganttByDate }: { ganttByDate: SleepStats['ganttByDate'] }) {
  const [nightMode, setNightMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
  }, [ganttByDate, nightMode])

  const columns = useMemo(() => {
    if (!nightMode) {
      return ganttByDate.map(day => ({
        key: day.date, label: day.label,
        events: day.events.map(e => ({
          ...e,
          displayHour: e.startHour,
          displayDuration: e.duration,
        })),
      }))
    }

    return ganttByDate.map((day, i) => {
      const next = ganttByDate[i + 1]

      const pm = day.events
        .filter(e => e.startHour >= 12)
        .map(e => ({
          ...e,
          displayHour: e.startHour - 12,
          displayDuration: Math.min(e.duration, 24 - (e.startHour - 12)),
        }))

      const am = (next?.events ?? [])
        .filter(e => e.startHour < 12)
        .map(e => ({
          ...e,
          displayHour: e.startHour + 12,
          displayDuration: Math.min(e.duration, 24 - (e.startHour + 12)),
        }))

      return { key: day.date, label: day.label, events: [...pm, ...am] }
    })
  }, [ganttByDate, nightMode])

  if (!ganttByDate.length)
    return <p className="text-on-surface/40 text-sm">Sin datos</p>

  const svgW = columns.length * COL_W

  const yTicks = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24]
  const yTickLabel = (h: number) => {
    const actual = nightMode ? (h + 12) % 24 : h
    return `${actual.toString().padStart(2, '0')}:00`
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-on-surface/60">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[key as keyof typeof STATUS_COLORS] }} />
              {label}
            </span>
          ))}
        </div>
        <button
          onClick={() => setNightMode(n => !n)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${nightMode
            ? 'bg-primary-container text-primary border-primary/30'
            : 'bg-surface-container text-on-surface/60 border-outline'
            }`}
        >
          {nightMode ? '🌙 Modo noche' : '☀️ Modo día'}
        </button>
      </div>

      <div className="flex">
        <div className="shrink-0 relative border-r border-outline/30" style={{ width: LEFT, height: totalH }}>
          <div style={{ height: TOP }} />
          {yTicks.map(h => (
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
          <svg width={svgW} height={totalH}>
            {yTicks.map(h => (
              <line
                key={h}
                x1={0} y1={hourToY(h)} x2={svgW} y2={hourToY(h)}
                stroke="#2E3250"
                strokeWidth={h === 0 || h === 24 ? 1 : 0.5}
              />
            ))}

            {nightMode && (
              <line
                x1={0} y1={hourToY(12)} x2={svgW} y2={hourToY(12)}
                stroke="#7BB8F0" strokeWidth={1}
                strokeDasharray="4 3" opacity={0.4}
              />
            )}

            {columns.map((col, i) => {
              const x = i * COL_W
              const weekend = isWeekend(col.key)

              return (
                <g key={col.key}>
                  <rect
                    x={x} y={TOP} width={COL_W} height={CHART_H}
                    fill={i % 2 === 0 ? 'rgba(26,29,46,0.4)' : 'rgba(36,39,70,0.2)'}
                  />

                  {weekend && (
                    <rect
                      x={x} y={TOP} width={COL_W} height={CHART_H}
                      fill={C.primary} fillOpacity={0.06}
                    />
                  )}

                  <line
                    x1={x} y1={0} x2={x} y2={totalH}
                    stroke="#2E3250" strokeWidth={0.5}
                  />

                  <text
                    x={x + COL_W / 2} y={TOP - 8}
                    textAnchor="middle"
                    fill={weekend ? C.primary : "#E8EAF6"}
                    fontSize={10}
                    opacity={weekend ? 0.9 : 0.6}
                    fontWeight={weekend ? 600 : 400}
                  >
                    {col.label}
                  </text>

                  {col.events.map((ev, j) => {
                    const PAD = 5
                    const ey = hourToY(ev.displayHour)
                    const eh = Math.max(2, durToH(ev.displayDuration))
                    return (
                      <rect
                        key={j}
                        x={x + PAD} y={ey}
                        width={COL_W - PAD * 2} height={eh}
                        fill={STATUS_COLORS[ev.status as keyof typeof STATUS_COLORS]}
                        rx={3} opacity={0.85}
                      >
                        <title>{`${STATUS_LABELS[ev.status as keyof typeof STATUS_LABELS]}\n${ev.startTimeStr} – ${ev.endTimeStr}\n${ev.durationStr}`}</title>
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

export default function SleepClient({ stats }: { stats: SleepStats }) {
  const { kpis, ganttByDate, dailySleep, wakeUpTimes, bedTimes,
    napRaw, wakeWindows, nightWakingsByDay, nightWakingScatter, cursedHour, predictions } = stats

  const safePredictions = predictions || { bedtime: [], naps: [] }

  const napRanks = [...new Set(napRaw.map((n: any) => n.napRank))]
  const napByDate = napRaw.reduce<Record<string, Record<string, number>>>((acc: any, n: any) => {
    if (!acc[n.date]) acc[n.date] = {}
    acc[n.date][n.napRank] = n.durationHours
    return acc
  }, {})
  const napStackData = Object.entries(napByDate).map(([date, naps]) => ({ date, ...(naps as any) }))

  const NAP_COLORS = ['#B8A0E8', '#9B7FDB', '#7B5FC4', '#5C40A0', '#3D2280']
  const maxCursed = Math.max(...cursedHour.map((h: any) => h.count))

  const kpiData = [
    { icon: Moon, label: "Sueño total promedio", value: kpis.avgTotalSleep },
    { icon: Sunrise, label: "Hora de despertar", value: kpis.avgWakeTime, iconColorClass: "text-yellow-500 bg-yellow-500/20" },
    { icon: Clock, label: "Hora de dormir", value: kpis.avgBedTime, iconColorClass: "text-secondary bg-secondary/20" },
    { icon: BellRing, label: "Despertares noct", value: kpis.avgNightWakings, iconColorClass: "text-error bg-error/20" },
  ]

  const dailySleepData = withTrend(dailySleep, 'totalHours');
  const wakeUpData = withTrend(wakeUpTimes, 'hourDecimal');
  const bedTimesData = withTrend(bedTimes, 'hourDecimal');

  const napStackWithTotal = napStackData.map((d: any) => {
    const total = Object.keys(d).reduce((sum, key) => key !== 'date' ? sum + (Number(d[key]) || 0) : sum, 0);
    return { ...d, totalNaps: total };
  });
  const napStackWithTrend = withTrend(napStackWithTotal, 'totalNaps');

  const wakeByDate = wakeWindows.reduce((acc: any, w: any) => {
    if (!acc[w.date]) acc[w.date] = { date: w.date, sum: 0, count: 0, windows: [] };
    acc[w.date][w.windowName] = w.durationHours;
    acc[w.date].windows.push({ name: w.windowName, str: w.durationStr });
    acc[w.date].sum += w.durationHours;
    acc[w.date].count += 1;
    return acc;
  }, {});

  const dailyWakeAvg = Object.values(wakeByDate).map((d: any) => ({
    ...d,
    avgWindow: d.sum / d.count
  }));

  const wakeChartData = withTrend(dailyWakeAvg, 'avgWindow');
  const windowNames = [...new Set(wakeWindows.map((w: any) => w.windowName))];

  const napsCountByDay = Object.values(napRaw.reduce((acc: any, nap: any) => {
    if (!acc[nap.date]) acc[nap.date] = { date: nap.date, count: 0 }
    acc[nap.date].count += 1
    return acc
  }, {}))

  const napsCountWithTrend = withTrend(napsCountByDay, 'count')

  const nightWakingsPadded = dailySleep.map(day => {
    const existing = nightWakingsByDay.find(nw => nw.date === day.date)
    return existing || { date: day.date, totalMin: 0, count: 0 }
  })

  const nightWakingScatterPadded = dailySleep.flatMap(day => {
    const wakings = nightWakingScatter.filter(nw => nw.date === day.date)
    if (wakings.length === 0) {
      return [{
        date: day.date,
        hourDecimal: null as any,
        durationMin: 0,
        timeStr: '',
        durationStr: ''
      }]
    }
    return wakings.map(d => ({
      ...d,
      hourDecimal: d.hourDecimal < 18 ? d.hourDecimal + 24 : d.hourDecimal
    }))
  })

  const wakingsCountPadded = dailySleep.map(day => {
    const existing = nightWakingsByDay.find(nw => nw.date === day.date)
    return {
      date: day.date,
      count: existing ? existing.count : 0
    }
  })

  const wakingsCountWithTrend = withTrend(wakingsCountPadded, 'count')

  const tabsData = [
    {
      label: 'Timeline',
      content: (
        <div>
          <p className="text-sm text-onSurface/50 mb-4">
            Periodos de sueño por día. Hover sobre cada barra para ver detalles.
          </p>
          <SleepCalendar ganttByDate={ganttByDate} />
        </div>
      )
    },
    {
      label: 'Tendencias',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Horas de sueño totales por día</h3>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={dailySleepData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis
                  dataKey="date"
                  minTickGap={20}
                  tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                    return `${weekday} ${d.getDate()}`;
                  }}
                />
                <YAxis allowDecimals={false} domain={['dataMax - 0.5', 'dataMax + 0.5']} tick={{ fill: C.muted, fontSize: 11 }} />
                {renderMonthDividers(wakeChartData, C.primary)}
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(1)}h`} />} />
                <Area type="monotone" dataKey="totalHours" name="Sueño total" stroke={C.primary} fill={C.primary} fillOpacity={0.15} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="totalHoursTrend" name="Tendencia" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                <Line type="monotone" dataKey="avg" name="Promedio" stroke={C.muted} strokeDasharray="4 4" dot={false} strokeWidth={1.5} activeDot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Hora de despertar</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={wakeUpData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis
                  dataKey="date"
                  minTickGap={20}
                  tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    // Devuelve "lun 15"
                    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                    return `${weekday} ${d.getDate()}`;
                  }}
                />
                <YAxis domain={['dataMax - 0.5', 'dataMax + 0.5']} tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={formatHour} />
                {renderMonthDividers(wakeChartData, C.primary)}
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${formatHour(v)}h`} />} />
                <Line type="monotone" dataKey="hourDecimal" name="Despertar" stroke="#FFB74D" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="hourDecimalTrend" name="Tendencia" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                <ReferenceLine y={wakeUpData.reduce((s: number, w: any) => s + w.hourDecimal, 0) / Math.max(wakeUpData.length, 1)} stroke={C.muted} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Hora de dormir</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={bedTimesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis
                  dataKey="date"
                  minTickGap={20}
                  tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    // Devuelve "lun 15"
                    const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                    return `${weekday} ${d.getDate()}`;
                  }}
                />
                <YAxis domain={['dataMax - 0.5', 'dataMax + 0.5']} tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={formatHour} />
                {renderMonthDividers(wakeChartData, C.primary)}

                <Tooltip content={<ChartTooltip formatter={(v: number) => `${formatHour(v)}h`} />} />
                <Line type="monotone" dataKey="hourDecimal" name="Hora dormir" stroke={C.error} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="hourDecimalTrend" name="Tendencia" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                <ReferenceLine y={bedTimesData.reduce((s: number, b: any) => s + b.hourDecimal, 0) / Math.max(bedTimesData.length, 1)} stroke={C.muted} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      label: 'Siestas',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Cantidad de siestas por día</h3>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={napsCountWithTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      // Devuelve "lun 15"
                      const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                      return `${weekday} ${d.getDate()}`;
                    }}
                  />
                  <YAxis allowDecimals={false} domain={[0, 'dataMax + 0.5']} tick={{ fill: C.muted, fontSize: 11 }} />
                  {renderMonthDividers(wakeChartData, C.primary)}
                  <Tooltip
                    cursor={{ fill: C.surfaceAlt, opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
                          <p className="text-onSurface font-medium mb-2 border-b border-outline/30 pb-1">{d.date}</p>

                          <div className="flex justify-between items-center gap-4 my-1">
                            <span className="text-primary/80">Total siestas</span>
                            <span className="text-primary font-bold">{d.count}</span>
                          </div>

                          {d.countTrend !== null && d.countTrend !== undefined && (
                            <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-outline/30">
                              <span className="text-[#8B5CF6]">Tendencia Gral.</span>
                              <span className="text-[#8B5CF6] font-bold">{d.countTrend.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" name="Total siestas" fill={C.primary} opacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line type="monotone" dataKey="countTrend" name="Tendencia Promedio" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Duración de siestas por día</h3>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={napStackWithTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                      return `${weekday} ${d.getDate()}`;
                    }}
                  />
                  <YAxis
                    name="Horas"
                    domain={[0, 'dataMax + 0.5']}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={v => `${v.toFixed(1)}h`}
                  />
                  {renderMonthDividers(wakeChartData, C.primary)}

                  <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(2)}h`} />} />
                  <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
                  {napRanks.map((rank: any, i: number) => (
                    <Bar key={rank} dataKey={rank} stackId="a" fill={NAP_COLORS[i % NAP_COLORS.length]} radius={i === napRanks.length - 1 ? [4, 4, 0, 0] : undefined} />
                  ))}
                  <Line type="monotone" dataKey="totalNapsTrend" name="Tendencia Total" stroke="#f6b15cff" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Ventanas de vigilia</h3>
            <p className="text-xs text-onSurface/40 mb-3">Tiempo despierto entre siesta y siesta / hora de dormir</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={wakeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      // Devuelve "lun 15"
                      const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                      return `${weekday} ${d.getDate()}`;
                    }}
                  />
                  <YAxis
                    name="Horas"
                    domain={[0, 'dataMax + 0.5']}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={v => `${v.toFixed(1)}h`}
                  />

                  {renderMonthDividers(wakeChartData, C.primary)}

                  <Tooltip
                    cursor={{ fill: C.surfaceAlt, opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;

                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs min-w-[160px]">
                          <p className="text-onSurface/60 font-medium mb-2 border-b border-outline/30 pb-1">{d.date}</p>

                          {d.windows?.map((win: any) => (
                            <div key={win.name} className="flex justify-between items-center gap-4 my-1">
                              <span className="text-primary/80">{win.name}</span>
                              <span className="text-primary font-bold">{win.str}</span>
                            </div>
                          ))}

                          {d.avgWindowTrend !== null && d.avgWindowTrend !== undefined && (
                            <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-outline/30">
                              <span className="text-[#f6b15c]">Tendencia Gral.</span>
                              <span className="text-[#f6b15c] font-bold">{d.avgWindowTrend.toFixed(1)}h</span>
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />

                  {windowNames.map((name: any, i: number) => (
                    <Line
                      key={name}
                      name={name}
                      dataKey={name}
                      type="monotone"
                      stroke="transparent"
                      dot={{ r: 4, fill: NAP_COLORS[i % NAP_COLORS.length], strokeWidth: 0, opacity: 0.6 }}
                      activeDot={{ r: 6, fill: NAP_COLORS[i % NAP_COLORS.length], strokeWidth: 0 }}
                    />
                  ))}

                  <Line
                    type="monotone"
                    dataKey="avgWindowTrend"
                    name="Tendencia Promedio"
                    stroke="#f6b15cff"
                    strokeWidth={3}
                    dot={false}
                    activeDot={false}
                    strokeDasharray="5 5"
                  />

                  <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>
        </div>
      )
    },
    {
      label: 'Despertares',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Cantidad de despertares por noche</h3>
            <p className="text-xs text-onSurface/40 mb-3">Número total de veces que se ha despertado durante la noche</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={wakingsCountWithTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      return `${d.getDate()} ${d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}`;
                    }}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: C.muted, fontSize: 11 }} />
                  {renderMonthDividers(dailySleep, C.primary)}

                  <Tooltip
                    cursor={{ fill: C.surfaceAlt, opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
                          <p className="text-onSurface font-medium mb-2 border-b border-outline/30 pb-1">{d.date}</p>

                          <div className="flex justify-between items-center gap-4 my-1">
                            <span className="text-error/80">Despertares</span>
                            <span className="text-error font-bold">{d.count}</span>
                          </div>

                          {d.countTrend !== null && d.countTrend !== undefined && (
                            <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-outline/30">
                              <span className="text-[#8B5CF6]">Tendencia Gral.</span>
                              <span className="text-[#8B5CF6] font-bold">{d.countTrend.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="count" name="Despertares" fill={C.error} opacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line type="monotone" dataKey="countTrend" name="Tendencia Promedio" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Tiempo total despierto por noche</h3>
            <p className="text-xs text-onSurface/40 mb-3">Suma de duración de todos los despertares nocturnos</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={nightWakingsPadded}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={(v) => {
                      const d = new Date(v);
                      // Devuelve "lun 15"
                      const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                      return `${weekday} ${d.getDate()}`;
                    }}
                  />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}m`} />
                  {renderMonthDividers(wakeChartData, C.primary)}

                  <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(1)} min`} />} />
                  <Bar dataKey="totalMin" name="Minutos despierto" fill={C.error} radius={[4, 4, 0, 0]} fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Distribución horaria de despertares</h3>
            <p className="text-xs text-onSurface/40 mb-3">Burbujas más grandes = despertares más largos</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    type="category"
                    allowDuplicatedCategory={false}
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={(v) => {
                      if (!v) return '';
                      const d = new Date(v);
                      const weekday = d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '');
                      return `${weekday} ${d.getDate()}`;
                    }}
                  />
                  <YAxis dataKey="hourDecimal" name="Hora" tick={{ fill: C.muted, fontSize: 11 }}
                    domain={[18, 30]} tickFormatter={v => formatHour(v % 24)} />
                  <ZAxis dataKey="durationMin" range={[20, 400]} />

                  {renderMonthDividers(dailySleep, C.primary)}

                  <Tooltip cursor={{ stroke: C.outline }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length || !payload[0].payload.timeStr) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl">
                          <p className="text-onSurface/60">{d.date}</p>
                          <p className="text-error">Hora: <span className="font-medium">{d.timeStr}</span></p>
                          <p className="text-error">Duración: <span className="font-medium">{d.durationStr}</span></p>
                        </div>
                      )
                    }}
                  />
                  <Scatter
                    data={nightWakingScatterPadded}
                    fill={C.error}
                    fillOpacity={0.7}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">La "hora maldita" 🕰️</h3>
            <p className="text-xs text-onSurface/40 mb-3">Distribución de despertares por hora</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cursedHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis dataKey="hour" tick={{ fill: C.muted, fontSize: 10 }}
                    interval={3} />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} veces`} />} />
                  <Bar dataKey="count" name="Despertares" radius={[3, 3, 0, 0]}>
                    {cursedHour.map((entry: any, i: number) => (
                      <Cell
                        key={i}
                        fill={C.error}
                        fillOpacity={entry.count === maxCursed ? 1 : 0.2 + (entry.count / maxCursed) * 0.6}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>
        </div>
      )
    },
    {
      label: '✨ Predicciones',
      content: (() => {
        const BEDTIME_MARGIN = 15;
        const NAP_MARGIN = 15;

        let bedtimeAvgErrorStr = "--";
        if (safePredictions.bedtime.length > 0) {
          const totalError = safePredictions.bedtime.reduce((acc: number, p: any) => acc + Math.abs(p.errorMinutes), 0);
          bedtimeAvgErrorStr = `${Math.round(totalError / safePredictions.bedtime.length)} min`;
        }

        let napStartAvgErrorStr = "--";
        if (safePredictions.naps.length > 0) {
          const totalError = safePredictions.naps.reduce((acc: number, p: any) => acc + Math.abs(p.errorStartMinutes), 0);
          napStartAvgErrorStr = `${Math.round(totalError / safePredictions.naps.length)} min`;
        }

        let napDurAvgErrorStr = "--";
        if (safePredictions.naps.length > 0) {
          const totalError = safePredictions.naps.reduce((acc: number, p: any) => acc + Math.abs(p.realDuration - p.predDuration), 0);
          napDurAvgErrorStr = `${Math.round(totalError / safePredictions.naps.length)} min`;
        }

        const napStartChartData = safePredictions.naps.map((n: any) => ({
          ...n,
          uniqueLabel: `${n.date} - ${n.timeStr}`
        }));

        return (
          <div className="space-y-8 animate-in fade-in duration-500">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface border border-outline rounded-xl p-4 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                  <Moon size={24} />
                </div>
                <div>
                  <p className="text-xs text-onSurface/60">Desfase Medio Bedtime</p>
                  <p className="text-2xl font-bold text-onSurface">{bedtimeAvgErrorStr}</p>
                </div>
              </div>

              <div className="bg-surface border border-outline rounded-xl p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-xs text-onSurface/60">Desfase Medio Inicio Siestas</p>
                  <p className="text-2xl font-bold text-onSurface">{napStartAvgErrorStr}</p>
                </div>
              </div>

              <div className="bg-surface border border-outline rounded-xl p-4 flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
                  <Sparkles size={24} />
                </div>
                <div>
                  <p className="text-xs text-onSurface/60">Desfase Medio Duración</p>
                  <p className="text-2xl font-bold text-onSurface">{napDurAvgErrorStr}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-onSurface mb-1">Desviación: Hora de Dormir (Bedtime)</h3>
              <p className="text-xs text-onSurface/40 mb-3">
                Minutos de error. Arriba del 0 = durmió más tarde de lo predicho.
              </p>
              <ChartLazyLoader height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={safePredictions.bedtime}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                    <XAxis dataKey="date" type="category" tick={TICK_STYLE} />
                    <YAxis tick={TICK_STYLE} tickFormatter={v => `${v}m`} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} min`} />} cursor={{ fill: C.surfaceAlt }} />
                    <ReferenceLine y={0} stroke={C.muted} />
                    <Bar
                      dataKey="errorMinutes"
                      name="Desviación"
                      shape={(props: any) => {
                        const err = Math.abs(props.payload.errorMinutes);
                        const color = err <= BEDTIME_MARGIN ? '#4ADE80' : err <= 30 ? '#FACC15' : C.error;
                        return <Rectangle {...props} fill={color} fillOpacity={0.85} />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartLazyLoader>
            </div>

            <div>
              <h3 className="text-sm font-medium text-onSurface mb-1">Desviación: Hora de Inicio de Siestas</h3>
              <p className="text-xs text-onSurface/40 mb-3">
                Error en la hora a la que realmente se durmió vs la predicción.
              </p>
              <ChartLazyLoader height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={napStartChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={C.outline} />
                    <XAxis dataKey="uniqueLabel" type="category" tick={TICK_STYLE} tickFormatter={(v) => v.split(' - ')[0]} />
                    <YAxis tick={TICK_STYLE} tickFormatter={v => `${v}m`} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} min`} />} cursor={{ fill: C.surfaceAlt }} />
                    <ReferenceLine y={0} stroke={C.muted} />
                    <Bar
                      dataKey="errorStartMinutes"
                      name="Desviación de Inicio"
                      shape={(props: any) => {
                        const err = Math.abs(props.payload.errorStartMinutes);
                        const color = err <= NAP_MARGIN ? '#4ADE80' : err <= 30 ? '#FACC15' : C.error;
                        return <Rectangle {...props} fill={color} fillOpacity={0.85} />;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartLazyLoader>
            </div>

            <div>
              <h3 className="text-sm font-medium text-onSurface mb-1">Estimación: Duración de Siestas</h3>
              <p className="text-xs text-onSurface/40 mb-3">
                Comparativa de minutos reales vs los estimados por la IA.
              </p>
              <ChartLazyLoader height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={napStartChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                    <XAxis dataKey="uniqueLabel" type="category" tick={TICK_STYLE} tickFormatter={(v) => v.split(' - ')[0]} />
                    <YAxis tick={TICK_STYLE} tickFormatter={v => `${v}m`} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} min`} />} cursor={{ fill: C.surfaceAlt }} />
                    <Legend wrapperStyle={{ color: C.muted, fontSize: 12, paddingTop: '10px' }} />
                    <Bar dataKey="realDuration" name="Duración Real" fill={C.secondary} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Line type="monotone" dataKey="predDuration" name="Estimación IA" stroke="#FFB74D" strokeWidth={3} dot={{ r: 4, fill: '#FFB74D' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartLazyLoader>
            </div>

          </div>
        );
      })()
    }
  ]

  return (
    <DashboardSection
      title="💤 Patrones de Sueño"
      description="Visualiza el registro de sueño o promedios."
      kpis={kpiData}
      tabs={tabsData}
    />
  )
}