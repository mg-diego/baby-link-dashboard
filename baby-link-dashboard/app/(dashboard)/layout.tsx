import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Sidebar from '@/components/sidebar'

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
    <div className="flex h-screen bg-gray-50">
      <Sidebar userEmail={user.email} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Superior (Opcional, para títulos de página) */}
        <header className="h-16 border-b border-gray-200 bg-white flex items-center px-8 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Panel de Control</h2>
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