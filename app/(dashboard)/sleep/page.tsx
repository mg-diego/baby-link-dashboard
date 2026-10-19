import { RangeSection } from '@/components/range-section'
import type { RangeSearchParams } from '@/lib/range'
import SleepClient from './client'
import { getSleepStats } from './data'

export default function SleepPage({ searchParams }: { searchParams: RangeSearchParams }) {
  return (
    <RangeSection
      searchParams={searchParams}
      load={getSleepStats}
      render={stats => <SleepClient stats={stats} />}
      loadingText="Cargando sueño..."
      emptyText="No hay datos de sueño en este rango."
    />
  )
}
