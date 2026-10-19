import { RangeSection } from '@/components/range-section'
import type { RangeSearchParams } from '@/lib/range'
import DiapersClient from './client'
import { getDiaperStats } from './data'

export default function DiapersPage({ searchParams }: { searchParams: RangeSearchParams }) {
  return (
    <RangeSection
      searchParams={searchParams}
      load={getDiaperStats}
      render={stats => <DiapersClient stats={stats} />}
      loadingText="Cargando pañales..."
      emptyText="No hay datos de pañales en este rango."
    />
  )
}
