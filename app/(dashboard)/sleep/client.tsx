'use client'

import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
  ComposedChart, Rectangle
} from 'recharts'
import { Moon, Clock, Sunrise, BellRing, Target, Sparkles } from 'lucide-react'
import { SleepStats, GanttEntry } from './data'
import { DashboardSection, ChartTooltip, C } from '@/components/dashboard-section'
import { useEffect, useMemo, useRef, useState } from 'react'

const TICK_STYLE = { fill: '#E8EAF6', fontSize: 11, opacity: 0.5 }

const GANTT_COLORS: Record<GanttEntry['status'], string> = {
  night_solid:       '#8A2BE2',
  night_interrupted: '#7BB8F0',
  night_waking:      '#F09595',
  nap:               '#B8A0E8',
}

const formatHour = (v: number) => {
  const h = Math.floor(v) % 24
  const m = Math.round((v % 1) * 60)
  return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`
}

// En client.tsx — reemplaza SleepGantt por SleepCalendar

const STATUS_COLORS: Record<string, string> = {
  night_solid:       '#6BCFA0',  // verde menta   → positivo, descanso sólido
  night_interrupted: '#FFAA60',  // ámbar         → alerta, sueño comprometido
  night_waking:      '#FF5C5C',  // rojo vivo     → despertar, interrupción
  nap:               '#A78BFA',  // violeta        → categoría propia, claramente distinta
}
const STATUS_LABELS: Record<string, string> = {
  night_solid:       'Sueño sólido',
  night_interrupted: 'Sueño interrumpido',
  night_waking:      'Despertar nocturno',
  nap:               'Siesta',
}

// Dimensiones
const CHART_H = 600
const TOP     = 28
const COL_W   = 80
const LEFT    = 52
const totalH  = TOP + CHART_H

const hourToY = (h: number) => TOP + (h / 24) * CHART_H
const durToH  = (d: number) => (d / 24) * CHART_H

function SleepCalendar({ ganttByDate }: { ganttByDate: SleepStats['ganttByDate'] }) {
  const [nightMode, setNightMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al dato más reciente al montar
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth
  }, [ganttByDate, nightMode])

  const columns = useMemo(() => {
    if (!nightMode) {
      // Modo día 00:00–24:00: eventos tal cual
      return ganttByDate.map(day => ({
        key: day.date, label: day.label,
        events: day.events.map(e => ({
          ...e,
          displayHour:     e.startHour,
          displayDuration: e.duration,
        })),
      }))
    }

    // Modo noche 12:00–12:00 del día siguiente
    // Columna N = tarde del día N (startHour >= 12) + madrugada del día N+1 (startHour < 12)
    // splitAtMidnight ya corta a medianoche, así que los fragmentos conectan exactamente en displayHour=12
    return ganttByDate.map((day, i) => {
      const next = ganttByDate[i + 1]

      const pm = day.events
        .filter(e => e.startHour >= 12)
        .map(e => ({
          ...e,
          displayHour:     e.startHour - 12,
          displayDuration: Math.min(e.duration, 24 - (e.startHour - 12)),
        }))

      const am = (next?.events ?? [])
        .filter(e => e.startHour < 12)
        .map(e => ({
          ...e,
          displayHour:     e.startHour + 12,
          displayDuration: Math.min(e.duration, 24 - (e.startHour + 12)),
        }))

      return { key: day.date, label: day.label, events: [...pm, ...am] }
    })
  }, [ganttByDate, nightMode])

  if (!ganttByDate.length)
    return <p className="text-on-surface/40 text-sm">Sin datos</p>

  const svgW = columns.length * COL_W

  // Ticks cada 4h
  const yTicks = [0, 4, 8, 12, 16, 20, 24]
  const yTickLabel = (h: number) => {
    const actual = nightMode ? (h + 12) % 24 : h
    return `${actual.toString().padStart(2, '0')}:00`
  }

  return (
    <div>
      {/* Controles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-on-surface/60">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_COLORS[key] }} />
              {label}
            </span>
          ))}
        </div>
        <button
          onClick={() => setNightMode(n => !n)}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            nightMode
              ? 'bg-primary-container text-primary border-primary/30'
              : 'bg-surface-container text-on-surface/60 border-outline'
          }`}
        >
          {nightMode ? '🌙 Modo noche' : '☀️ Modo día'}
        </button>
      </div>

      {/* Calendario */}
      <div className="flex">

        {/* Eje Y fijo (no hace scroll) */}
        <div className="shrink-0 relative border-r border-outline/30" style={{ width: LEFT, height: totalH }}>
          <div style={{ height: TOP }} /> {/* hueco para etiquetas de fecha */}
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

        {/* Área con scroll */}
        <div ref={scrollRef} className="overflow-x-auto flex-1 scrollbar-custom">
          <svg width={svgW} height={totalH}>

            {/* Líneas de cuadrícula horizontales */}
            {yTicks.map(h => (
              <line
                key={h}
                x1={0} y1={hourToY(h)} x2={svgW} y2={hourToY(h)}
                stroke="#2E3250"
                strokeWidth={h === 0 || h === 24 ? 1 : 0.5}
              />
            ))}

            {/* Modo noche: línea de medianoche */}
            {nightMode && (
              <line
                x1={0} y1={hourToY(12)} x2={svgW} y2={hourToY(12)}
                stroke="#7BB8F0" strokeWidth={1}
                strokeDasharray="4 3" opacity={0.4}
              />
            )}

            {/* Columnas */}
            {columns.map((col, i) => {
              const x = i * COL_W
              return (
                <g key={col.key}>
                  {/* Fondo alternante */}
                  <rect
                    x={x} y={TOP} width={COL_W} height={CHART_H}
                    fill={i % 2 === 0 ? 'rgba(26,29,46,0.4)' : 'rgba(36,39,70,0.2)'}
                  />

                  {/* Separador vertical */}
                  <line
                    x1={x} y1={0} x2={x} y2={totalH}
                    stroke="#2E3250" strokeWidth={0.5}
                  />

                  {/* Etiqueta de fecha */}
                  <text
                    x={x + COL_W / 2} y={TOP - 8}
                    textAnchor="middle"
                    fill="#E8EAF6" fontSize={10} opacity={0.6}
                  >
                    {col.label}
                  </text>

                  {/* Eventos */}
                  {col.events.map((ev, j) => {
                    const PAD = 5
                    const ey = hourToY(ev.displayHour)
                    const eh = Math.max(2, durToH(ev.displayDuration))
                    return (
                      <rect
                        key={j}
                        x={x + PAD} y={ey}
                        width={COL_W - PAD * 2} height={eh}
                        fill={STATUS_COLORS[ev.status]}
                        rx={3} opacity={0.85}
                      >
                        <title>{`${STATUS_LABELS[ev.status]}\n${ev.startTimeStr} – ${ev.endTimeStr}\n${ev.durationStr}`}</title>
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

  const NAP_COLORS = ['#B8A0E8','#9B7FDB','#7B5FC4','#5C40A0','#3D2280']
  const maxCursed = Math.max(...cursedHour.map((h: any) => h.count))

  const kpiData = [
    { icon: Moon, label: "Sueño total promedio", value: kpis.avgTotalSleep },
    { icon: Sunrise, label: "Hora de despertar", value: kpis.avgWakeTime, iconColorClass: "text-yellow-500 bg-yellow-500/20" },
    { icon: Clock, label: "Hora de dormir", value: kpis.avgBedTime, iconColorClass: "text-secondary bg-secondary/20" },
    { icon: BellRing, label: "Despertares noct", value: kpis.avgNightWakings, iconColorClass: "text-error bg-error/20" },
  ]

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
              <ComposedChart  data={dailySleep}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis dataKey="date" tick={TICK_STYLE} />
                <YAxis domain={[0, 24]} tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={v => `${v}h`} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(1)}h`} />} />
                <Area type="monotone" dataKey="totalHours" name="Sueño total" stroke={C.primary} fill={C.primary} fillOpacity={0.15} strokeWidth={2} />
                <Line dataKey="avg" name="Promedio" stroke={C.muted} strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
              </ComposedChart >
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Hora de despertar</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={wakeUpTimes}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis dataKey="date" tick={TICK_STYLE} />
                <YAxis domain={[4, 12]} tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={formatHour} />
                <Tooltip content={<ChartTooltip formatter={(_: any, __: any, p: any) => p?.payload?.timeStr} />} />
                <Line type="monotone" dataKey="hourDecimal" name="Despertar" stroke="#FFB74D" strokeWidth={2}
                  dot={{ fill: '#FFB74D', r: 3 }} />
                <ReferenceLine y={wakeUpTimes.reduce((s:number,w:any)=>s+w.hourDecimal,0)/Math.max(wakeUpTimes.length,1)}
                  stroke={C.muted} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-3">Hora de dormir</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={bedTimes}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} />
                <YAxis domain={[16, 24]} tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={formatHour} />
                <Tooltip content={<ChartTooltip formatter={(_: any, __: any, p: any) => p?.payload?.timeStr} />} />
                <Line dataKey="hourDecimal" name="Hora dormir" stroke={C.error} strokeWidth={2}
                  dot={{ fill: C.error, r: 3 }} />
                <ReferenceLine y={bedTimes.reduce((s:number,b:any)=>s+b.hourDecimal,0)/Math.max(bedTimes.length,1)}
                  stroke={C.muted} strokeDasharray="4 4" />
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
            <h3 className="text-sm font-medium text-onSurface mb-3">Duración de siestas por día</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={napStackData}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)}h`} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(2)}h`} />} />
                <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
                {napRanks.map((rank: any, i: number) => (
                  <Bar key={rank} dataKey={rank} stackId="a" fill={NAP_COLORS[i % NAP_COLORS.length]} radius={i === napRanks.length - 1 ? [4,4,0,0] : undefined} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Ventanas de vigilia</h3>
            <p className="text-xs text-onSurface/40 mb-3">Tiempo despierto entre siesta y siesta / hora de dormir</p>
            <ResponsiveContainer width="100%" height={280}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis dataKey="date" type="category" tick={{ fill: C.muted, fontSize: 11 }} />
                <YAxis dataKey="durationHours" name="Horas" tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={v => `${v.toFixed(1)}h`} />
                <Tooltip cursor={{ stroke: C.outline }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-surface-containerHighest border border-outline rounded-xl px-3 py-2 text-xs">
                        <p className="text-onSurface/60">{d.date}</p>
                        <p className="text-primary">{d.windowName}: <span className="font-medium">{d.durationStr}</span></p>
                      </div>
                    )
                  }}
                />
                {[...new Set(wakeWindows.map((w: any) => w.windowName))].map((name: any, i: number) => (
                  <Scatter
                    key={name}
                    name={name}
                    data={wakeWindows.filter((w: any) => w.windowName === name)}
                    fill={NAP_COLORS[i % NAP_COLORS.length]}
                  />
                ))}
                <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      label: 'Despertares',
      content: (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Tiempo total despierto por noche</h3>
            <p className="text-xs text-onSurface/40 mb-3">Suma de duración de todos los despertares nocturnos</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={nightWakingsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => `${v.toFixed(0)}m`} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(1)} min`} />} />
                <Bar dataKey="totalMin" name="Minutos despierto" fill={C.error} radius={[4,4,0,0]} fillOpacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Distribución horaria de despertares</h3>
            <p className="text-xs text-onSurface/40 mb-3">Burbujas más grandes = despertares más largos</p>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis dataKey="date" type="category" tick={{ fill: C.muted, fontSize: 11 }} />
                <YAxis dataKey="hourDecimal" name="Hora" tick={{ fill: C.muted, fontSize: 11 }}
                  domain={[18, 30]} tickFormatter={v => formatHour(v % 24)} />
                <Tooltip cursor={{ stroke: C.outline }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-surface-containerHighest border border-outline rounded-xl px-3 py-2 text-xs">
                        <p className="text-onSurface/60">{d.date}</p>
                        <p className="text-error">Hora: <span className="font-medium">{d.timeStr}</span></p>
                        <p className="text-error">Duración: <span className="font-medium">{d.durationStr}</span></p>
                      </div>
                    )
                  }}
                />
                <Scatter
                  data={nightWakingScatter.map((d: any) => ({
                    ...d,
                    hourDecimal: d.hourDecimal < 18 ? d.hourDecimal + 24 : d.hourDecimal
                  }))}
                  fill={C.error}
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">La "hora maldita" 🕰️</h3>
            <p className="text-xs text-onSurface/40 mb-3">Distribución de despertares por hora</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cursedHour}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis dataKey="hour" tick={{ fill: C.muted, fontSize: 10 }}
                  interval={3} />
                <YAxis tick={{ fill: C.muted, fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} veces`} />} />
                <Bar dataKey="count" name="Despertares" radius={[3,3,0,0]}>
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
              <div className="bg-surface-containerHighest border border-outline rounded-xl p-4 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                  <Moon size={24} />
                </div>
                <div>
                  <p className="text-xs text-onSurface/60">Desfase Medio Bedtime</p>
                  <p className="text-2xl font-bold text-onSurface">{bedtimeAvgErrorStr}</p>
                </div>
              </div>

              <div className="bg-surface-containerHighest border border-outline rounded-xl p-4 flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                  <Target size={24} />
                </div>
                <div>
                  <p className="text-xs text-onSurface/60">Desfase Medio Inicio Siestas</p>
                  <p className="text-2xl font-bold text-onSurface">{napStartAvgErrorStr}</p>
                </div>
              </div>

              <div className="bg-surface-containerHighest border border-outline rounded-xl p-4 flex items-center gap-4">
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
              <ResponsiveContainer width="100%" height={280}>
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
            </div>

            <div>
              <h3 className="text-sm font-medium text-onSurface mb-1">Desviación: Hora de Inicio de Siestas</h3>
              <p className="text-xs text-onSurface/40 mb-3">
                Error en la hora a la que realmente se durmió vs la predicción.
              </p>
              <ResponsiveContainer width="100%" height={280}>
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
            </div>

            <div>
              <h3 className="text-sm font-medium text-onSurface mb-1">Estimación: Duración de Siestas</h3>
              <p className="text-xs text-onSurface/40 mb-3">
                Comparativa de minutos reales vs los estimados por la IA.
              </p>
              <ResponsiveContainer width="100%" height={280}>
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