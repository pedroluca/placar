import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import type { Session, Group } from '../types'
import { Plus, Trophy, Users, ChevronRight, Clock } from 'lucide-react'

function statusBadge(status: string) {
  return status === 'active'
    ? <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Ativa</span>
    : <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full font-medium">Encerrada</span>
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 60) return `${min}m atrás`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

export default function Dashboard() {
  const navigate  = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [groups,   setGroups]   = useState<Group[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/sessions.php'),
      api.get('/groups.php'),
    ]).then(([sRes, gRes]) => {
      setSessions(sRes.data)
      setGroups(gRes.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const active   = sessions.filter(s => s.status === 'active')
  const finished = sessions.filter(s => s.status === 'finished').slice(0, 5)

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-6">
      {/* CTA */}
      <button
        onClick={() => navigate('/sessions/new')}
        className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition-all text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-500/20"
      >
        <Plus className="w-5 h-5" />
        Nova Jogatina
      </button>

      {/* Jogatinas ativas */}
      {active.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Em andamento
          </h2>
          <div className="space-y-2">
            {active.map(s => (
              <Link key={s.id} to={`/sessions/${s.id}`}
                className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-emerald-500/20 rounded-2xl p-4 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.player_count} jogadores · {s.round_count} rodadas
                    {s.group_name && ` · ${s.group_name}`}
                  </p>
                </div>
                {statusBadge(s.status)}
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Grupos */}
      {groups.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Grupos
            </h2>
            <Link to="/groups" className="text-xs text-emerald-400 hover:text-emerald-300">Ver todos</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {groups.slice(0, 4).map(g => (
              <Link key={g.id} to={`/groups/${g.id}`}
                className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-3 transition-all"
              >
                <p className="font-semibold text-white text-sm truncate">{g.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{g.session_count} jogatinas</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Histórico */}
      {finished.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Histórico
          </h2>
          <div className="space-y-2">
            {finished.map(s => (
              <Link key={s.id} to={`/sessions/${s.id}/summary`}
                className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-4 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {s.winner_name
                      ? <><Trophy className="inline w-3 h-3 text-yellow-500 mr-1" />{s.winner_name}</>
                      : 'Sem vencedor'}
                    {' · '}{timeAgo(s.started_at)}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {sessions.length === 0 && groups.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Gamepad className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma jogatina ainda.</p>
          <p className="text-sm mt-1">Crie uma nova acima!</p>
        </div>
      )}
    </div>
  )
}

function Gamepad({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z" />
    </svg>
  )
}
