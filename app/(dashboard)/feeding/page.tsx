import { RangeSection } from '@/components/range-section'
import type { RangeSearchParams } from '@/lib/range'
import FeedingClient from './client'
import { getFeedStats } from './data'

export default function FeedingPage({ searchParams }: { searchParams: RangeSearchParams }) {
  return (
    <RangeSection
      searchParams={searchParams}
      load={getFeedStats}
      render={stats => <FeedingClient stats={stats} />}
      loadingText="Cargando alimentación..."
      emptyText="No hay datos de alimentación en este rango."
    />
  )
}
