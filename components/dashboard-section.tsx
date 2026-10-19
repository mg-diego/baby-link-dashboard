'use client'

import { useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

// ── KPI Card ──────────────────────────────────────────────────────────────────
export interface KpiProps {
  icon: LucideIcon
  label: string
  value: string | number
  /** Colores del icono, p. ej. "text-error bg-error/20" */
  iconColorClass?: string
}

export function KpiCard({ icon: Icon, label, value, iconColorClass = 'text-primary bg-primary/20' }: KpiProps) {
  return (
    <div className="bg-surface border border-outline rounded-2xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${iconColorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-on-surface/50">{label}</p>
        <p className="text-xl font-semibold text-on-surface">{value}</p>
      </div>
    </div>
  )
}

// ── Layout de sección: título + KPIs + pestañas ──────────────────────────────
export interface TabDef {
  label: string
  content: ReactNode
}

interface DashboardSectionProps {
  title?: string
  description?: string
  kpis: KpiProps[]
  tabs: TabDef[]
}

export function DashboardSection({ title, description, kpis, tabs }: DashboardSectionProps) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div className="space-y-6">
      {(title || description) && (
        <div className="mb-4">
          {title && <h1 className="text-2xl font-bold text-on-surface mb-2">{title}</h1>}
          {description && <p className="text-on-surface/60">{description}</p>}
        </div>
      )}

      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map(kpi => <KpiCard key={kpi.label} {...kpi} />)}
        </div>
      )}

      {tabs.length > 0 && (
        <div className="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm">
          <div className="flex border-b border-outline overflow-x-auto">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(i)}
                className={`flex-1 min-w-[120px] py-3 text-sm font-medium transition-colors ${
                  activeTab === i
                    ? 'text-primary border-b-2 border-primary bg-primary/10'
                    : 'text-on-surface/50 hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            <div key={activeTab} className="space-y-8 animate-in fade-in duration-500">
              {tabs[activeTab].content}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
