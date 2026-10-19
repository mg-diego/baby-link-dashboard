'use client'

import { useState, type ReactNode } from 'react'
import {
  Activity, Baby, BarChart3, CalendarDays, Clock, Droplets, Milk, Moon, Utensils, type LucideIcon,
} from 'lucide-react'
import type { LastEvent, OverviewStats } from './data'

const formatHrs = (mins: number) => `${Math.floor(mins / 60)}h ${mins % 60}m`

// Paletas pastel de las tarjetas de "últimos eventos"
const TONES = {
  sleep: { bg: '#F3E8FF', border: '#D8B4FE', strong: '#6B21A8', mid: '#7E22CE', soft: '#9333EA' },
  feed: { bg: '#E0F2FE', border: '#BAE6FD', strong: '#0369A1', mid: '#0284C7', soft: '#0EA5E9' },
  diaper: { bg: '#FEF9C3', border: '#FEF08A', strong: '#854D0E', mid: '#A16207', soft: '#CA8A04' },
}
type Tone = (typeof TONES)[keyof typeof TONES]

function LastEventCard({ icon: Icon, title, event, detailLabel, tone }: {
  icon: LucideIcon
  title: string
  event: LastEvent | null
  detailLabel: string
  tone: Tone
}) {
  return (
    <div className="rounded-xl border p-5 flex flex-col justify-between h-32" style={{ backgroundColor: tone.bg, borderColor: tone.border }}>
      <div className="flex items-center justify-between mb-2" style={{ color: tone.strong }}>
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <span className="font-bold">{event?.time ?? '-'}</span>
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: tone.mid }}>{event?.type ?? 'Sin datos'}</p>
        <p className="text-xs mt-1" style={{ color: tone.soft }}>
          {event ? `${detailLabel}: ${event.detail}` : 'No hay registros'}
        </p>
      </div>
    </div>
  )
}

function TodayMetric({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: ReactNode; tone: Tone }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-outline bg-surface-container/30">
      <div className="p-3 rounded-lg" style={{ backgroundColor: tone.bg, color: tone.strong }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-on-surface/60 font-medium">{label}</p>
        <p className="text-lg font-bold text-on-surface">{value}</p>
      </div>
    </div>
  )
}

function GlobalStat({ icon: Icon, label, value, unit, hint, colorClass }: {
  icon: LucideIcon
  label: string
  value: number
  unit?: string
  hint: string
  colorClass: string
}) {
  return (
    <div className="p-5 rounded-xl border border-outline bg-surface">
      <div className="flex items-center gap-2 mb-3 text-on-surface/60">
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className={`text-3xl font-bold ${colorClass}`}>
        {value}
        {unit && <span className="text-lg text-on-surface/40 font-medium">{unit}</span>}
      </p>
      <p className="text-xs text-on-surface/40 mt-1">{hint}</p>
    </div>
  )
}

function Breakdown({ icon: Icon, title, iconClass, rows, footer }: {
  icon: LucideIcon
  title: string
  iconClass: string
  rows: [string, ReactNode][]
  footer?: [string, ReactNode]
}) {
  return (
    <div className="p-6 rounded-xl border border-outline bg-surface-container/20">
      <h3 className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconClass}`} />
        {title}
      </h3>
      <div className="space-y-3">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between items-center text-sm">
            <span className="text-on-surface/60">{label}</span>
            <span className="font-semibold text-on-surface">{value}</span>
          </div>
        ))}
        {footer && (
          <div className="pt-3 mt-3 border-t border-outline/50 flex justify-between items-center text-sm">
            <span className="font-medium text-on-surface">{footer[0]}</span>
            <span className="font-bold text-secondary">{footer[1]}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OverviewClient({ stats }: { stats: OverviewStats }) {
  const [activeTab, setActiveTab] = useState<'today' | 'global'>('today')
  const { today, global } = stats

  const tabButton = (tab: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
        activeTab === tab ? 'bg-surface text-primary shadow-sm' : 'text-on-surface/60 hover:text-on-surface'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-surface p-6 sm:p-8 rounded-2xl shadow-sm border border-outline">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-on-surface">Overview</h1>
            <p className="text-on-surface/60 mt-1">Resumen general del estado de tu bebé.</p>
          </div>
          <div className="flex p-1 bg-surface-container rounded-lg border border-outline w-fit">
            {tabButton('today', 'Hoy')}
            {tabButton('global', 'Global')}
          </div>
        </div>

        {activeTab === 'today' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-4">Últimos eventos</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <LastEventCard icon={Moon} title="Último sueño" event={today.lastSleep} detailLabel="Duración" tone={TONES.sleep} />
                <LastEventCard icon={Milk} title="Última toma" event={today.lastFeed} detailLabel="Cantidad" tone={TONES.feed} />
                <LastEventCard icon={Baby} title="Último pañal" event={today.lastDiaper} detailLabel="Estado" tone={TONES.diaper} />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-on-surface mb-4">Métricas de hoy</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <TodayMetric icon={Clock} label="Sueño total" value={formatHrs(today.sleepMins)} tone={TONES.sleep} />
                <TodayMetric icon={Activity} label="Tomas hoy" value={today.feeds} tone={TONES.feed} />
                <TodayMetric icon={CalendarDays} label="Pañales hoy" value={today.diapers} tone={TONES.diaper} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-semibold text-on-surface mb-2">Foto Global (Todos los tiempos)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <GlobalStat icon={Moon} label="Sueño Histórico" value={Math.floor(global.totalSleepMins / 60)} unit="h" hint="Horas totales de sueño registradas" colorClass="text-primary" />
              <GlobalStat icon={Utensils} label="Alimentación" value={global.totalFeeds} hint="Tomas totales (Pecho, biberón, sólidos)" colorClass="text-secondary" />
              <GlobalStat icon={Milk} label="Volumen Leche" value={Math.floor(global.totalMl / 1000)} unit="L" hint="Litros totales de leche en biberón" colorClass="text-secondary" />
              <GlobalStat icon={Baby} label="Pañales" value={global.totalDiapers} hint="Cambios de pañal totales" colorClass="text-error" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Breakdown
                icon={BarChart3}
                title="Desglose Alimentación"
                iconClass="text-secondary"
                rows={[
                  ['Tomas de Biberón', global.totalBottles],
                  ['Tomas de Pecho', global.totalNursing],
                  ['Tomas de Sólidos', global.totalSolids],
                ]}
                footer={['Total Biberón (ml)', `${global.totalMl} ml`]}
              />
              <Breakdown
                icon={Droplets}
                title="Desglose Pañales"
                iconClass="text-error"
                rows={[
                  ['Mojados (Pipi)', global.diapersWet],
                  ['Sucios (Caca)', global.diapersDirty],
                  ['Mixtos (Ambos)', global.diapersBoth],
                  ['Limpios', global.diapersClean],
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
