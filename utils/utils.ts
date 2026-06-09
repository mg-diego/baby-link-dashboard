import { ReferenceLine } from 'recharts'

export const formatHour = (v: number) => {
  const h = Math.floor(v) % 24
  const m = Math.round((v % 1) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export const isWeekend = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.getDay() === 0 || d.getDay() === 6
}

export const withTrend = (data: any[], key: string) => {
  return data.map((item, idx) => {
    let sum = 0;
    let count = 0;
    for (let i = Math.max(0, idx - 2); i <= Math.min(data.length - 1, idx + 2); i++) {
      if (data[i][key] !== undefined && data[i][key] !== null) {
        sum += data[i][key];
        count++;
      }
    }
    return {
      ...item,
      [`${key}Trend`]: count > 0 ? sum / count : null
    };
  });
};

export const formatAxisDate = (v: string) => {
  if (!v) return ''
  const safeIso = v.includes(' ') ? v.replace(' ', 'T') : v
  const d = new Date(safeIso)
  
  if (isNaN(d.getTime())) {
    const parts = v.split(/[- T]/)
    if (parts.length >= 3) {
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      const day = parseInt(parts[2], 10)
      const monthIdx = parseInt(parts[1], 10) - 1
      if (!isNaN(day) && months[monthIdx]) return `${day} ${months[monthIdx]}`
    }
    return v
  }
  return `${d.getDate()} ${d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}`
}

