import { createClient, fetchAllRows } from '@/utils/supabase/server'

const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || 'Europe/Madrid'

function toZonedTime(dateString: string): Date {
  const utcDate = new Date(dateString)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(utcDate)
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10)
  return new Date(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
}

function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function getFeedStats(babyId: string, startDate?: string, endDate?: string) {
  const supabase = await createClient()

  const getBaseQuery = () => {
    let query = supabase
      .from('baby_events')
      .select('id, category, start_time, end_time, metadata')
      .eq('baby_id', babyId)
      .eq('category', 'feed')
      .order('start_time', { ascending: true })

    if (startDate) query = query.gte('start_time', `${startDate}T00:00:00`)
    if (endDate)   query = query.lte('start_time', `${endDate}T23:59:59`)

    return query
  }

  const events = await fetchAllRows<any>(getBaseQuery)
  if (events.length === 0) return null

  const processed = events.map(ev => {
    const dateObj = toZonedTime(ev.start_time)
    let meta: any = {}
    try {
      meta = typeof ev.metadata === 'string' ? JSON.parse(ev.metadata) : (ev.metadata || {})
    } catch { meta = {} }

    const type = meta.type || 'unknown'
    const amountMl = meta.amount_ml ? Number(meta.amount_ml) : 0
    let durationMins = 0

    if (ev.end_time && type === 'nursing') {
      const endObj = toZonedTime(ev.end_time)
      durationMins = Math.round((endObj.getTime() - dateObj.getTime()) / 60000)
    }

    return {
      type,
      dateRaw: toDateKey(dateObj),
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
    if (!compositionMap.has(p.dateRaw))
      compositionMap.set(p.dateRaw, { date: p.dateRaw, bottle: 0, nursing: 0, solids: 0 })
    const dayComp = compositionMap.get(p.dateRaw)
    if (p.type === 'bottle')  dayComp.bottle  += 1
    if (p.type === 'nursing') dayComp.nursing += 1
    if (p.type === 'solids')  dayComp.solids  += 1

    if (p.type === 'bottle') {
      const mType = p.milkType || 'Unknown'
      milkTypesSet.add(mType)

      if (!bottleByTypeMap.has(p.dateRaw))
        bottleByTypeMap.set(p.dateRaw, { date: p.dateRaw })
      const bMap = bottleByTypeMap.get(p.dateRaw)
      bMap[mType] = (bMap[mType] || 0) + p.amountMl

      bottleScatter.push({
        date: p.dateRaw,
        hourDecimal: p.hourDecimal,
        amountMl: p.amountMl,
        milkType: mType
      })
    }

    if (p.type === 'nursing') {
      if (!nursingMap.has(p.dateRaw))
        nursingMap.set(p.dateRaw, { date: p.dateRaw, totalMins: 0, L: 0, R: 0, U: 0 })
      const nMap = nursingMap.get(p.dateRaw)
      nMap.totalMins += p.durationMins
      if      (p.condition === 'L') nMap.L += p.durationMins
      else if (p.condition === 'R') nMap.R += p.durationMins
      else                          nMap.U += p.durationMins

      if (!nursingGapsMap.has(p.dateRaw))
        nursingGapsMap.set(p.dateRaw, { sum: 0, count: 0 })
      if (lastNursingTime !== null) {
        const gapH = (p.timestamp - lastNursingTime) / 3600000
        if (gapH < 24) {
          nursingGapsMap.get(p.dateRaw).sum   += gapH
          nursingGapsMap.get(p.dateRaw).count += 1
        }
      }
      lastNursingTime = p.timestamp
    }
  })

  const dailyComposition = Array.from(compositionMap.values())
  const nursingTrends    = Array.from(nursingMap.values())
  const bottleByType     = Array.from(bottleByTypeMap.values())
  const milkTypes        = Array.from(milkTypesSet)

  const nursingGaps = Array.from(nursingGapsMap.entries())
    .map(([date, data]) => ({
      date,
      avgGapH: data.count > 0 ? data.sum / data.count : null
    }))
    .filter(d => d.avgGapH !== null)

  const totalFeeds       = processed.length
  const totalMl          = bottleScatter.reduce((acc, curr) => acc + curr.amountMl, 0)
  const totalNursingMins = nursingTrends.reduce((acc, curr) => acc + curr.totalMins, 0)

  return {
    kpis: {
      avgFeeds:       (totalFeeds / activeDays).toFixed(1),
      avgMl:          (totalMl / activeDays).toFixed(0),
      avgNursingMins: (totalNursingMins / activeDays).toFixed(0)
    },
    dailyComposition,
    nursingTrends,
    nursingGaps,
    bottleByType,
    bottleScatter,
    milkTypes
  }
}