import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Sidebar from '@/components/sidebar'
import DateRangePicker from '@/components/date-range-picker'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar userEmail={user.email} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabecera Superior: Aquí va el filtro */}
        <header className="h-16 border-b border-outline bg-surface flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold text-on-surface">Panel de Control</h2>
          <DateRangePicker />
        </header>

        {/* Contenido Central con Scroll */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}