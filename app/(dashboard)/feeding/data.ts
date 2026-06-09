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
      durationMins = Math.round((endObj.getTime() - dateObj.getTime()) / 60000)
    }

    return {
      type,
      dateRaw: dateObj.toISOString().split('T')[0],
      timestamp: dateObj.getTime(),
      hourDecimal: dateObj.getHours() + (dateObj.getMinutes() / 60),
      amountMl,
      durationMins,
      condition: meta.condition || 'U',
      milkType: meta.milk_type || 'Unknown'
    }
  })

  const uniqueDays = new Set(processed.map(p => p.dateRaw)).size
  const activeDays = Math.max(uniqueDays, 1)

  const compositionMap = new Map()
  const nursingMap = new Map()
  const bottleByTypeMap = new Map()
  const milkTypesSet = new Set<string>()
  const nursingGapsMap = new Map()

  let lastNursingTime: number | null = null
  const bottleScatter: any[] = []

  processed.forEach(p => {
    // 1. Composición general
    if (!compositionMap.has(p.dateRaw)) {
      compositionMap.set(p.dateRaw, { date: p.dateRaw, bottle: 0, nursing: 0, solids: 0 })
    }
    const dayComp = compositionMap.get(p.dateRaw)
    if (p.type === 'bottle') dayComp.bottle += 1
    if (p.type === 'nursing') dayComp.nursing += 1
    if (p.type === 'solids') dayComp.solids += 1

    // 2. Lógica para biberones
    if (p.type === 'bottle') {
      const mType = p.milkType || 'Unknown'
      milkTypesSet.add(mType)

      // Cantidad por tipo y día
      if (!bottleByTypeMap.has(p.dateRaw)) {
        bottleByTypeMap.set(p.dateRaw, { date: p.dateRaw })
      }
      const bMap = bottleByTypeMap.get(p.dateRaw)
      bMap[mType] = (bMap[mType] || 0) + p.amountMl

      // Puntos para el ScatterChart
      bottleScatter.push({
        date: p.dateRaw,
        hourDecimal: p.hourDecimal,
        amountMl: p.amountMl,
        milkType: mType
      })
    }

    // 3. Lógica para pecho (nursing)
    if (p.type === 'nursing') {
      // Tendencias y lados
      if (!nursingMap.has(p.dateRaw)) {
        nursingMap.set(p.dateRaw, { date: p.dateRaw, totalMins: 0, L: 0, R: 0, U: 0 })
      }
      const nMap = nursingMap.get(p.dateRaw)
      nMap.totalMins += p.durationMins
      if (p.condition === 'L') nMap.L += p.durationMins
      else if (p.condition === 'R') nMap.R += p.durationMins
      else nMap.U += p.durationMins

      // Distancia entre tomas
      if (!nursingGapsMap.has(p.dateRaw)) {
        nursingGapsMap.set(p.dateRaw, { sum: 0, count: 0 })
      }
      if (lastNursingTime !== null) {
        const gapH = (p.timestamp - lastNursingTime) / 3600000
        // Filtramos gaps mayores a 24h para no distorsionar la media diaria
        if (gapH < 24) {
          nursingGapsMap.get(p.dateRaw).sum += gapH
          nursingGapsMap.get(p.dateRaw).count += 1
        }
      }
      lastNursingTime = p.timestamp
    }
  })

  // Parsear mapas a arrays para los gráficos
  const dailyComposition = Array.from(compositionMap.values())
  const nursingTrends = Array.from(nursingMap.values())
  const bottleByType = Array.from(bottleByTypeMap.values())
  const milkTypes = Array.from(milkTypesSet)
  
  const nursingGaps = Array.from(nursingGapsMap.entries()).map(([date, data]) => ({
    date,
    avgGapH: data.count > 0 ? data.sum / data.count : null
  })).filter(d => d.avgGapH !== null)

  // Recalcular los totales para los KPIs
  const totalFeeds = processed.length
  const totalMl = bottleScatter.reduce((acc, curr) => acc + curr.amountMl, 0)
  const totalNursingMins = nursingTrends.reduce((acc, curr) => acc + curr.totalMins, 0)

  const kpis = {
    avgFeeds: (totalFeeds / activeDays).toFixed(1),
    avgMl: (totalMl / activeDays).toFixed(0),
    avgNursingMins: (totalNursingMins / activeDays).toFixed(0)
  }

  return { 
    kpis, 
    dailyComposition, 
    nursingTrends, 
    nursingGaps, 
    bottleByType, 
    bottleScatter, 
    milkTypes 
  }
}