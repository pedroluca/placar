import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Lock, User } from 'lucide-react'
import Logo from '../assets/logo.svg'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex">

      {/* Painel decorativo — só no desktop */}
      <div className="hidden lg:flex lg:flex-1 bg-gray-900 border-r border-gray-800 flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* Círculos de fundo */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/5 rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-emerald-500/8 rounded-full" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="p-3 rounded-3xl inline-flex mb-6">
            {/* <Gamepad2 className="w-16 h-16 text-emerald-400" /> */}
            <img src={Logo} alt="Logo" className="w-40 h-40" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3">Placar</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Registre rodadas, acompanhe vitórias e descubra quem domina a jogatina.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[['🎯','Rodadas'],['🏆','Vitórias'],['👥','Grupos']].map(([icon, label]) => (
              <div key={label} className="bg-gray-800/60 border border-gray-700 rounded-2xl p-3">
                <div className="text-2xl">{icon}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Painel de login */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">

          {/* Logo — só no mobile */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="p-4 rounded-2xl mb-4">
              {/* <Gamepad2 className="w-10 h-10 text-emerald-400" /> */}
              <img src={Logo} alt="Logo" className="w-30 h-30" />
            </div>
            <h1 className="text-2xl font-bold text-white">Placar</h1>
            <p className="text-sm text-gray-500 mt-1">Sistema de placar de jogatinas</p>
          </div>

          {/* Título desktop */}
          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-white">Entrar</h2>
            <p className="text-gray-500 text-sm mt-1">Acesse sua conta para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Usuário</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="seu_usuario"
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 disabled:text-emerald-600 disabled:cursor-not-allowed text-gray-950 font-bold py-3 rounded-xl transition-all"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
