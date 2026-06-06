import { createClient } from '@/utils/supabase/server'

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`
  return `${m}m`
}

function toTimeStr(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

function toDateKey(date: Date): string {
  return date.toISOString().split('T')[0]
}

function toDateLabel(date: Date): string {
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export interface GanttEntry {
  dateKey: string
  dateLabel: string
  startHour: number
  duration: number
  status: 'night_solid' | 'night_interrupted' | 'night_waking' | 'nap'
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

function splitAtMidnight(
  start: Date, end: Date,
  status: GanttEntry['status'],
  durationStr: string
): GanttEntry[] {
  const entries: GanttEntry[] = []
  const startDay = toDateKey(start)
  const endDay = toDateKey(end)

  if (startDay === endDay) {
    entries.push({
      dateKey: startDay,
      dateLabel: toDateLabel(start),
      startHour: start.getHours() + start.getMinutes() / 60,
      duration: (end.getTime() - start.getTime()) / 3600000,
      status, startTimeStr: toTimeStr(start), endTimeStr: toTimeStr(end), durationStr
    })
  } else {
    const midnight = new Date(end)
    midnight.setHours(0, 0, 0, 0)
    const dur1 = (midnight.getTime() - start.getTime()) / 3600000
    entries.push({
      dateKey: startDay, dateLabel: toDateLabel(start),
      startHour: start.getHours() + start.getMinutes() / 60,
      duration: dur1, status,
      startTimeStr: toTimeStr(start), endTimeStr: '24:00', durationStr
    })
    const dur2 = (end.getTime() - midnight.getTime()) / 3600000
    if (dur2 > 0.01) {
      entries.push({
        dateKey: endDay, dateLabel: toDateLabel(end),
        startHour: 0, duration: dur2, status,
        startTimeStr: '00:00', endTimeStr: toTimeStr(end), durationStr
      })
    }
  }
  return entries
}

export async function getSleepStats(
  babyId: string,
  start?: string,
  end?: string
): Promise<SleepStats | null> {
  const supabase = await createClient()

  let query = supabase
    .from('baby_events')
    .select('*')
    .eq('baby_id', babyId)
    .in('category', ['nap', 'bed_time', 'woke_up', 'night_waking'])
    .order('start_time', { ascending: true })

  if (start) query = query.gte('start_time', `${start}T00:00:00`)
  if (end)   query = query.lte('start_time', `${end}T23:59:59`)

  const { data: events, error } = await query
  if (error) throw new Error(error.message)
  if (!events || events.length === 0) return null

  const parsed = events.map(e => {
    let meta: any = {}
    try { meta = typeof e.metadata === 'string' ? JSON.parse(e.metadata) : (e.metadata || {}) } catch {}
    return {
      ...e,
      metadata: meta,
      startDate: new Date(e.start_time),
      endDate:   e.end_time ? new Date(e.end_time) : null,
    }
  })

  const naps         = parsed.filter(e => e.category === 'nap')
  const wakeUps      = parsed.filter(e => e.category === 'woke_up')
  const bedTimeEvts  = parsed.filter(e => e.category === 'bed_time')
  const nightWakings = parsed.filter(e => e.category === 'night_waking')

  // ── PREDICCIONES (BEDTIME & NAPS) ──────────────────────────────────────
  const bedtimePredictions: SleepStats['predictions']['bedtime'] = []
  const napPredictions: SleepStats['predictions']['naps'] = []

  bedTimeEvts.forEach(bed => {
    if (bed.metadata?.predicted_start_time) {      
      const predStart = new Date(bed.metadata.predicted_start_time)
      const errorMinutes = Math.round((bed.startDate.getTime() - predStart.getTime()) / 60000)
      bedtimePredictions.push({
        date: toDateLabel(bed.startDate),
        errorMinutes
      })
    }
  })

  naps.forEach(nap => {
    if (nap.endDate && nap.metadata?.predicted_start_time && nap.metadata?.predicted_end_time) {
      const realDuration = Math.round((nap.endDate.getTime() - nap.startDate.getTime()) / 60000)
      
      const predStart = new Date(nap.metadata.predicted_start_time)
      const predEnd = new Date(nap.metadata.predicted_end_time)
      const predDuration = Math.round((predEnd.getTime() - predStart.getTime()) / 60000)
      
      // NUEVO: Calculamos el error de inicio de la siesta
      const errorStartMinutes = Math.round((nap.startDate.getTime() - predStart.getTime()) / 60000)

      napPredictions.push({
        id: nap.id, // Opcional, pero recomendado
        date: toDateLabel(nap.startDate),
        timeStr: toTimeStr(nap.startDate), // Lo usamos para etiquetar la gráfica
        realDuration,
        predDuration,
        errorStartMinutes // Enviamos el dato al cliente
      })
    }
  })

  // ── GANTT ──────────────────────────────────────────────────────────────
  const ganttEntries: GanttEntry[] = []

  // Naps
  naps.forEach(nap => {
    if (!nap.endDate) return
    const dur = (nap.endDate.getTime() - nap.startDate.getTime()) / 1000
    if (dur <= 0) return
    splitAtMidnight(nap.startDate, nap.endDate, 'nap', formatDuration(dur))
      .forEach(e => ganttEntries.push(e))
  })

  // Night sessions: pair each bed_time with the next woke_up
  const sortedBeds    = [...bedTimeEvts].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  const sortedWakeUps = [...wakeUps].sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

  const dailySleepMap = new Map<string, number>()

  sortedBeds.forEach(bed => {
    const wokeUp = sortedWakeUps.find(w => w.startDate > bed.startDate) ?? null
    const nightEnd = wokeUp?.startDate ?? null

    const sessionWakings = nightWakings
      .filter(nw =>
        nw.startDate > bed.startDate &&
        (!nightEnd || nw.startDate < nightEnd)
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())

    const hasWaking = sessionWakings.length > 0
    const sleepStatus: GanttEntry['status'] = hasWaking ? 'night_interrupted' : 'night_solid'

    // Track awake time to subtract from night sleep
    let wakingTotalSec = 0
    sessionWakings.forEach(nw => {
      if (nw.endDate) wakingTotalSec += (nw.endDate.getTime() - nw.startDate.getTime()) / 1000
    })

    // Total night sleep for KPI
    if (nightEnd) {
      const nightSleepSec = (nightEnd.getTime() - bed.startDate.getTime()) / 1000 - wakingTotalSec
      const dateKey = toDateKey(bed.startDate)
      dailySleepMap.set(dateKey, (dailySleepMap.get(dateKey) ?? 0) + nightSleepSec / 3600)
    }

    // Build Gantt segments
    let segStart = bed.startDate
    sessionWakings.forEach(nw => {
      if (nw.startDate > segStart) {
        const dur = (nw.startDate.getTime() - segStart.getTime()) / 1000
        if (dur > 60)
          splitAtMidnight(segStart, nw.startDate, sleepStatus, formatDuration(dur))
            .forEach(e => ganttEntries.push(e))
      }
      if (nw.endDate) {
        const wDur = (nw.endDate.getTime() - nw.startDate.getTime()) / 1000
        if (wDur > 0)
          splitAtMidnight(nw.startDate, nw.endDate, 'night_waking', formatDuration(wDur))
            .forEach(e => ganttEntries.push(e))
        segStart = nw.endDate
      }
    })

    if (nightEnd && nightEnd > segStart) {
      const dur = (nightEnd.getTime() - segStart.getTime()) / 1000
      if (dur > 60)
        splitAtMidnight(segStart, nightEnd, sleepStatus, formatDuration(dur))
          .forEach(e => ganttEntries.push(e))
    }
  })

  ganttEntries.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.startHour - b.startHour)

  const ganttMap = new Map<string, { date: string; label: string; events: GanttEntry[] }>()
  ganttEntries.forEach(e => {
    if (!ganttMap.has(e.dateKey))
      ganttMap.set(e.dateKey, { date: e.dateKey, label: e.dateLabel, events: [] })
    ganttMap.get(e.dateKey)!.events.push(e)
  })
  const ganttByDate = Array.from(ganttMap.values())

  // ── NAPS ───────────────────────────────────────────────────────────────
  const napsByDate = new Map<string, typeof naps>()
  naps.forEach(nap => {
    const dk = toDateKey(nap.startDate)
    if (!napsByDate.has(dk)) napsByDate.set(dk, [])
    napsByDate.get(dk)!.push(nap)
    // Add nap hours to daily sleep
    if (nap.endDate) {
      const h = (nap.endDate.getTime() - nap.startDate.getTime()) / 3600000
      dailySleepMap.set(dk, (dailySleepMap.get(dk) ?? 0) + h)
    }
  })

  const napRaw: SleepStats['napRaw'] = []
  napsByDate.forEach((dayNaps, date) => {
    dayNaps.sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    dayNaps.forEach((nap, i) => {
      if (!nap.endDate) return
      napRaw.push({
        date,
        napRank: `Nap ${i + 1}`,
        durationHours: (nap.endDate.getTime() - nap.startDate.getTime()) / 3600000,
        startTimeStr: toTimeStr(nap.startDate),
        endTimeStr:   toTimeStr(nap.endDate)
      })
    })
  })

  // ── DAILY SLEEP ────────────────────────────────────────────────────────
  const sleepValues = Array.from(dailySleepMap.values())
  const avgSleep = sleepValues.reduce((a, b) => a + b, 0) / Math.max(sleepValues.length, 1)

  const dailySleep = Array.from(dailySleepMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, totalHours]) => ({ date, totalHours, avg: avgSleep }))

  // ── WAKE UP & BED TIMES ────────────────────────────────────────────────
  const wakeUpTimes = wakeUps.map(w => ({
    date:        toDateKey(w.startDate),
    hourDecimal: w.startDate.getHours() + w.startDate.getMinutes() / 60,
    timeStr:     toTimeStr(w.startDate)
  })).sort((a, b) => a.date.localeCompare(b.date))

  const bedTimes = bedTimeEvts.map(b => ({
    date:        toDateKey(b.startDate),
    hourDecimal: b.startDate.getHours() + b.startDate.getMinutes() / 60,
    timeStr:     toTimeStr(b.startDate)
  })).sort((a, b) => a.date.localeCompare(b.date))

  // ── WAKE WINDOWS ───────────────────────────────────────────────────────
  const wakeWindows: SleepStats['wakeWindows'] = []
  const allByDay = new Map<string, Array<{ time: Date; type: string }>>()

  wakeUps.forEach(w =>     { const dk = toDateKey(w.startDate); (allByDay.get(dk) ?? allByDay.set(dk, []).get(dk))!.push({ time: w.startDate,  type: 'woke_up'   }) })
  naps.forEach(nap =>      { const dk = toDateKey(nap.startDate); (allByDay.get(dk) ?? allByDay.set(dk, []).get(dk))!.push({ time: nap.startDate, type: 'nap_start' }); if (nap.endDate) (allByDay.get(dk) ?? allByDay.set(dk, []).get(dk))!.push({ time: nap.endDate, type: 'nap_end' }) })
  bedTimeEvts.forEach(b => { const dk = toDateKey(b.startDate); (allByDay.get(dk) ?? allByDay.set(dk, []).get(dk))!.push({ time: b.startDate,  type: 'bed_time'  }) })

  allByDay.forEach((evts, date) => {
    const sorted = evts.sort((a, b) => a.time.getTime() - b.time.getTime())
    let lastAwake: Date | null = null
    let counter = 1
    sorted.forEach(evt => {
      if (evt.type === 'woke_up') { lastAwake = evt.time; counter = 1 }
      else if (evt.type === 'nap_start' && lastAwake) {
        const s = (evt.time.getTime() - lastAwake.getTime()) / 1000
        if (s > 0 && s < 43200) wakeWindows.push({ date, windowName: `Window ${counter++}`, durationHours: s / 3600, durationStr: formatDuration(s) })
        lastAwake = null
      } else if (evt.type === 'nap_end') {
        lastAwake = evt.time
      } else if (evt.type === 'bed_time' && lastAwake) {
        const s = (evt.time.getTime() - lastAwake.getTime()) / 1000
        if (s > 0 && s < 43200) wakeWindows.push({ date, windowName: 'Last Window', durationHours: s / 3600, durationStr: formatDuration(s) })
      }
    })
  })

  // ── NIGHT WAKINGS ──────────────────────────────────────────────────────
  const nightWakingScatter = nightWakings
    .filter(nw => nw.endDate)
    .map(nw => {
      const dur = (nw.endDate!.getTime() - nw.startDate.getTime()) / 1000
      const h = nw.startDate.getHours()
      const dk = h < 12
        ? toDateKey(new Date(nw.startDate.getTime() - 86400000))
        : toDateKey(nw.startDate)
      return { date: dk, hourDecimal: h + nw.startDate.getMinutes() / 60, durationMin: dur / 60, timeStr: toTimeStr(nw.startDate), durationStr: formatDuration(dur) }
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const nwDayMap = new Map<string, { totalMin: number; count: number }>()
  nightWakingScatter.forEach(nw => {
    if (!nwDayMap.has(nw.date)) nwDayMap.set(nw.date, { totalMin: 0, count: 0 })
    const c = nwDayMap.get(nw.date)!
    c.totalMin += nw.durationMin; c.count++
  })
  const nightWakingsByDay = Array.from(nwDayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))

  const hourMap = new Array(24).fill(0).map((_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, count: 0 }))
  nightWakings.forEach(nw => hourMap[nw.startDate.getHours()].count++)

  // ── KPIs ───────────────────────────────────────────────────────────────
  const avgWakeH = wakeUpTimes.length > 0
    ? wakeUpTimes.reduce((s, w) => s + w.hourDecimal, 0) / wakeUpTimes.length : 0
  const avgBedH = bedTimes.length > 0
    ? bedTimes.reduce((s, b) => s + b.hourDecimal, 0) / bedTimes.length : 0
  const pad = (n: number) => n.toString().padStart(2, '0')

  return {
    kpis: {
      avgTotalSleep:    `${avgSleep.toFixed(1)}h`,
      avgWakeTime:      `${pad(Math.floor(avgWakeH))}:${pad(Math.round((avgWakeH % 1) * 60))}`,
      avgBedTime:       `${pad(Math.floor(avgBedH))}:${pad(Math.round((avgBedH % 1) * 60))}`,
      avgNightWakings:  (nightWakings.length / Math.max(sortedBeds.length, 1)).toFixed(1)
    },
    ganttByDate, dailySleep, wakeUpTimes, bedTimes,
    napRaw, wakeWindows, nightWakingsByDay, nightWakingScatter,
    cursedHour: hourMap,
    predictions: {
      bedtime: bedtimePredictions,
      naps: napPredictions
    }
  }
}