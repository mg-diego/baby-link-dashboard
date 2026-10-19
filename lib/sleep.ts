import { type BabyEvent, durationSec, secondsBetween } from './events'
import { sum } from './stats'

export interface Night {
  bed: BabyEvent
  /** Evento woke_up que cierra la noche, o null si falta / sigue en curso. */
  wake: BabyEvent | null
  wakings: BabyEvent[]
  /** Sueño neto (sin despertares) en segundos; null si la noche no está cerrada. */
  sleepSec: number | null
}

/**
 * Empareja cada bed_time con su woke_up. El woke_up tiene que caer antes del
 * siguiente bed_time: si falta uno, la noche queda abierta en vez de
 * "comerse" la mañana siguiente. Entradas ordenadas por inicio.
 */
export function pairNights(beds: BabyEvent[], wakeUps: BabyEvent[], nightWakings: BabyEvent[]): Night[] {
  return beds.map((bed, i) => {
    const nextBedMs = beds[i + 1]?.startMs ?? Infinity
    const wake = wakeUps.find(w => w.startMs > bed.startMs && w.startMs < nextBedMs) ?? null
    const limitMs = wake?.startMs ?? nextBedMs
    const wakings = nightWakings.filter(w => w.startMs > bed.startMs && w.startMs < limitMs)
    const wakingSec = sum(wakings.map(w => durationSec(w) ?? 0))
    const sleepSec = wake ? Math.max(0, secondsBetween(bed.startMs, wake.startMs) - wakingSec) : null
    return { bed, wake, wakings, sleepSec }
  })
}
