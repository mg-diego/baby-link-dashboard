import { durationSec, getEvents } from '@/lib/events'
import { feedAmountMl, feedType, nursingSide } from '@/lib/classify'
import type { DateRange } from '@/lib/range'
import { sum } from '@/lib/stats'
import { dateKey, hourDecimal } from '@/lib/time'

export type FeedStats = NonNullable<Awaited<ReturnType<typeof getFeedStats>>>

const MAX_NURSING_GAP_H = 24

export async function getFeedStats(range: DateRange) {
  const events = await getEvents(['feed'], range)
  if (events.length === 0) return null

  const feeds = events.map(ev => {
    const type = feedType(ev.meta)
    const sec = durationSec(ev)
    return {
      type,
      date: dateKey(ev.start),
      startMs: ev.startMs,
      hourDecimal: hourDecimal(ev.start),
      amountMl: feedAmountMl(ev.meta),
      durationMins: type === 'nursing' && sec !== null ? Math.round(sec / 60) : 0,
      side: nursingSide(ev.meta),
      milkType: ev.meta.milk_type || 'Desconocida',
    }
  })

  const compositionMap = new Map<string, { date: string; bottle: number; nursing: number; solids: number }>()
  const nursingMap = new Map<string, { date: string; totalMins: number; L: number; R: number; U: number }>()
  const bottleByTypeMap = new Map<string, { date: string } & Record<string, number | string>>()
  const nursingGapsMap = new Map<string, { sum: number; count: number }>()
  const milkTypes = new Set<string>()
  const bottleScatter: { date: string; hourDecimal: number; amountMl: number; milkType: string }[] = []
  let lastNursingMs: number | null = null

  feeds.forEach(f => {
    const comp = compositionMap.get(f.date) ?? { date: f.date, bottle: 0, nursing: 0, solids: 0 }
    compositionMap.set(f.date, comp)
    if (f.type !== 'unknown') comp[f.type]++

    if (f.type === 'bottle') {
      milkTypes.add(f.milkType)
      const day = bottleByTypeMap.get(f.date) ?? { date: f.date }
      bottleByTypeMap.set(f.date, day)
      day[f.milkType] = (Number(day[f.milkType]) || 0) + f.amountMl
      bottleScatter.push({ date: f.date, hourDecimal: f.hourDecimal, amountMl: f.amountMl, milkType: f.milkType })
    }

    if (f.type === 'nursing') {
      const day = nursingMap.get(f.date) ?? { date: f.date, totalMins: 0, L: 0, R: 0, U: 0 }
      nursingMap.set(f.date, day)
      day.totalMins += f.durationMins
      day[f.side] += f.durationMins

      if (lastNursingMs !== null) {
        const gapH = (f.startMs - lastNursingMs) / 3600000
        if (gapH < MAX_NURSING_GAP_H) {
          const gap = nursingGapsMap.get(f.date) ?? { sum: 0, count: 0 }
          nursingGapsMap.set(f.date, gap)
          gap.sum += gapH
          gap.count++
        }
      }
      lastNursingMs = f.startMs
    }
  })

  const dailyComposition = [...compositionMap.values()]
  const nursingTrends = [...nursingMap.values()]
  const nursingGaps = [...nursingGapsMap.entries()].map(([date, g]) => ({ date, avgGapH: g.sum / g.count }))

  const activeDays = Math.max(compositionMap.size, 1)
  const totalMl = sum(bottleScatter.map(b => b.amountMl))
  const totalNursingMins = sum(nursingTrends.map(n => n.totalMins))

  return {
    kpis: {
      avgFeeds: (feeds.length / activeDays).toFixed(1),
      avgMl: (totalMl / activeDays).toFixed(0),
      avgNursingMins: (totalNursingMins / activeDays).toFixed(0),
    },
    dailyComposition,
    nursingTrends,
    nursingGaps,
    bottleByType: [...bottleByTypeMap.values()],
    bottleScatter,
    milkTypes: [...milkTypes],
  }
}
