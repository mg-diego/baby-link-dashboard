import { getEvents } from '@/lib/events'
import { classifyDiaper, hasPee, hasPoo } from '@/lib/classify'
import type { DateRange } from '@/lib/range'
import { hourlyHistogram, withTrend } from '@/lib/stats'
import { dateKey, hourDecimal, timeStr } from '@/lib/time'

export type DiaperStats = NonNullable<Awaited<ReturnType<typeof getDiaperStats>>>

export async function getDiaperStats(range: DateRange) {
  const events = await getEvents(['diaper'], range)
  if (events.length === 0) return null

  const diapers = events.map(ev => ({
    type: classifyDiaper(ev.meta),
    date: dateKey(ev.start),
    hour: ev.start.getHours(),
    hourDecimal: hourDecimal(ev.start),
    timeStr: timeStr(ev.start),
  }))

  const byDay = new Map<string, { date: string; pee: number; mixed: number; poo: number; wet: number }>()
  diapers.forEach(d => {
    const day = byDay.get(d.date) ?? { date: d.date, pee: 0, mixed: 0, poo: 0, wet: 0 }
    byDay.set(d.date, day)
    if (d.type !== 'clean') day[d.type]++
    if (hasPee(d.type)) day.wet++
  })

  const days = [...byDay.values()]
  const activeDays = Math.max(days.length, 1)
  const dirty = diapers.filter(d => hasPoo(d.type))

  return {
    kpis: {
      avgChanges: (diapers.length / activeDays).toFixed(1),
      avgWet: (diapers.filter(d => hasPee(d.type)).length / activeDays).toFixed(1),
      avgDirty: (dirty.length / activeDays).toFixed(1),
    },
    dailyComposition: days,
    // Media móvil centrada de 7 días
    wetTrends: withTrend(days, 'wet', 3),
    hourlyPoop: hourlyHistogram(dirty.map(d => d.hour)),
    poopTimeline: dirty.map(({ date, hourDecimal, timeStr }) => ({ date, hourDecimal, timeStr })),
  }
}
