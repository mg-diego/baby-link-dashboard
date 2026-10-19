// Todas las fechas se muestran en hora de Madrid, independientemente de la
// zona horaria del servidor (Vercel corre en UTC).
//
// Convención: los `Date` "de pared" (wall-clock) que devuelve `toMadrid` tienen
// sus getters locales (getHours, getDate…) alineados con la hora de Madrid.
// Úsalos para agrupar por día y posicionar en gráficas; para duraciones usa
// siempre los instantes reales (ms epoch) para no fallar en cambios de hora.

export const TIMEZONE = 'Europe/Madrid'

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const madridFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23',
})

const pad = (n: number) => n.toString().padStart(2, '0')

function madridParts(instant: Date) {
  const p: Record<string, number> = {}
  for (const { type, value } of madridFormatter.formatToParts(instant)) p[type] = Number(value)
  return p as Record<'year' | 'month' | 'day' | 'hour' | 'minute' | 'second', number>
}

/** Parsea un timestamp de Postgres ("2026-09-13 14:20:00+00" o ISO) a epoch ms. */
export function parseTimestamp(value: string): number {
  const iso = value.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00')
  return new Date(iso).getTime()
}

/** Instante real → Date de pared en hora de Madrid. */
export function toMadrid(value: string | number | Date): Date {
  const instant = new Date(typeof value === 'string' ? parseTimestamp(value) : value)
  const p = madridParts(instant)
  return new Date(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
}

export const madridNow = () => toMadrid(Date.now())

/** "yyyy-MM-dd" de un Date de pared. */
export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const todayKey = () => dateKey(madridNow())

export const hourDecimal = (d: Date) => d.getHours() + d.getMinutes() / 60

/** "HH:mm" de un Date de pared. */
export const timeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`

/** Suma días a una clave "yyyy-MM-dd". */
export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** Instante UTC (ISO) de las 00:00 en Madrid del día dado. Para filtrar en BD. */
export function madridDayStartUtc(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  const wallAsUtc = Date.UTC(y, m - 1, d)
  const offsetAt = (ts: number) => {
    const p = madridParts(new Date(ts))
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - ts
  }
  const firstGuess = wallAsUtc - offsetAt(wallAsUtc)
  return new Date(wallAsUtc - offsetAt(firstGuess)).toISOString()
}

// ── Formateo (puro, válido en servidor y cliente) ────────────────────────────

const KEY_RE = /^(\d{4})-(\d{2})-(\d{2})/

/** Descompone "yyyy-MM-dd"; null si no es una clave de fecha. */
function parseKey(key: string) {
  const match = KEY_RE.exec(key)
  if (!match) return null
  const [y, m, d] = match.slice(1).map(Number)
  return { y, m, d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay() }
}

/** "2026-10-05" → "lun 5" */
export function formatDayLabel(key: string): string {
  const k = parseKey(key)
  return k ? `${WEEKDAYS[k.weekday]} ${k.d}` : key
}

/** "2026-10-05" → "5 oct" */
export function formatAxisDate(key: string): string {
  const k = parseKey(key)
  return k ? `${k.d} ${MONTHS[k.m - 1]}` : key
}

/** "2026-10-05" → "lun 5 oct" */
export function formatLongDate(key: string): string {
  const k = parseKey(key)
  return k ? `${WEEKDAYS[k.weekday]} ${k.d} ${MONTHS[k.m - 1]}` : key
}

/** "2026-10-05" → "2026-10" (null si no es fecha) */
export const monthKey = (key: string) => (parseKey(key) ? key.slice(0, 7) : null)

/** "2026-10-05" → "OCT" */
export function formatMonth(key: string): string {
  const k = parseKey(key)
  return k ? MONTHS[k.m - 1].toUpperCase() : ''
}

export function isWeekend(key: string): boolean {
  const k = parseKey(key)
  return !!k && (k.weekday === 0 || k.weekday === 6)
}

/** Hora decimal → "HH:mm" (admite valores ≥ 24). */
export function formatHour(decimal: number): string {
  const totalMin = Math.round(decimal * 60)
  return `${pad(Math.floor(totalMin / 60) % 24)}:${pad(totalMin % 60)}`
}

/** Segundos → "1h 05m" / "45m" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`
}

export const formatMinutes = (minutes: number) => formatDuration(minutes * 60)
