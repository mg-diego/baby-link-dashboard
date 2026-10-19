'use client'

import type { ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'
import { ChartLazyLoader } from './chart-lazy-loader'

interface ChartCardProps {
  title: string
  description?: string
  height?: number
  children: ReactElement
}

/** Título + descripción + gráfica responsive con carga diferida. */
export function ChartCard({ title, description, height = 300, children }: ChartCardProps) {
  return (
    <div>
      <h3 className={`text-sm font-medium text-on-surface ${description ? 'mb-1' : 'mb-3'}`}>{title}</h3>
      {description && <p className="text-xs text-on-surface/40 mb-3">{description}</p>}
      <ChartLazyLoader height={height}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </ChartLazyLoader>
    </div>
  )
}
