import { ALL_CATEGORIES, type BabyEvent, durationSec, getEvents, groupByCategory } from '@/lib/events'
import { classifyDiaper, DIAPER_LABELS, FEED_LABELS, feedAmountMl, feedType } from '@/lib/classify'
import { pairNights } from '@/lib/sleep'
import { dateKey, formatDuration, timeStr, todayKey } from '@/lib/time'

export interface LastEvent {
  time: string
  type: string
  detail: string
}

export type OverviewStats = Awaited<ReturnType<typeof getOverviewStats>>

/** Foto de hoy + totales históricos (siempre de toda la historia). */
export async function getOverviewStats() {
  const events = await getEvents(ALL_CATEGORIES)
  const { nap: naps, bed_time: beds, woke_up: wakeUps, night_waking: nightWakings, feed: feeds, diaper: diapers } =
    groupByCategory(events)

  const today = todayKey()
  const isToday = (d: Date) => dateKey(d) === today

  const global = {
    totalSleepMins: 0,
    totalFeeds: feeds.length,
    totalBottles: 0,
    totalMl: 0,
    totalNursing: 0,
    totalSolids: 0,
    totalDiapers: diapers.length,
    diapersWet: 0,
    diapersDirty: 0,
    diapersBoth: 0,
    diapersClean: 0,
  }
  let todaySleepMins = 0

  // ── Sueño ──
  naps.forEach(nap => {
    const sec = durationSec(nap)
    if (sec === null) return
    const mins = Math.round(sec / 60)
    global.totalSleepMins += mins
    if (isToday(nap.start)) todaySleepMins += mins
  })

  const nights = pairNights(beds, wakeUps, nightWakings)
  nights.forEach(night => {
    if (night.sleepSec === null || !night.wake) return
    const mins = Math.round(night.sleepSec / 60)
    global.totalSleepMins += mins
    // La noche cuenta para el día en que se despierta.
    if (isToday(night.wake.start)) todaySleepMins += mins
  })

  const lastNap = naps.at(-1)
  const lastNight = nights.at(-1)
  let lastSleep: LastEvent | null = null
  if (lastNight && (!lastNap || lastNight.bed.startMs > lastNap.startMs)) {
    lastSleep = {
      time: timeStr(lastNight.bed.start),
      type: 'Noche',
      detail: lastNight.sleepSec !== null ? formatDuration(lastNight.sleepSec) : 'En curso',
    }
  } else if (lastNap) {
    const sec = durationSec(lastNap)
    lastSleep = { time: timeStr(lastNap.start), type: 'Siesta', detail: sec !== null ? formatDuration(sec) : 'En curso' }
  }

  // ── Tomas ──
  feeds.forEach(feed => {
    const type = feedType(feed.meta)
    if (type === 'bottle') {
      global.totalBottles++
      global.totalMl += feedAmountMl(feed.meta)
    } else if (type === 'nursing') global.totalNursing++
    else if (type === 'solids') global.totalSolids++
  })

  const lastFeedEvent = feeds.at(-1)
  const lastFeed: LastEvent | null = lastFeedEvent
    ? (() => {
        const type = feedType(lastFeedEvent.meta)
        return {
          time: timeStr(lastFeedEvent.start),
          type: FEED_LABELS[type],
          detail: type === 'bottle' ? `${feedAmountMl(lastFeedEvent.meta)} ml` : '-',
        }
      })()
    : null

  // ── Pañales ──
  const counters = { pee: 'diapersWet', poo: 'diapersDirty', mixed: 'diapersBoth', clean: 'diapersClean' } as const
  diapers.forEach(d => { global[counters[classifyDiaper(d.meta)]]++ })

  const lastDiaperEvent = diapers.at(-1)
  const lastDiaper: LastEvent | null = lastDiaperEvent
    ? { time: timeStr(lastDiaperEvent.start), type: 'Pañal', detail: DIAPER_LABELS[classifyDiaper(lastDiaperEvent.meta)] }
    : null

  const countToday = (list: BabyEvent[]) => list.filter(e => isToday(e.start)).length

  return {
    today: {
      sleepMins: todaySleepMins,
      feeds: countToday(feeds),
      diapers: countToday(diapers),
      lastSleep,
      lastFeed,
      lastDiaper,
    },
    global,
  }
}
