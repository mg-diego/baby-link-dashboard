import { Suspense, type ReactNode } from 'react'
import Loader from '@/components/loader'
import { type DateRange, type RangeSearchParams, resolveRange } from '@/lib/range'

interface RangeSectionProps<T> {
  searchParams: RangeSearchParams
  load: (range: DateRange) => Promise<T | null>
  render: (data: T) => ReactNode
  loadingText: string
  emptyText: string
}

/** Página de sección filtrada por el rango de fechas de la URL. */
export function RangeSection<T>({ loadingText, ...props }: RangeSectionProps<T>) {
  return (
    <Suspense fallback={<Loader text={loadingText} />}>
      <RangeContent {...props} />
    </Suspense>
  )
}

async function RangeContent<T>({ searchParams, load, render, emptyText }: Omit<RangeSectionProps<T>, 'loadingText'>) {
  const data = await load(await resolveRange(searchParams))

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-surface border border-outline">
        <p className="text-on-surface/50">{emptyText}</p>
      </div>
    )
  }
  return render(data)
}
