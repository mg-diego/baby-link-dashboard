import { createClient } from '@/utils/supabase/server'

export async function getFeedStats(babyId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('baby_events')
    .select('id, category, start_time, end_time, metadata')
    .eq('baby_id', babyId)
    .eq('category', 'feed')

  if (startDate) {
    query = query.gte('start_time', `${startDate}T00:00:00.000Z`)
  }
  
  if (endDate) {
    query = query.lte('start_time', `${endDate}T23:59:59.999Z`)
  }

  const { data: events, error } = await query.order('start_time', { ascending: true })

  if (error) throw new Error(error.message)
  if (!events || events.length === 0) return null

  const processed = events.map(ev => {
    const dateObj = new Date(ev.start_time)
    let meta: any = {}
    try {
      meta = typeof ev.metadata === 'string' ? JSON.parse(ev.metadata) : (ev.metadata || {})
    } catch {
      meta = {}
    }

    const type = meta.type || 'unknown'
    const amountMl = meta.amount_ml ? Number(meta.amount_ml) : 0
    let durationMins = 0

    if (ev.end_time && type === 'nursing') {
      const endObj = new Date(ev.end_time)
      durationMins = (endObj.getTime() - dateObj.getTime()) / 60000
    }

    return {
      type,
      dateStr: dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      dateRaw: dateObj.toISOString().split('T')[0],
      amountMl,
      durationMins,
      condition: meta.condition || 'U',
      milkType: meta.milk_type || 'Unknown'
    }
  })

  const uniqueDays = new Set(processed.map(p => p.dateRaw)).size
  const activeDays = Math.max(uniqueDays, 1)

  const compositionMap = new Map()
  const bottleMap = new Map()
  const nursingMap = new Map()

  processed.forEach(p => {
    if (!compositionMap.has(p.dateRaw)) {
      compositionMap.set(p.dateRaw, { date: p.dateStr, bottle: 0, nursing: 0, solids: 0 })
    }
    const dayComp = compositionMap.get(p.dateRaw)
    if (p.type === 'bottle') dayComp.bottle += 1
    if (p.type === 'nursing') dayComp.nursing += 1
    if (p.type === 'solids') dayComp.solids += 1

    if (p.type === 'bottle') {
      if (!bottleMap.has(p.dateRaw)) {
        bottleMap.set(p.dateRaw, { date: p.dateStr, totalMl: 0 })
      }
      bottleMap.get(p.dateRaw).totalMl += p.amountMl
    }

    if (p.type === 'nursing') {
      if (!nursingMap.has(p.dateRaw)) {
        nursingMap.set(p.dateRaw, { date: p.dateStr, totalMins: 0, L: 0, R: 0, U: 0 })
      }
      const nMap = nursingMap.get(p.dateRaw)
      nMap.totalMins += p.durationMins
      if (p.condition === 'L') nMap.L += p.durationMins
      else if (p.condition === 'R') nMap.R += p.durationMins
      else nMap.U += p.durationMins
    }
  })

  const dailyComposition = Array.from(compositionMap.values())
  const bottleTrends = Array.from(bottleMap.values())
  const nursingTrends = Array.from(nursingMap.values())

  const totalFeeds = processed.length
  const totalMl = bottleTrends.reduce((acc, curr) => acc + curr.totalMl, 0)
  const totalNursingMins = nursingTrends.reduce((acc, curr) => acc + curr.totalMins, 0)

  const kpis = {
    avgFeeds: (totalFeeds / activeDays).toFixed(1),
    avgMl: (totalMl / activeDays).toFixed(0),
    avgNursingMins: (totalNursingMins / activeDays).toFixed(0)
  }

  return { kpis, dailyComposition, bottleTrends, nursingTrends }
}