import fs from 'fs/promises'
import path from 'path'

export const PERCENTILES = ['p3', 'p10', 'p25', 'p50', 'p75', 'p90', 'p97'] as const
export type Percentile = (typeof PERCENTILES)[number]
export type PercentileRow = { age: number } & Record<Percentile, number>

export interface Measurement {
  age: number // meses
  weight: number // kg
  height: number // cm
  head: number // cm
}

export type GrowthStats = Awaited<ReturnType<typeof getGrowthStats>>

// TODO: sustituir por las medidas reales cuando estén en la BD.
const MEASUREMENTS: Measurement[] = [
  { age: 0.2, weight: 3.2, height: 49, head: 34.8 },
  { age: 1, weight: 4.7, height: 54.5, head: 37.2 },
  { age: 3, weight: 6.1, height: 59.8, head: 39.8 },
  { age: 6, weight: 7.8, height: 67.1, head: 43.5 },
  { age: 12, weight: 9.4, height: 75.6, head: 46.2 },
]

/** Lee una tabla de percentiles OMS (cabecera: Months,P1,P3,…). */
async function readPercentiles(file: string): Promise<PercentileRow[]> {
  const content = await fs.readFile(path.join(process.cwd(), 'resources', file), 'utf-8')
  const [headerLine, ...lines] = content.replace(/^﻿/, '').trim().split(/\r?\n/)
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase())

  return lines.map(line => {
    const values = line.split(',').map(Number)
    const col = (name: string) => values[headers.indexOf(name)]
    const row = { age: col('months') } as PercentileRow
    PERCENTILES.forEach(p => { row[p] = col(p) })
    return row
  })
}

export async function getGrowthStats() {
  const [weight, height, head] = await Promise.all([
    readPercentiles('weight-girls-percentiles.csv'),
    readPercentiles('height-girls-percentiles.csv'),
    readPercentiles('head-girls-percentiles.csv'),
  ])
  return { percentiles: { weight, height, head }, measurements: MEASUREMENTS }
}
