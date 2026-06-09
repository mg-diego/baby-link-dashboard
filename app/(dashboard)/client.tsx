'use client'

import { useState } from 'react'
import { Moon, Milk, Baby, Activity, Clock, CalendarDays, BarChart3, Droplets, Utensils } from 'lucide-react'

export default function OverviewClient({ stats }: { stats: any }) {
  const [activeTab, setActiveTab] = useState<'today' | 'global'>('today')

  const { today, global } = stats

  const formatHrs = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return `${h}h ${m}m`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-outline">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-onSurface">Overview</h1>
            <p className="text-onSurface/60 mt-1">Resumen general del estado de tu bebé.</p>
          </div>
          
          <div className="flex p-1 bg-surfaceAlt rounded-lg border border-outline w-fit">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'today' ? 'bg-surface text-primary shadow-sm' : 'text-onSurface/60 hover:text-onSurface'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setActiveTab('global')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'global' ? 'bg-surface text-primary shadow-sm' : 'text-onSurface/60 hover:text-onSurface'
              }`}
            >
              Global
            </button>
          </div>
        </div>

        {activeTab === 'today' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-onSurface mb-4">Últimos eventos</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="bg-[#F3E8FF] rounded-xl border border-[#D8B4FE] p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Moon className="w-5 h-5 text-[#6B21A8]" />
                      <h3 className="text-[#6B21A8] font-semibold">Último sueño</h3>
                    </div>
                    <span className="text-[#6B21A8] font-bold">{today.lastSleep?.time || '-'}</span>
                  </div>
                  <div>
                    <p className="text-[#7E22CE] text-sm font-medium">{today.lastSleep?.type || 'Sin datos'}</p>
                    <p className="text-[#9333EA] text-xs mt-1">
                      {today.lastSleep?.duration ? `Duración: ${today.lastSleep.duration}` : 'No hay registros hoy'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#E0F2FE] rounded-xl border border-[#BAE6FD] p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Milk className="w-5 h-5 text-[#0369A1]" />
                      <h3 className="text-[#0369A1] font-semibold">Última toma</h3>
                    </div>
                    <span className="text-[#0369A1] font-bold">{today.lastFeed?.time || '-'}</span>
                  </div>
                  <div>
                    <p className="text-[#0284C7] text-sm font-medium">{today.lastFeed?.type || 'Sin datos'}</p>
                    <p className="text-[#0EA5E9] text-xs mt-1">
                      {today.lastFeed?.amount ? `Cantidad: ${today.lastFeed.amount}` : 'No hay registros hoy'}
                    </p>
                  </div>
                </div>

                <div className="bg-[#FEF9C3] rounded-xl border border-[#FEF08A] p-5 flex flex-col justify-between h-32">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Baby className="w-5 h-5 text-[#854D0E]" />
                      <h3 className="text-[#854D0E] font-semibold">Último pañal</h3>
                    </div>
                    <span className="text-[#854D0E] font-bold">{today.lastDiaper?.time || '-'}</span>
                  </div>
                  <div>
                    <p className="text-[#A16207] text-sm font-medium">{today.lastDiaper?.type || 'Sin datos'}</p>
                    <p className="text-[#CA8A04] text-xs mt-1">
                      {today.lastDiaper?.state ? `Estado: ${today.lastDiaper.state}` : 'No hay registros hoy'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-onSurface mb-4">Métricas de hoy</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-outline bg-surfaceAlt/30">
                  <div className="p-3 bg-[#F3E8FF] text-[#6B21A8] rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-onSurface/60 font-medium">Sueño total</p>
                    <p className="text-lg font-bold text-onSurface">{formatHrs(today.sleepMins)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-outline bg-surfaceAlt/30">
                  <div className="p-3 bg-[#E0F2FE] text-[#0369A1] rounded-lg">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-onSurface/60 font-medium">Tomas hoy</p>
                    <p className="text-lg font-bold text-onSurface">{today.feeds}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-outline bg-surfaceAlt/30">
                  <div className="p-3 bg-[#FEF9C3] text-[#854D0E] rounded-lg">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-onSurface/60 font-medium">Pañales hoy</p>
                    <p className="text-lg font-bold text-onSurface">{today.diapers}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-semibold text-onSurface mb-2">Foto Global (Todos los tiempos)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-5 rounded-xl border border-outline bg-surface">
                <div className="flex items-center gap-2 mb-3 text-onSurface/60">
                  <Moon className="w-4 h-4" />
                  <span className="text-sm font-medium">Sueño Histórico</span>
                </div>
                <p className="text-3xl font-bold text-primary">{Math.floor(global.totalSleepMins / 60)}<span className="text-lg text-onSurface/40 font-medium">h</span></p>
                <p className="text-xs text-onSurface/40 mt-1">Horas totales de sueño registradas</p>
              </div>

              <div className="p-5 rounded-xl border border-outline bg-surface">
                <div className="flex items-center gap-2 mb-3 text-onSurface/60">
                  <Utensils className="w-4 h-4" />
                  <span className="text-sm font-medium">Alimentación</span>
                </div>
                <p className="text-3xl font-bold text-secondary">{global.totalFeeds}</p>
                <p className="text-xs text-onSurface/40 mt-1">Tomas totales (Pecho, biberón, sólidos)</p>
              </div>

              <div className="p-5 rounded-xl border border-outline bg-surface">
                <div className="flex items-center gap-2 mb-3 text-onSurface/60">
                  <Milk className="w-4 h-4" />
                  <span className="text-sm font-medium">Volumen Leche</span>
                </div>
                <p className="text-3xl font-bold text-secondary">{Math.floor(global.totalMl / 1000)}<span className="text-lg text-onSurface/40 font-medium">L</span></p>
                <p className="text-xs text-onSurface/40 mt-1">Litros totales de leche en biberón</p>
              </div>

              <div className="p-5 rounded-xl border border-outline bg-surface">
                <div className="flex items-center gap-2 mb-3 text-onSurface/60">
                  <Baby className="w-4 h-4" />
                  <span className="text-sm font-medium">Pañales</span>
                </div>
                <p className="text-3xl font-bold text-error">{global.totalDiapers}</p>
                <p className="text-xs text-onSurface/40 mt-1">Cambios de pañal totales</p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="p-6 rounded-xl border border-outline bg-surfaceAlt/20">
                <h3 className="text-sm font-bold text-onSurface mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-secondary" /> 
                  Desglose Alimentación
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-onSurface/60">Tomas de Biberón</span>
                    <span className="font-semibold text-onSurface">{global.totalBottles}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-onSurface/60">Tomas de Pecho</span>
                    <span className="font-semibold text-onSurface">{global.totalNursing}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-onSurface/60">Tomas de Sólidos</span>
                    <span className="font-semibold text-onSurface">{global.totalSolids}</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-outline/50 flex justify-between items-center text-sm">
                    <span className="font-medium text-onSurface">Total Biberón (ml)</span>
                    <span className="font-bold text-secondary">{global.totalMl} ml</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl border border-outline bg-surfaceAlt/20">
                <h3 className="text-sm font-bold text-onSurface mb-4 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-error" /> 
                  Desglose Pañales
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-onSurface/60">Mojados (Pipi)</span>
                    <span className="font-semibold text-onSurface">{global.diapersWet}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-onSurface/60">Sucios (Caca)</span>
                    <span className="font-semibold text-onSurface">{global.diapersDirty}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-onSurface/60">Mixtos (Ambos)</span>
                    <span className="font-semibold text-onSurface">{global.diapersBoth}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-onSurface/60">Limpios</span>
                    <span className="font-semibold text-onSurface">{global.diapersClean}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}