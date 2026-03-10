import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Home, Users, Trophy, LogOut, Gamepad2, Plus } from 'lucide-react'
import Logo from '../assets/logo.svg'

const navItems = [
  { to: '/',        icon: Home,    label: 'Início'  },
  { to: '/groups',  icon: Users,   label: 'Grupos'  },
  { to: '/ranking', icon: Trophy,  label: 'Ranking' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex">

      {/* ── SIDEBAR (desktop md+) ── */}
      <aside className="hidden md:flex md:flex-col md:w-56 lg:w-64 bg-gray-900 border-r border-gray-800 fixed inset-y-0 left-0 z-40">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-800">
          {/* <Gamepad2 className="text-emerald-400 w-6 h-6 shrink-0" /> */}
          <img src={Logo} alt="Logo" className="w-10 h-10" />
          <span className="font-bold text-white text-lg tracking-tight">Placar</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="pt-3">
            <NavLink
              to="/sessions/new"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-gray-950 transition-all"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Nova Jogatina
            </NavLink>
          </div>
        </nav>

        {/* User + logout */}
        <div className="border-t border-gray-800 px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-emerald-400 text-xs font-bold">
              {user?.display_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.display_name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-56 lg:ml-64">

        {/* Mobile header */}
        <header className="md:hidden bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <Gamepad2 className="text-emerald-400 w-5 h-5" />
            <span className="font-bold text-white tracking-tight">Placar</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{user?.display_name}</span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile only) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-gray-900 border-t border-gray-800 z-40">
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
          <NavLink
            to="/sessions/new"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 px-4 text-xs font-medium transition-colors ${
                isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <Plus className="w-5 h-5" />
            Nova
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
