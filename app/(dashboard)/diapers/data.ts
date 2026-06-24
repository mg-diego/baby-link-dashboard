import { createClient, fetchAllRows } from '@/utils/supabase/server'

function classifyDiaper(metadata: any) {
  const text = [metadata?.condition, metadata?.notes, metadata?.status]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  const hasPee = text.includes('pee') || text.includes('wet')
  const hasPoo = text.includes('poo') || text.includes('dirty') || text.includes('bm')

  if (hasPee && hasPoo) return 'Mixed'
  if (hasPoo) return 'Poo'
  return 'Pee'
}

function calculateRollingAvg(data: any[], key: string, window = 7) {
  return data.map((row, index, arr) => {
    const start = Math.max(0, index - window + 1)
    const subset = arr.slice(start, index + 1)
    const sum = subset.reduce((acc, curr) => acc + curr[key], 0)
    return { ...row, rolling: sum / subset.length }
  })
}

export async function getDiaperStats(babyId: string, start?: string, end?: string) {
  const supabase = await createClient()

  const getBaseQuery = () => {
    let query = supabase
      .from('baby_events')
      .select('*')
      .eq('baby_id', babyId)
      .eq('category', 'diaper')
      .order('start_time', { ascending: true })

    if (start) query = query.gte('start_time', `${start}T00:00:00`)
    if (end) query = query.lte('start_time', `${end}T23:59:59`)

    return query
  }

  const events = await fetchAllRows<any>(getBaseQuery)
  if (!events || events.length === 0) return null

  const processed = events.map(ev => {
    const dateObj = new Date(ev.start_time)
    return {
      type: classifyDiaper(ev.metadata),
      dateStr: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      dateRaw: dateObj.toISOString().split('T')[0],
      hour: dateObj.getHours(),
      hourDecimal: dateObj.getHours() + (dateObj.getMinutes() / 60),
      timeStr: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    }
  })

  const uniqueDays = new Set(processed.map(p => p.dateRaw)).size
  const activeDays = Math.max(uniqueDays, 1)

  const totalPee = processed.filter(p => p.type === 'Pee' || p.type === 'Mixed').length
  const totalPoo = processed.filter(p => p.type === 'Poo' || p.type === 'Mixed').length

  const kpis = {
    avgChanges: (processed.length / activeDays).toFixed(1),
    avgWet: (totalPee / activeDays).toFixed(1),
    avgDirty: (totalPoo / activeDays).toFixed(1)
  }

  const compositionMap = new Map()
  processed.forEach(p => {
    if (!compositionMap.has(p.dateRaw)) {
      compositionMap.set(p.dateRaw, { date: p.dateStr, Pee: 0, Mixed: 0, Poo: 0 })
    }
    compositionMap.get(p.dateRaw)[p.type] += 1
  })
  const dailyComposition = Array.from(compositionMap.values())

  const wetMap = new Map()
  processed.forEach(p => {
    if (!wetMap.has(p.dateRaw)) wetMap.set(p.dateRaw, { date: p.dateStr, count: 0 })
    if (p.type === 'Pee' || p.type === 'Mixed') wetMap.get(p.dateRaw).count += 1
  })
  const wetTrends = calculateRollingAvg(Array.from(wetMap.values()), 'count')

  const dirtyEvents = processed.filter(p => p.type === 'Poo' || p.type === 'Mixed')

  const hourlyPoopMap = new Array(24).fill(0).map((_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, count: 0 }))
  dirtyEvents.forEach(p => { hourlyPoopMap[p.hour].count += 1 })

  const poopTimeline = dirtyEvents.map(p => ({
    date: p.dateStr,
    hourDecimal: p.hourDecimal,
    timeStr: p.timeStr
  }))

  return { kpis, dailyComposition, wetTrends, hourlyPoop: hourlyPoopMap, poopTimeline }
}