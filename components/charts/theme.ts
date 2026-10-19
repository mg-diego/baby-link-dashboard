import { formatDayLabel } from '@/lib/time'

// Recharts necesita colores literales: mantener sincronizado con @theme en globals.css.
export const C = {
  primary: '#7BB8F0',
  secondary: '#B8A0E8',
  surface: '#1A1D2E',
  surfaceAlt: '#242746',
  outline: '#2E3250',
  onSurface: '#E8EAF6',
  error: '#F09595',
  muted: '#7986CB',
  // Series auxiliares
  trend: '#8B5CF6',
  trendAlt: '#F6B15C',
  amber: '#FFB74D',
  good: '#4ADE80',
  warn: '#FACC15',
} as const

export const AXIS_TICK = { fill: C.muted, fontSize: 11 }

export const GRID_PROPS = { strokeDasharray: '3 3', stroke: C.outline }

export const LEGEND_PROPS = { wrapperStyle: { color: C.muted, fontSize: 12, paddingTop: 10 } }

/** Props para un XAxis de días ("yyyy-MM-dd"). */
export const dateAxisProps = (tickFormatter: (key: string) => string = formatDayLabel) => ({
  dataKey: 'date',
  minTickGap: 20,
  tick: AXIS_TICK,
  tickFormatter,
})
