import { ReferenceLine } from 'recharts'
import { formatMonth, monthKey } from '@/lib/time'

/** Línea vertical en el primer día de cada mes. `data` debe ser el de la propia gráfica. */
export function renderMonthDividers(data: { date?: string | null }[], color: string) {
  const boundaries: string[] = []
  let lastMonth: string | null = null

  data.forEach(d => {
    const month = d?.date ? monthKey(d.date) : null
    if (!month) return
    if (month !== lastMonth) boundaries.push(d.date!)
    lastMonth = month
  })

  return boundaries.map(date => (
    <ReferenceLine
      key={date}
      x={date}
      stroke={color}
      strokeOpacity={0.3}
      strokeDasharray="4 4"
      label={{ position: 'insideTopLeft', value: formatMonth(date), fill: color, fontSize: 10, fontWeight: 'bold', offset: 10 }}
    />
  ))
}
