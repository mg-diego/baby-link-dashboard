import { type BabyEvent, durationSec, getEvents, groupByCategory, SLEEP_CATEGORIES } from '@/lib/events'
import type { DateRange } from '@/lib/range'
import { pairNights } from '@/lib/sleep'
import { average, groupBy, hourlyHistogram } from '@/lib/stats'
import {
  addDays, dateKey, formatAxisDate, formatDuration, formatHour, hourDecimal, parseTimestamp, timeStr,
} from '@/lib/time'

export type GanttStatus = 'night_solid' | 'night_interrupted' | 'night_waking' | 'nap'

export interface GanttEntry {
  dateKey: string
  startHour: number
  duration: number
  status: GanttStatus
  startTimeStr: string
  endTimeStr: string
  durationStr: string
}

export interface SleepStats {
  kpis: {
    avgTotalSleep: string
    avgWakeTime: string
    avgBedTime: string
    avgNightWakings: string
  }
  ganttByDate: { date: string; label: string; events: GanttEntry[] }[]
  dailySleep: { date: string; totalHours: number; avg: number }[]
  wakeUpTimes: { date: string; hourDecimal: number; timeStr: string }[]
  bedTimes: { date: string; hourDecimal: number; timeStr: string }[]
  napRaw: { date: string; napRank: string; durationHours: number; startTimeStr: string; endTimeStr: string }[]
  wakeWindows: { date: string; windowName: string; durationHours: number; durationStr: string }[]
  nightWakingsByDay: { date: string; totalMin: number; count: number }[]
  nightWakingScatter: { date: string; hourDecimal: number; durationMin: number; timeStr: string; durationStr: string }[]
  cursedHour: { hour: string; count: number }[]
  predictions: {
    bedtime: { date: string; errorMinutes: number }[]
    naps: {
      id: string
      date: string
      timeStr: string
      realDuration: number
      predDuration: number
      errorStartMinutes: number
    }[]
  }
}

const MAX_WAKE_WINDOW_SEC = 12 * 3600

/** Parte un tramo (horas de pared) en dos si cruza la medianoche. */
function splitAtMidnight(start: Date, end: Date, status: GanttStatus, durationStr: string): GanttEntry[] {
  const base = { status, durationStr }
  const startKey = dateKey(start)
  const endKey = dateKey(end)
  const hours = (a: Date, b: Date) => (b.getTime() - a.getTime()) / 3600000

  if (startKey === endKey) {
    return [{
      ...base, dateKey: startKey, startHour: hourDecimal(start), duration: hours(start, end),
      startTimeStr: timeStr(start), endTimeStr: timeStr(end),
    }]
  }

  const midnight = new Date(end)
  midnight.setHours(0, 0, 0, 0)
  const entries: GanttEntry[] = [{
    ...base, dateKey: startKey, startHour: hourDecimal(start), duration: hours(start, midnight),
    startTimeStr: timeStr(start), endTimeStr: '24:00',
  }]
  if (hours(midnight, end) > 0.01) {
    entries.push({
      ...base, dateKey: endKey, startHour: 0, duration: hours(midnight, end),
      startTimeStr: '00:00', endTimeStr: timeStr(end),
    })
  }
  return entries
}

const minutesBetween = (fromMs: number, toMs: number) => Math.round((toMs - fromMs) / 60000)

