import { ReferenceLine } from "recharts"

export const renderMonthDividers = (data: any[], primary: any) => {
  const boundaries: { date: string, label: string }[] = []
  let lastMonth = ''

  data.forEach((d) => {
    if (!d?.date) return
    
    let dObj = new Date(typeof d.date === 'string' && d.date.includes(' ') ? d.date.replace(' ', 'T') : d.date)

    if (isNaN(dObj.getTime()) && typeof d.date === 'string') {
      const parts = d.date.split(/[-/]/)
      if (parts.length === 3) {
        const year = parts[2].length === 4 ? parts[2] : parts[0]
        const day = parts[2].length === 4 ? parts[0] : parts[2]
        dObj = new Date(`${year}-${parts[1]}-${day}T00:00:00`)
      }
    }

    if (isNaN(dObj.getTime())) return
    
    const currentMonth = `${dObj.getFullYear()}-${(dObj.getMonth() + 1).toString().padStart(2, '0')}`
        
    if (currentMonth !== lastMonth) {
      boundaries.push({
        date: d.date,
        label: dObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase()
      })
    }
    lastMonth = currentMonth
  })

  return boundaries.map(b => (
    <ReferenceLine 
      key={b.date} 
      x={b.date} 
      stroke={primary} 
      strokeOpacity={0.3}
      strokeDasharray="4 4"
      label={{ 
        position: 'insideTopLeft', 
        value: b.label, 
        fill: primary, 
        fontSize: 10, 
        fontWeight: 'bold',
        offset: 10
      }} 
    />
  ))
}