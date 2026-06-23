'use client'

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis
} from 'recharts'
import { Utensils, Milk, Timer } from 'lucide-react'
import { DashboardSection, C } from '@/components/dashboard-section'
import { formatAxisDate, withTrend, formatHour } from '@/utils/utils'
import { renderMonthDividers } from '@/components/month-divider'
import { ChartLazyLoader } from '@/components/chart-lazy-loader'

export default function FeedingClient({ stats }: { stats: any }) {
  const {
    kpis,
    dailyComposition = [],
    nursingTrends = [],
    nursingGaps = [],
    bottleByType = [],
    bottleScatter = [],
    milkTypes = []
  } = stats

  const nursingWithTotal = nursingTrends.map((d: any) => ({
    ...d,
    totalMins: (Number(d.L) || 0) + (Number(d.R) || 0) + (Number(d.U) || 0)
  }))
  const nursingWithTrend = withTrend(nursingWithTotal, 'totalMins')
  const nursingGapsWithTrend = withTrend(nursingGaps, 'avgGapH')
  const bottleCountsWithTrend = withTrend(dailyComposition, 'bottle')
  const solidsWithTrend = withTrend(dailyComposition, 'solids')

  const kpiData = [
    {
      icon: Utensils,
      label: "Tomas / Día",
      value: kpis?.avgFeeds || 0,
      iconColorClass: "text-primary bg-primary/20"
    },
    {
      icon: Milk,
      label: "Media Biberón (ml)",
      value: `${kpis?.avgMl || 0} ml`,
      iconColorClass: "text-secondary bg-secondary/20"
    },
    {
      icon: Timer,
      label: "Media Pecho (min)",
      value: `${kpis?.avgNursingMins || 0} m`,
      iconColorClass: "text-error bg-error/20"
    },
  ]

  const tabsData = [
    {
      label: 'Pecho',
      content: (
        <div className="animate-in fade-in duration-500 space-y-8">
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Minutos de Pecho Diarios</h3>
            <p className="text-xs text-onSurface/40 mb-3">Tiempo total al pecho desglosado por lado</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={nursingWithTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={formatAxisDate}
                  />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => `${v}m`} />

                  {renderMonthDividers(nursingWithTrend, C.error)}

                  <Tooltip
                    cursor={{ fill: C.surfaceAlt, opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
                          <p className="text-onSurface font-medium mb-2 border-b border-outline/30 pb-1">{d.date}</p>

                          {(d.L > 0) && (
                            <div className="flex justify-between items-center gap-4 my-1">
                              <span className="text-error/80">Izquierdo</span>
                              <span className="text-error font-bold">{d.L} m</span>
                            </div>
                          )}
                          {(d.R > 0) && (
                            <div className="flex justify-between items-center gap-4 my-1">
                              <span style={{ color: '#E8A0A0' }} className="opacity-80">Derecho</span>
                              <span style={{ color: '#E8A0A0' }} className="font-bold">{d.R} m</span>
                            </div>
                          )}
                          {(d.U > 0) && (
                            <div className="flex justify-between items-center gap-4 my-1">
                              <span style={{ color: '#DCA0A0' }} className="opacity-80">Indefinido</span>
                              <span style={{ color: '#DCA0A0' }} className="font-bold">{d.U} m</span>
                            </div>
                          )}

                          {d.totalMinsTrend !== null && d.totalMinsTrend !== undefined && (
                            <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-outline/30">
                              <span className="text-[#8B5CF6]">Tendencia Gral.</span>
                              <span className="text-[#8B5CF6] font-bold">{d.totalMinsTrend.toFixed(0)} m</span>
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Legend wrapperStyle={{ color: C.muted, fontSize: 12, paddingTop: '10px' }} />
                  <Bar dataKey="L" name="Izquierdo" stackId="a" fill={C.error} radius={[0, 0, 4, 4]} maxBarSize={32} />
                  <Bar dataKey="R" name="Derecho" stackId="a" fill="#E8A0A0" maxBarSize={32} />
                  <Bar dataKey="U" name="Indefinido" stackId="a" fill="#DCA0A0" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Line type="monotone" dataKey="totalMinsTrend" name="Tendencia Promedio" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Tiempo Medio Entre Tomas</h3>
            <p className="text-xs text-onSurface/40 mb-3">Distancia promedio en horas entre cada toma de pecho</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={nursingGapsWithTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={formatAxisDate}
                  />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => `${v}h`} />

                  {renderMonthDividers(nursingGapsWithTrend, C.error)}

                  <Tooltip
                    cursor={{ fill: C.surfaceAlt, opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
                          <p className="text-onSurface font-medium mb-2 border-b border-outline/30 pb-1">{d.date}</p>
                          <div className="flex justify-between items-center gap-4 my-1">
                            <span className="text-error/80">Tiempo medio</span>
                            <span className="text-error font-bold">{d.avgGapH?.toFixed(1)} h</span>
                          </div>
                          {d.avgGapHTrend !== null && d.avgGapHTrend !== undefined && (
                            <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-outline/30">
                              <span className="text-[#8B5CF6]">Tendencia Gral.</span>
                              <span className="text-[#8B5CF6] font-bold">{d.avgGapHTrend.toFixed(1)} h</span>
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Legend wrapperStyle={{ color: C.muted, fontSize: 12, paddingTop: '10px' }} />
                  <Bar dataKey="avgGapH" name="Promedio (Horas)" fill={C.error} radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.8} />
                  <Line type="monotone" dataKey="avgGapHTrend" name="Tendencia Promedio" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>
        </div>
      )
    },
    {
      label: 'Biberón',
      content: (
        <div className="animate-in fade-in duration-500 space-y-8">
          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Volumen Ingerido por Tipo</h3>
            <p className="text-xs text-onSurface/40 mb-3">Cantidad total diaria segmentada por tipo de leche</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={bottleByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={formatAxisDate}
                  />
                  <YAxis tick={{ fill: C.muted, fontSize: 11 }} tickFormatter={v => `${v}ml`} />

                  {renderMonthDividers(bottleByType, C.secondary)}

                  <Tooltip
                    cursor={{ fill: C.surfaceAlt, opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
                          <p className="text-onSurface font-medium mb-2 border-b border-outline/30 pb-1">{d.date}</p>
                          {payload.map((entry: any) => (
                            <div key={entry.dataKey} className="flex justify-between items-center gap-4 my-1">
                              <span style={{ color: entry.color }} className="opacity-80">{entry.name}</span>
                              <span style={{ color: entry.color }} className="font-bold">{entry.value} ml</span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Legend wrapperStyle={{ color: C.muted, fontSize: 12, paddingTop: '10px' }} />
                  {milkTypes.map((type: string, i: number) => (
                    <Bar
                      key={type}
                      dataKey={type}
                      name={type}
                      stackId="a"
                      fill={i % 2 === 0 ? C.secondary : '#7AD6D6'}
                      maxBarSize={32}
                      radius={i === milkTypes.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Frecuencia de Biberones</h3>
            <p className="text-xs text-onSurface/40 mb-3">Cantidad total de tomas de biberón por día</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={bottleCountsWithTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="date"
                    minTickGap={20}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={formatAxisDate}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: C.muted, fontSize: 11 }} />

                  {renderMonthDividers(bottleCountsWithTrend, C.secondary)}

                  <Tooltip
                    cursor={{ fill: C.surfaceAlt, opacity: 0.4 }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
                          <p className="text-onSurface font-medium mb-2 border-b border-outline/30 pb-1">{d.date}</p>
                          <div className="flex justify-between items-center gap-4 my-1">
                            <span className="text-secondary/80">Biberones</span>
                            <span className="text-secondary font-bold">{d.bottle}</span>
                          </div>
                          {d.bottleTrend !== null && d.bottleTrend !== undefined && (
                            <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-outline/30">
                              <span className="text-[#8B5CF6]">Tendencia Gral.</span>
                              <span className="text-[#8B5CF6] font-bold">{d.bottleTrend.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Legend wrapperStyle={{ color: C.muted, fontSize: 12, paddingTop: '10px' }} />
                  <Bar dataKey="bottle" name="Tomas" fill={C.secondary} radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.8} />
                  <Line type="monotone" dataKey="bottleTrend" name="Tendencia Promedio" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>

          <div>
            <h3 className="text-sm font-medium text-onSurface mb-1">Distribución Horaria y Tamaños</h3>
            <p className="text-xs text-onSurface/40 mb-3">Relación entre la hora de la toma y la cantidad ingerida</p>
            <ChartLazyLoader height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                  <XAxis
                    dataKey="hourDecimal"
                    type="number"
                    domain={[0, 24]}
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={v => `${Math.floor(v)}:00`}
                    name="Hora"
                  />
                  <YAxis
                    dataKey="amountMl"
                    type="number"
                    tick={{ fill: C.muted, fontSize: 11 }}
                    tickFormatter={v => `${v}ml`}
                    name="Cantidad"
                  />
                  <ZAxis range={[60, 60]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
                          <p className="text-onSurface/60 mb-2 border-b border-outline/30 pb-1">{d.date}</p>
                          <div className="flex justify-between items-center gap-4 my-1">
                            <span className="text-secondary/80">Hora</span>
                            <span className="text-secondary font-bold">{formatHour(d.hourDecimal)}</span>
                          </div>
                          <div className="flex justify-between items-center gap-4 my-1">
                            <span className="text-secondary/80">Cantidad</span>
                            <span className="text-secondary font-bold">{d.amountMl} ml</span>
                          </div>
                          {d.milkType && (
                            <div className="flex justify-between items-center gap-4 my-1">
                              <span className="text-secondary/80">Tipo</span>
                              <span className="text-secondary font-bold">{d.milkType}</span>
                            </div>
                          )}
                        </div>
                      )
                    }}
                  />
                  <Scatter data={bottleScatter} fill={C.secondary} fillOpacity={0.6} />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartLazyLoader>
          </div>
        </div>
      )
    },
    {
      label: 'Sólidos',
      content: (
        <div className="animate-in fade-in duration-500">
          <h3 className="text-sm font-medium text-onSurface mb-1">Tomas de Sólidos por Día</h3>
          <p className="text-xs text-onSurface/40 mb-3">Cantidad de veces que ha comido sólidos al día</p>
          <ChartLazyLoader height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={solidsWithTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.outline} />
                <XAxis
                  dataKey="date"
                  minTickGap={20}
                  tick={{ fill: C.muted, fontSize: 11 }}
                  tickFormatter={formatAxisDate}
                />
                <YAxis allowDecimals={false} tick={{ fill: C.muted, fontSize: 11 }} />

                {renderMonthDividers(solidsWithTrend, C.primary)}

                <Tooltip
                  cursor={{ fill: C.surfaceAlt, opacity: 0.4 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
                        <p className="text-onSurface font-medium mb-2 border-b border-outline/30 pb-1">{d.date}</p>
                        <div className="flex justify-between items-center gap-4 my-1">
                          <span className="text-primary/80">Tomas</span>
                          <span className="text-primary font-bold">{d.solids}</span>
                        </div>
                        {d.solidsTrend !== null && d.solidsTrend !== undefined && (
                          <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-outline/30">
                            <span className="text-[#8B5CF6]">Tendencia Gral.</span>
                            <span className="text-[#8B5CF6] font-bold">{d.solidsTrend.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    )
                  }}
                />
                <Legend wrapperStyle={{ color: C.muted, fontSize: 12, paddingTop: '10px' }} />
                <Bar dataKey="solids" name="Tomas" fill={C.primary} radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.8} />
                <Line type="monotone" dataKey="solidsTrend" name="Tendencia Promedio" stroke="#8B5CF6" strokeWidth={3} dot={false} activeDot={false} strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartLazyLoader>
        </div>
      )
    }
  ]

  return (
    <DashboardSection
      title="🍼 Alimentación"
      description="Análisis detallado de pecho, biberones y sólidos."
      kpis={kpiData}
      tabs={tabsData}
    />
  )
}