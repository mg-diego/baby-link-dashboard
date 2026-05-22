'use client'

import { useState } from 'react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { Moon, Clock, Sunrise, BellRing } from 'lucide-react'
import { SleepStats, GanttEntry } from './data'

// ── Palette ────────────────────────────────────────────────────────────────────
const C = {
  primary:     '#7BB8F0',
  secondary:   '#B8A0E8',
  surface:     '#1A1D2E',
  surfaceAlt:  '#242746',
  outline:     '#2E3250',
  onSurface:   '#E8EAF6',
  error:       '#F09595',
  muted:       '#7986CB',
}

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

// ── Gantt ──────────────────────────────────────────────────────────────────────
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
          {/* Grid lines */}
          {xTicks.map(h => {
            const x = LEFT + (h / 24) * chartW
            return <line key={h} x1={x} y1={0} x2={x} y2={totalH - BOTTOM} stroke={C.outline} strokeWidth={1} />
          })}

          {/* Rows */}
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

          {/* X axis labels */}
          {xTicks.map(h => {
            const x = LEFT + (h / 24) * chartW
            return (
              <text key={h} x={x} y={totalH - 6} textAnchor="middle" fill={C.muted} fontSize={10}>
                {`${h.toString().padStart(2,'0')}:00`}
              </text>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="flex gap-4 mt-3 flex-wrap">
          {[
            { label: 'Sueño sólido',       color: GANTT_COLORS.night_solid },
            { label: 'Sueño interrumpido',  color: GANTT_COLORS.night_interrupted },
            { label: 'Despertar nocturno',  color: GANTT_COLORS.night_waking },
            { label: 'Siesta',              color: GANTT_COLORS.nap },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              <span className="text-xs text-on-surface/60">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tooltip genérico ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-container border border-outline rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-on-surface/60 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? C.primary }}>
          {p.name}: <span className="font-medium">{formatter ? formatter(p.value, p.name) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-surface border border-outline rounded-2xl p-4 flex items-center gap-3">
      <div className="p-2 bg-primary-container rounded-lg text-primary shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-on-surface/50">{label}</p>
        <p className="text-xl font-semibold text-on-surface">{value}</p>
      </div>
    </div>
  )
}

// ── Tabs ───────────────────────────────────────────────────────────────────────
const TABS = ['Timeline', 'Tendencias', 'Siestas', 'Despertares']

// ── Main Client ───────────────────────────────────────────────────────────────
export default function SleepClient({ stats }: { stats: SleepStats }) {
  const [tab, setTab] = useState(0)
  const { kpis, ganttByDate, dailySleep, wakeUpTimes, bedTimes,
          napRaw, wakeWindows, nightWakingsByDay, nightWakingScatter, cursedHour } = stats

  // Nap stacked data
  const napRanks = [...new Set(napRaw.map(n => n.napRank))]
  const napByDate = napRaw.reduce<Record<string, Record<string, number>>>((acc, n) => {
    if (!acc[n.date]) acc[n.date] = {}
    acc[n.date][n.napRank] = n.durationHours
    return acc
  }, {})
  const napStackData = Object.entries(napByDate).map(([date, naps]) => ({ date, ...naps }))

  const NAP_COLORS = ['#B8A0E8','#9B7FDB','#7B5FC4','#5C40A0','#3D2280']
  const maxCursed = Math.max(...cursedHour.map(h => h.count))

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Moon}     label="Sueño total promedio" value={kpis.avgTotalSleep} />
        <KpiCard icon={Sunrise}  label="Hora de despertar"    value={kpis.avgWakeTime} />
        <KpiCard icon={Clock}    label="Hora de dormir"        value={kpis.avgBedTime} />
        <KpiCard icon={BellRing} label="Despertares nocturnos" value={kpis.avgNightWakings} />
      </div>

      {/* Tabs */}
      <div className="bg-surface border border-outline rounded-2xl overflow-hidden">
        <div className="flex border-b border-outline">
          {TABS.map((t, i) => (
            <button
              key={t}
              onClick={() => setTab(i)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === i
                  ? 'text-primary border-b-2 border-primary bg-primary-container/30'
                  : 'text-on-surface/50 hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* ── Tab 0: Timeline ── */}
          {tab === 0 && (
            <div>
              <p className="text-sm text-on-surface/50 mb-4">
                Periodos de sueño por día. Hover sobre cada barra para ver detalles.
              </p>
              <SleepGantt ganttByDate={ganttByDate} />
            </div>
          )}

          {/* ── Tab 1: Tendencias ── */}
          {tab === 1 && (
            <div className="space-y-8">
              {/* Total sleep */}
              <div>
                <h3 className="text-sm font-medium text-on-surface mb-3">Horas de sueño totales por día</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={dailySleep}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                    <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis domain={[0, 24]} tick={{ fill: C.muted, fontSize: 11 }}
                      tickFormatter={v => `${v}h`} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(1)}h`} />} />
                    <Area dataKey="totalHours" name="Sueño total" stroke={C.primary} fill={C.primary} fillOpacity={0.15} strokeWidth={2} />
                    <Line dataKey="avg" name="Promedio" stroke={C.muted} strokeDasharray="4 4" dot={false} strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Wake up time */}
              <div>
                <h3 className="text-sm font-medium text-on-surface mb-3">Hora de despertar</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={wakeUpTimes}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                    <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis domain={[4, 12]} tick={{ fill: C.muted, fontSize: 11 }}
                      tickFormatter={formatHour} />
                    <Tooltip content={<ChartTooltip formatter={(_: any, __: any, p: any) => p?.payload?.timeStr} />} />
                    <Line dataKey="hourDecimal" name="Despertar" stroke="#FFB74D" strokeWidth={2}
                      dot={{ fill: '#FFB74D', r: 3 }} />
                    <ReferenceLine y={wakeUpTimes.reduce((s,w)=>s+w.hourDecimal,0)/Math.max(wakeUpTimes.length,1)}
                      stroke={C.muted} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bed time */}
              <div>
                <h3 className="text-sm font-medium text-on-surface mb-3">Hora de dormir</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={bedTimes}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                    <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis domain={[16, 24]} tick={{ fill: C.muted, fontSize: 11 }}
                      tickFormatter={formatHour} />
                    <Tooltip content={<ChartTooltip formatter={(_: any, __: any, p: any) => p?.payload?.timeStr} />} />
                    <Line dataKey="hourDecimal" name="Hora dormir" stroke={C.error} strokeWidth={2}
                      dot={{ fill: C.error, r: 3 }} />
                    <ReferenceLine y={bedTimes.reduce((s,b)=>s+b.hourDecimal,0)/Math.max(bedTimes.length,1)}
                      stroke={C.muted} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Tab 2: Siestas ── */}
          {tab === 2 && (
            <div className="space-y-8">
              {/* Stacked nap bar */}
              <div>
                <h3 className="text-sm font-medium text-on-surface mb-3">Duración de siestas por día</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={napStackData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                    <XAxis dataKey="date" tick={{ fill: C.muted, fontSize: 11 }} />
                    <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => `${v.toFixed(1)}h`} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => `${v.toFixed(2)}h`} />} />
                    <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
                    {napRanks.map((rank, i) => (
                      <Bar key={rank} dataKey={rank} stackId="a" fill={NAP_COLORS[i % NAP_COLORS.length]} radius={i === napRanks.length - 1 ? [4,4,0,0] : undefined} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Wake windows scatter */}
              <div>
                <h3 className="text-sm font-medium text-on-surface mb-1">Ventanas de vigilia</h3>
                <p className="text-xs text-on-surface/40 mb-3">Tiempo despierto entre siesta y siesta / hora de dormir</p>
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
                          <div className="bg-surface-container border border-outline rounded-xl px-3 py-2 text-xs">
                            <p className="text-on-surface/60">{d.date}</p>
                            <p className="text-primary">{d.windowName}: <span className="font-medium">{d.durationStr}</span></p>
                          </div>
                        )
                      }}
                    />
                    {[...new Set(wakeWindows.map(w => w.windowName))].map((name, i) => (
                      <Scatter
                        key={name}
                        name={name}
                        data={wakeWindows.filter(w => w.windowName === name)}
                        fill={NAP_COLORS[i % NAP_COLORS.length]}
                      />
                    ))}
                    <Legend wrapperStyle={{ color: C.muted, fontSize: 12 }} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── Tab 3: Despertares nocturnos ── */}
          {tab === 3 && (
            <div className="space-y-8">
              {/* Duration by day */}
              <div>
                <h3 className="text-sm font-medium text-on-surface mb-1">Tiempo total despierto por noche</h3>
                <p className="text-xs text-on-surface/40 mb-3">Suma de duración de todos los despertares nocturnos</p>
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

              {/* Scatter: time of night vs date */}
              <div>
                <h3 className="text-sm font-medium text-on-surface mb-1">Distribución horaria de despertares</h3>
                <p className="text-xs text-on-surface/40 mb-3">Burbujas más grandes = despertares más largos</p>
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
                          <div className="bg-surface-container border border-outline rounded-xl px-3 py-2 text-xs">
                            <p className="text-on-surface/60">{d.date}</p>
                            <p className="text-error">Hora: <span className="font-medium">{d.timeStr}</span></p>
                            <p className="text-error">Duración: <span className="font-medium">{d.durationStr}</span></p>
                          </div>
                        )
                      }}
                    />
                    <Scatter
                      data={nightWakingScatter.map(d => ({
                        ...d,
                        hourDecimal: d.hourDecimal < 18 ? d.hourDecimal + 24 : d.hourDecimal
                      }))}
                      fill={C.error}
                      fillOpacity={0.7}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Cursed hour */}
              <div>
                <h3 className="text-sm font-medium text-on-surface mb-1">La "hora maldita" 🕰️</h3>
                <p className="text-xs text-on-surface/40 mb-3">Distribución de despertares por hora</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cursedHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                    <XAxis dataKey="hour" tick={{ fill: C.muted, fontSize: 10 }}
                      interval={3} />
                    <YAxis tick={{ fill: C.muted, fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip formatter={(v: number) => `${v} veces`} />} />
                    <Bar dataKey="count" name="Despertares" radius={[3,3,0,0]}>
                      {cursedHour.map((entry, i) => (
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
          )}
        </div>
      </div>
    </div>
  )
}