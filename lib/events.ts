import { createClient } from './supabase'
import { addDays, madridDayStartUtc, parseTimestamp, toMadrid } from './time'
import type { DateRange } from './range'

// Un único bebé por ahora.
export const BABY_ID = process.env.BABY_ID || '336351d0-40a3-4f4a-a04f-969a58212cb0'

export const SLEEP_CATEGORIES = ['nap', 'bed_time', 'woke_up', 'night_waking'] as const
export const ALL_CATEGORIES = [...SLEEP_CATEGORIES, 'feed', 'diaper'] as const
export type EventCategory = (typeof ALL_CATEGORIES)[number]

export interface EventMeta {
  type?: string
  amount_ml?: number | string
  amount?: number | string
  milk_type?: string
  condition?: string
  ui_condition?: string
  status?: string
  notes?: string
  predicted_start_time?: string
  predicted_end_time?: string
}

export interface BabyEvent {
  id: string
  category: EventCategory
  /** Hora de pared en Madrid: para agrupar por día y posicionar. */
  start: Date
  end: Date | null
  /** Instantes reales (epoch ms): para calcular duraciones. */
  startMs: number
  endMs: number | null
  meta: EventMeta
}

interface RawEvent {
  id: string
  category: EventCategory
  start_time: string
  end_time: string | null
  metadata: unknown
}

const COLUMNS = 'id, category, start_time, end_time, metadata'
// Debe ser ≤ al `max-rows` configurado en Supabase (1000 por defecto).
const PAGE_SIZE = 1000

function parseMeta(raw: unknown): EventMeta {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) ?? {} } catch { return {} }
  }
  return raw && typeof raw === 'object' ? (raw as EventMeta) : {}
}

function parseEvent(raw: RawEvent): BabyEvent {
  const startMs = parseTimestamp(raw.start_time)
  const endMs = raw.end_time ? parseTimestamp(raw.end_time) : null
  return {
    id: raw.id,
    category: raw.category,
    start: toMadrid(startMs),
    end: endMs !== null ? toMadrid(endMs) : null,
    startMs,
    endMs,
    meta: parseMeta(raw.metadata),
  }
}

/**
 * Eventos del bebé ordenados por inicio. El rango se interpreta en días de Madrid.
 * Pide primero el total (HEAD) y luego descarga todas las páginas en paralelo.
 */
export async function getEvents(
  categories: readonly EventCategory[],
  range?: DateRange
): Promise<BabyEvent[]> {
  const supabase = await createClient()

  const query = (columns: string, options?: { count: 'exact'; head: true }) => {
    let q = supabase
      .from('baby_events')
      .select(columns, options)
      .eq('baby_id', BABY_ID)
      .in('category', categories)
    if (range) {
      q = q
        .gte('start_time', madridDayStartUtc(range.start))
        .lt('start_time', madridDayStartUtc(addDays(range.end, 1)))
    }
    return q
  }

  const { count, error } = await query('id', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  if (!count) return []

  const pages = await Promise.all(
    Array.from({ length: Math.ceil(count / PAGE_SIZE) }, (_, i) =>
      query(COLUMNS)
        .order('start_time', { ascending: true })
        .order('id', { ascending: true }) // desempate estable entre páginas
        .range(i * PAGE_SIZE, (i + 1) * PAGE_SIZE - 1)
    )
  )

  return pages.flatMap(({ data, error }) => {
    if (error) throw new Error(error.message)
    return ((data ?? []) as unknown as RawEvent[]).map(parseEvent)
  })
}

export function groupByCategory(events: BabyEvent[]): Record<EventCategory, BabyEvent[]> {
  const groups = Object.fromEntries(ALL_CATEGORIES.map(c => [c, [] as BabyEvent[]])) as Record<EventCategory, BabyEvent[]>
  events.forEach(e => groups[e.category]?.push(e))
  return groups
}

/** Segundos entre dos instantes reales. */
export const secondsBetween = (fromMs: number, toMs: number) => (toMs - fromMs) / 1000

/** Duración del evento en segundos, o null si sigue en curso. */
export const durationSec = (e: BabyEvent) => (e.endMs !== null ? secondsBetween(e.startMs, e.endMs) : null)
