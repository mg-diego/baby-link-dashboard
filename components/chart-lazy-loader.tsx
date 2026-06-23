import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react' // Asegúrate de tener lucide-react

export function ChartLazyLoader({ children, height = 300 }: { children: React.ReactNode, height?: number }) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!isReady) {
    return (
      <div 
        style={{ height }} 
        className="w-full flex flex-col items-center justify-center bg-surfaceAlt/10 rounded-xl border border-outline/30 animate-pulse"
      >
        <Loader2 className="w-6 h-6 text-primary animate-spin opacity-50 mb-2" />
        <span className="text-xs text-onSurface/40">Cargando gráfico...</span>
      </div>
    )
  }

  return (
    <div style={{ height }} className="w-full animate-in fade-in duration-500">
      {children}
    </div>
  )
}