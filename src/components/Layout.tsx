import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, Users, Trophy, LogOut, Gamepad2 } from 'lucide-react'

const navItems = [
  { to: '/',        icon: Home,      label: 'Início'   },
  { to: '/groups',  icon: Users,     label: 'Grupos'   },
  { to: '/ranking', icon: Trophy,    label: 'Ranking'  },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <Gamepad2 className="text-emerald-400 w-5 h-5" />
          <span className="font-bold text-white tracking-tight">Placar</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:block">{user?.display_name}</span>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation — mobile first */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 z-40">
        <div className="flex justify-around max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 px-4 text-xs font-medium transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