export async function getSleepStats(range: DateRange): Promise<SleepStats | null> {
  const events = await getEvents(SLEEP_CATEGORIES, range)
  if (events.length === 0) return null

  const { nap: naps, bed_time: beds, woke_up: wakeUps, night_waking: nightWakings } = groupByCategory(events)
  const nights = pairNights(beds, wakeUps, nightWakings)

  // ── Predicciones ──
  const bedtimePredictions: SleepStats['predictions']['bedtime'] = beds
    .filter(bed => bed.meta.predicted_start_time)
    .map(bed => ({
      date: formatAxisDate(dateKey(bed.start)),
      errorMinutes: minutesBetween(parseTimestamp(bed.meta.predicted_start_time!), bed.startMs),
    }))

  const napPredictions: SleepStats['predictions']['naps'] = naps
    .filter(nap => nap.endMs !== null && nap.meta.predicted_start_time && nap.meta.predicted_end_time)
    .map(nap => {
      const predStartMs = parseTimestamp(nap.meta.predicted_start_time!)
      const predEndMs = parseTimestamp(nap.meta.predicted_end_time!)
      return {
        id: nap.id,
        date: formatAxisDate(dateKey(nap.start)),
        timeStr: timeStr(nap.start),
        realDuration: minutesBetween(nap.startMs, nap.endMs!),
        predDuration: minutesBetween(predStartMs, predEndMs),
        errorStartMinutes: minutesBetween(predStartMs, nap.startMs),
      }
    })

  // ── Timeline (gantt) ──
  const ganttEntries: GanttEntry[] = []
  const pushSegment = (from: Date, to: Date, status: GanttStatus, sec: number) =>
    ganttEntries.push(...splitAtMidnight(from, to, status, formatDuration(sec)))

  naps.forEach(nap => {
    const sec = durationSec(nap)
    if (nap.end && sec !== null && sec > 0) pushSegment(nap.start, nap.end, 'nap', sec)
  })

  nights.forEach(({ bed, wake, wakings }) => {
    const status: GanttStatus = wakings.length > 0 ? 'night_interrupted' : 'night_solid'
    // Tramos de sueño entre despertares
    let segDate = bed.start
    let segMs = bed.startMs
    const sleepUntil = (toDate: Date, toMs: number) => {
      const sec = (toMs - segMs) / 1000
      if (sec > 60) pushSegment(segDate, toDate, status, sec)
    }

    wakings.forEach(w => {
      sleepUntil(w.start, w.startMs)
      const sec = durationSec(w)
      if (w.end && sec !== null) {
        if (sec > 0) pushSegment(w.start, w.end, 'night_waking', sec)
        segDate = w.end
        segMs = w.endMs!
      }
    })

    if (wake) sleepUntil(wake.start, wake.startMs)
  })

  ganttEntries.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.startHour - b.startHour)
  const ganttByDate = [...groupBy(ganttEntries, e => e.dateKey)].map(([date, entries]) => ({
    date,
    label: formatAxisDate(date),
    events: entries,
  }))

  // ── Sueño diario (noche por fecha de acostarse + siestas) ──
  const dailySleepMap = new Map<string, number>()
  const addSleep = (key: string, hours: number) => dailySleepMap.set(key, (dailySleepMap.get(key) ?? 0) + hours)

  nights.forEach(n => { if (n.sleepSec !== null) addSleep(dateKey(n.bed.start), n.sleepSec / 3600) })

  const napsByDate = groupBy(naps, nap => dateKey(nap.start))
  const napRaw: SleepStats['napRaw'] = []
  napsByDate.forEach((dayNaps, date) => {
    dayNaps.forEach((nap, i) => {
      const sec = durationSec(nap)
      if (!nap.end || sec === null) return
      addSleep(date, sec / 3600)
      napRaw.push({
        date,
        napRank: `Siesta ${i + 1}`,
        durationHours: sec / 3600,
        startTimeStr: timeStr(nap.start),
        endTimeStr: timeStr(nap.end),
      })
    })
  })

  const avgSleep = average([...dailySleepMap.values()])
  const dailySleep = [...dailySleepMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalHours]) => ({ date, totalHours, avg: avgSleep }))

  const toTimePoint = (e: BabyEvent) => ({ date: dateKey(e.start), hourDecimal: hourDecimal(e.start), timeStr: timeStr(e.start) })
  const wakeUpTimes = wakeUps.map(toTimePoint)
  const bedTimes = beds.map(toTimePoint)

  // ── Ventanas de vigilia ──
  type Mark = { ms: number; type: 'woke_up' | 'nap_start' | 'nap_end' | 'bed_time' }
  const marks: (Mark & { date: string })[] = [
    ...wakeUps.map(w => ({ date: dateKey(w.start), ms: w.startMs, type: 'woke_up' as const })),
    ...naps.map(n => ({ date: dateKey(n.start), ms: n.startMs, type: 'nap_start' as const })),
    ...naps.filter(n => n.endMs !== null).map(n => ({ date: dateKey(n.start), ms: n.endMs!, type: 'nap_end' as const })),
    ...beds.map(b => ({ date: dateKey(b.start), ms: b.startMs, type: 'bed_time' as const })),
  ]

  const wakeWindows: SleepStats['wakeWindows'] = []
  groupBy(marks, m => m.date).forEach((dayMarks, date) => {
    dayMarks.sort((a, b) => a.ms - b.ms)
    let lastAwakeMs: number | null = null
    let counter = 1
    const pushWindow = (name: string, untilMs: number) => {
      const sec = (untilMs - lastAwakeMs!) / 1000
      if (sec > 0 && sec < MAX_WAKE_WINDOW_SEC)
        wakeWindows.push({ date, windowName: name, durationHours: sec / 3600, durationStr: formatDuration(sec) })
    }
    dayMarks.forEach(m => {
      if (m.type === 'woke_up') { lastAwakeMs = m.ms; counter = 1 }
      else if (m.type === 'nap_end') lastAwakeMs = m.ms
      else if (m.type === 'nap_start' && lastAwakeMs !== null) { pushWindow(`Ventana ${counter++}`, m.ms); lastAwakeMs = null }
      else if (m.type === 'bed_time' && lastAwakeMs !== null) pushWindow('Última ventana', m.ms)
    })
  })

  // ── Despertares nocturnos (de madrugada cuentan para la noche anterior) ──
  const nightWakingScatter = nightWakings
    .filter(nw => nw.endMs !== null)
    .map(nw => {
      const sec = durationSec(nw)!
      const key = dateKey(nw.start)
      return {
        date: nw.start.getHours() < 12 ? addDays(key, -1) : key,
        hourDecimal: hourDecimal(nw.start),
        durationMin: sec / 60,
        timeStr: timeStr(nw.start),
        durationStr: formatDuration(sec),
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const nightWakingsByDay = [...groupBy(nightWakingScatter, nw => nw.date)]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, list]) => ({ date, totalMin: list.reduce((s, nw) => s + nw.durationMin, 0), count: list.length }))

  return {
    kpis: {
      avgTotalSleep: `${avgSleep.toFixed(1)}h`,
      avgWakeTime: formatHour(average(wakeUpTimes.map(w => w.hourDecimal))),
      avgBedTime: formatHour(average(bedTimes.map(b => b.hourDecimal))),
      avgNightWakings: (nightWakings.length / Math.max(beds.length, 1)).toFixed(1),
    },
    ganttByDate,
    dailySleep,
    wakeUpTimes,
    bedTimes,
    napRaw,
    wakeWindows,
    nightWakingsByDay,
    nightWakingScatter,
    cursedHour: hourlyHistogram(nightWakings.map(nw => nw.start.getHours())),
    predictions: { bedtime: bedtimePredictions, naps: napPredictions },
  }
}
