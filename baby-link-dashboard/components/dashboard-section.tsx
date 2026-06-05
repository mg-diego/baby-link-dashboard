'use client'

import { useState, ReactNode } from 'react'

// ── Palette Exportada (Para usar en Recharts de cualquier página) ────────────
export const C = {
  primary:     '#7BB8F0',
  secondary:   '#B8A0E8',
  surface:     '#1A1D2E',
  surfaceAlt:  '#242746',
  outline:     '#2E3250',
  onSurface:   '#E8EAF6',
  error:       '#F09595',
  muted:       '#7986CB',
}

// ── Tooltip genérico exportado ────────────────────────────────────────────────
export const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-containerHighest border border-outline rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-onSurface/60 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? C.primary }}>
          {p.name}: <span className="font-medium">{formatter ? formatter(p.value, p.name) : p.value}</span>
        </p>
      ))}
    </div>
  )
}

// ── KPI Card genérico ─────────────────────────────────────────────────────────
export interface KpiProps {
  icon: any
  label: string
  value: string | number
  // Permite sobreescribir los colores del icono (ej: "text-error bg-error/20")
  iconColorClass?: string 
}

export function KpiCard({ icon: Icon, label, value, iconColorClass = "text-primary bg-primary/20" }: KpiProps) {
  return (
    <div className="bg-surface border border-outline rounded-2xl p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg shrink-0 ${iconColorClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-onSurface/50">{label}</p>
        <p className="text-xl font-semibold text-onSurface">{value}</p>
      </div>
    </div>
  )
}

// ── Layout de Sección Principal ───────────────────────────────────────────────
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
      
      {/* 1. Opcional: Título de la página */}
      {(title || description) && (
        <div className="mb-4">
          {title && <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>}
          {description && <p className="text-onSurfaceVariant">{description}</p>}
        </div>
      )}

      {/* 2. Zona de KPIs */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi, i) => (
            <KpiCard key={i} {...kpi} />
          ))}
        </div>
      )}

      {/* 3. Zona Central con Pestañas */}
      {tabs.length > 0 && (
        <div className="bg-surface border border-outline rounded-2xl overflow-hidden shadow-sm">
          {/* Navegación de pestañas */}
          <div className="flex border-b border-outline overflow-x-auto">
            {tabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(i)}
                className={`flex-1 min-w-[120px] py-3 text-sm font-medium transition-colors ${
                  activeTab === i
                    ? 'text-primary border-b-2 border-primary bg-primary/10'
                    : 'text-onSurface/50 hover:text-onSurface hover:bg-surface-containerHighest'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenido inyectado de la pestaña activa */}
          <div className="p-5">
            {tabs[activeTab].content}
          </div>
        </div>
      )}
    </div>
  )
}