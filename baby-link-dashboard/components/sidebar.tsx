'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  return (
    <aside 
      className={`relative bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Botón colapsar */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50 z-50"
      >
        {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Header Usuario */}
      <div className="p-4 border-bottom border-gray-100 flex items-center gap-3 overflow-hidden">
        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
          <UserCircle size={24} />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-gray-800 truncate">Mi Bebé</span>
            <span className="text-xs text-gray-500 truncate">{userEmail}</span>
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
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon size={22} className="shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 p-3 w-full text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={22} className="shrink-0" />
          {!isCollapsed && <span className="font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}