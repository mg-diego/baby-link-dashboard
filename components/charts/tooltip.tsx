import type { ReactNode } from 'react'
import type { TooltipContentProps, TooltipValueType } from 'recharts'
import { formatLongDate } from '@/lib/time'
import { C } from './theme'

export type TooltipProps = Partial<TooltipContentProps<TooltipValueType, string | number>>

export function TooltipCard({ title, children }: { title?: ReactNode; children: ReactNode }) {
  return (
    <div className="bg-surface border border-outline rounded-xl px-3 py-2 text-xs shadow-2xl min-w-[160px]">
      {title && <p className="text-on-surface font-medium mb-2 border-b border-outline/30 pb-1">{title}</p>}
      {children}
    </div>
  )
}

export function TooltipRow({ label, value, color }: { label: ReactNode; value: ReactNode; color?: string }) {
  return (
    <div className="flex justify-between items-center gap-4 my-1" style={{ color }}>
      <span className="opacity-80">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

export function TrendRow({ value, color = C.trend }: { value: ReactNode; color?: string }) {
  return (
    <div className="flex justify-between items-center gap-4 mt-2 pt-1 border-t border-outline/30" style={{ color }}>
      <span>Tendencia</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

/** Tooltip genérico: una fila por serie. */
export function ChartTooltip({
  active, payload, label,
  formatValue = String,
  formatLabel = formatLongDate,
}: TooltipProps & { formatValue?: (v: number) => string; formatLabel?: (label: string) => string }) {
  if (!active || !payload?.length) return null
  return (
    <TooltipCard title={formatLabel(String(label ?? ''))}>
      {payload.map(p => (
        <TooltipRow key={String(p.dataKey)} label={p.name} value={formatValue(Number(p.value))} color={p.color ?? C.primary} />
      ))}
    </TooltipCard>
  )
}
