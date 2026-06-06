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

function SleepGantt({ ganttByDate }: { ganttByDate: SleepStats['ganttByDate'] }) {
  const ROW_H  = 26
  const GAP    = 3
  const LEFT   = 64
  const RIGHT  = 8
  const BOTTOM = 28
  const W      = 760
  const chartW = W - LEFT - RIGHT
  const totalH = ganttByDate.length * (ROW_H + GAP) + BOTTOM

  const xTicks = [0, 4, 8, 12, 16, 20, 24]

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <svg viewBox={`0 0 ${W} ${totalH}`} width="100%" className="overflow-visible">
          {xTicks.map(h => {
            const x = LEFT + (h / 24) * chartW
            return <line key={h} x1={x} y1={0} x2={x} y2={totalH - BOTTOM} stroke={C.outline} strokeWidth={1} />
          })}

          {ganttByDate.map((row, i) => {
            const y = i * (ROW_H + GAP)
            return (
              <g key={row.date}>
                <text x={LEFT - 6} y={y + ROW_H / 2 + 4} textAnchor="end" fill={C.onSurface} fontSize={10} opacity={0.7}>
                  {row.label}
                </text>
                <rect x={LEFT} y={y} width={chartW} height={ROW_H} fill={C.surface} rx={3} />
                {row.events.map((ev, j) => {
                  const ex = LEFT + (ev.startHour / 24) * chartW
                  const ew = Math.max((ev.duration / 24) * chartW, 2)
                  return (
                    <rect
                      key={j}
                      x={ex} y={y + 2}
                      width={ew} height={ROW_H - 4}
                      fill={GANTT_COLORS[ev.status]}
                      rx={3} opacity={0.85}
                    >
                      <title>{`${ev.startTimeStr} – ${ev.endTimeStr} (${ev.durationStr})`}</title>
                    </rect>
                  )
                })}
              </g>
            )
          })}

          {xTicks.map(h => {
            const x = LEFT + (h / 24) * chartW
            return (
              <text key={h} x={x} y={totalH - 6} textAnchor="middle" fill={C.muted} fontSize={10}>
                {`${h.toString().padStart(2,'0')}:00`}
              </text>
            )
          })}
        </svg>

        <div className="flex gap-4 mt-3 flex-wrap">
          {[
            { label: 'Sueño sólido',       color: GANTT_COLORS.night_solid },
            { label: 'Sueño interrumpido', color: GANTT_COLORS.night_interrupted },
            { label: 'Despertar nocturno', color: GANTT_COLORS.night_waking },
            { label: 'Siesta',             color: GANTT_COLORS.nap },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span className="text-xs text-onSurface/60">{l.label}</span>
            </div>
          ))}
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
          <SleepGantt ganttByDate={ganttByDate} />
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