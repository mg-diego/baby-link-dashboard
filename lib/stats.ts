export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

export const average = (values: number[]) => (values.length ? sum(values) / values.length : 0)

export type WithTrend<T, K extends string> = T & { [P in `${K}Trend`]: number | null }

/**
 * Añade `${key}Trend`: media móvil centrada de (2·radius + 1) puntos.
 * Ignora los valores null/undefined.
 */
export function withTrend<T extends object, K extends keyof T & string>(
  data: T[],
  key: K,
  radius = 2
): WithTrend<T, K>[] {
  return data.map((item, idx) => {
    const window: number[] = []
    for (let i = Math.max(0, idx - radius); i <= Math.min(data.length - 1, idx + radius); i++) {
      const v = data[i][key]
      if (typeof v === 'number') window.push(v)
    }
    return { ...item, [`${key}Trend`]: window.length ? average(window) : null } as WithTrend<T, K>
  })
}

/** Histograma de 24 franjas horarias a partir de horas (0-23). */
export function hourlyHistogram(hours: number[]) {
  const buckets = Array.from({ length: 24 }, (_, i) => ({ hour: `${i.toString().padStart(2, '0')}:00`, count: 0 }))
  hours.forEach(h => buckets[h].count++)
  return buckets
}

/** Agrupa en un Map conservando el orden de inserción. */
export function groupBy<T, K>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  items.forEach(item => {
    const k = keyFn(item)
    const list = map.get(k)
    if (list) list.push(item)
    else map.set(k, [item])
  })
  return map
}
