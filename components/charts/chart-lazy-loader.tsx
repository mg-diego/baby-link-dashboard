'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/** Monta la gráfica solo cuando se acerca al viewport. */
export function ChartLazyLoader({ children, height = 300 }: { children: ReactNode; height?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ height }} className="w-full">
      {visible ? (
        <div className="h-full animate-in fade-in duration-500">{children}</div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center bg-surface-container/10 rounded-xl border border-outline/30 animate-pulse">
          <Loader2 className="w-6 h-6 text-primary animate-spin opacity-50 mb-2" />
          <span className="text-xs text-on-surface/40">Cargando gráfico...</span>
        </div>
      )}
    </div>
  )
}
