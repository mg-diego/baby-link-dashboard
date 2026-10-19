import { addDays, todayKey } from './time'

export interface DateRange {
  start: string // yyyy-MM-dd (día de Madrid)
  end: string
}

export type RangeSearchParams = Promise<Record<string, string | string[] | undefined>>

export const DEFAULT_RANGE_DAYS = 30

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const asDate = (v: string | string[] | undefined) => (typeof v === 'string' && DATE_RE.test(v) ? v : undefined)

/** Lee `?start=&end=` de la URL; por defecto, los últimos 30 días. */
export async function resolveRange(searchParams: RangeSearchParams): Promise<DateRange> {
  const params = await searchParams
  const end = asDate(params.end) ?? todayKey()
  const start = asDate(params.start) ?? addDays(end, -(DEFAULT_RANGE_DAYS - 1))
  return { start, end }
}
