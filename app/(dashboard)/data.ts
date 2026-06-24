import { createClient, fetchAllRows } from '@/utils/supabase/server'

export async function getOverviewStats(babyId: string) {
  const supabase = await createClient()

  const getBaseQuery = () => {
    return supabase
      .from('baby_events')
      .select('id, category, start_time, end_time, metadata')
      .eq('baby_id', babyId)
      .order('start_time', { ascending: true })
  }

  const events = await fetchAllRows<any>(getBaseQuery)

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const today = {
    sleepMins: 0,
    feeds: 0,
    diapers: 0,
    lastSleep: null as any,
    lastFeed: null as any,
    lastDiaper: null as any,
  }

  const global = {
    totalSleepMins: 0,
    totalFeeds: 0,
    totalBottles: 0,
    totalMl: 0,
    totalNursing: 0,
    totalSolids: 0,
    totalDiapers: 0,
    diapersWet: 0,
    diapersDirty: 0,
    diapersBoth: 0,
    diapersClean: 0,
  }

  if (!events) return { today, global }

  let pendingBedTime: Date | null = null
  let pendingWakingsMins = 0

  events.forEach(ev => {
    const safeStart = ev.start_time.includes(' ') ? ev.start_time.replace(' ', 'T') : ev.start_time
    const start = new Date(safeStart)
    const eventDateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
    const isToday = eventDateStr === todayStr

    let meta: any = {}
    if (ev.metadata) {
      if (typeof ev.metadata === 'string') {
        try {
          meta = JSON.parse(ev.metadata)
        } catch {
          meta = {}
        }
      } else if (typeof ev.metadata === 'object') {
        meta = ev.metadata
      }
    }

    if (ev.category === 'nap') {
      let duration = 0
      if (ev.end_time) {
        const safeEnd = ev.end_time.includes(' ') ? ev.end_time.replace(' ', 'T') : ev.end_time
        duration = Math.round((new Date(safeEnd).getTime() - start.getTime()) / 60000)
        global.totalSleepMins += duration
        if (isToday) today.sleepMins += duration

        today.lastSleep = {
          time: start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
          type: 'Siesta'
        }
      } else {
        today.lastSleep = {
          time: start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          duration: 'En curso',
          type: 'Siesta'
        }
      }
    } else if (ev.category === 'bed_time') {
      pendingBedTime = start
      pendingWakingsMins = 0
      today.lastSleep = {
        time: start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        duration: 'En curso',
        type: 'Noche'
      }
    } else if (ev.category === 'night_waking') {
      if (ev.end_time) {
        const safeEnd = ev.end_time.includes(' ') ? ev.end_time.replace(' ', 'T') : ev.end_time
        pendingWakingsMins += Math.round((new Date(safeEnd).getTime() - start.getTime()) / 60000)
      }
    } else if (ev.category === 'woke_up') {
      if (pendingBedTime) {
        const totalSpan = Math.round((start.getTime() - pendingBedTime.getTime()) / 60000)
        let duration = totalSpan - pendingWakingsMins
        if (duration < 0) duration = 0

        global.totalSleepMins += duration
        if (isToday) today.sleepMins += duration

        today.lastSleep = {
          time: pendingBedTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          duration: `${Math.floor(duration / 60)}h ${duration % 60}m`,
          type: 'Noche'
        }

        pendingBedTime = null
        pendingWakingsMins = 0
      }
    }

    if (ev.category === 'feed') {
      global.totalFeeds += 1
      if (isToday) today.feeds += 1

      const type = meta.type || 'unknown'

      let amountMl = 0
      const rawAmount = meta.amount_ml ?? meta.amount
      if (rawAmount !== undefined && rawAmount !== null) {
        amountMl = parseInt(String(rawAmount).replace(/[^0-9]/g, ''), 10) || 0
      }

      if (type === 'bottle') {
        global.totalBottles += 1
        global.totalMl += amountMl
      } else if (type === 'nursing') {
        global.totalNursing += 1
      } else if (type === 'solids') {
        global.totalSolids += 1
      }

      today.lastFeed = {
        time: start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        amount: type === 'bottle' ? `${amountMl}ml` : '-',
        type: type === 'bottle' ? 'Biberón' : type === 'nursing' ? 'Pecho' : type === 'solids' ? 'Sólidos' : 'Toma'
      }
    }

    if (ev.category === 'diaper') {
      global.totalDiapers += 1
      if (isToday) today.diapers += 1

      const state = String(meta.condition || meta.state || meta.status || meta.type || meta.ui_condition || '').toLowerCase()

      if (state.includes('both') || state.includes('mixed') || state.includes('ambos') || state.includes('mixto')) {
        global.diapersBoth += 1
      } else if (state.includes('dirty') || state.includes('poop') || state.includes('sucio') || state.includes('caca')) {
        global.diapersDirty += 1
      } else if (state.includes('wet') || state.includes('mojado') || state.includes('pipi')) {
        global.diapersWet += 1
      } else {
        global.diapersClean += 1
      }

      today.lastDiaper = {
        time: start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        state: meta.ui_condition || (state.includes('wet') ? 'Mojado' : state.includes('dirty') ? 'Sucio' : state.includes('both') ? 'Mixto' : 'Limpio'),
        type: 'Pañal'
      }
    }
  })

  return { today, global }
}