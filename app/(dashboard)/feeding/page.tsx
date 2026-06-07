import { Suspense } from 'react'
import { format, subDays } from 'date-fns'
import Loader from '@/components/loader'
import FeedingClient from './client'
import { getFeedStats } from './data'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ start?: string; end?: string }>
}

async function FeedingContent({ searchParams }: PageProps) {
  const babyId = '336351d0-40a3-4f4a-a04f-969a58212cb0'
  const params = await searchParams

  const defaultStart = format(subDays(new Date(), 29), 'yyyy-MM-dd')
  const defaultEnd = format(new Date(), 'yyyy-MM-dd')

  const start = params.start || defaultStart
  const end = params.end || defaultEnd  

  const stats = await getFeedStats(babyId, start, end)

  if (!stats) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-surface border border-outline">
        <p className="text-on-surface/50">No hay datos de alimentación registrados aún.</p>
      </div>
    )
  }

  return <FeedingClient stats={stats} />
}

export default function FeedingPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<Loader text="Cargando alimentación..." />}>
      <FeedingContent searchParams={searchParams} />
    </Suspense>
  )
}