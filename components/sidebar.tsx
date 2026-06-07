'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  LineChart, 
  Moon, 
  Utensils, 
  Baby,
  LogOut,
  UserCircle
} from 'lucide-react'
import { logout } from '@/app/login/actions'

const menuItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Crecimiento', href: '/growth', icon: LineChart },
  { name: 'Sueño', href: '/sleep', icon: Moon },
  { name: 'Alimentación', href: '/feeding', icon: Utensils },
  { name: 'Pañales', href: '/diapers', icon: Baby },
]

export default function Sidebar({ userEmail }: { userEmail: string | undefined }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const buildHref = (href: string) => {
    const params = searchParams.toString()
    return params ? `${href}?${params}` : href
  }

  return (
    <aside 
      className={`relative bg-surface border-r border-outline transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Botón colapsar */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-surface border border-outline rounded-full p-1 hover:bg-surface-container z-50"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Header Usuario */}
      <div className="p-4 border-b border-outline flex items-center gap-3 overflow-hidden">
        <div className="bg-primary-container text-primary p-2 rounded-lg shrink-0">
          <UserCircle size={24} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-on-surface truncate">Mi Bebé</span>
            <span className="text-xs text-on-surface/60 truncate">{userEmail}</span>
          </div>
        )}
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={buildHref(item.href)}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-primary-container text-primary' 
                  : 'text-on-surface/60 hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <item.icon size={22} className="shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-outline">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 p-3 w-full text-error hover:bg-error/10 rounded-xl transition-colors"
        >
          <LogOut size={22} className="shrink-0" />
          {!isCollapsed && <span className="font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}