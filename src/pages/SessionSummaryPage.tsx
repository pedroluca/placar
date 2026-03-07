import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import api from '../api'
import type { Session, ScoreboardEntry } from '../types'
import { Trophy, Home, RotateCcw } from 'lucide-react'

function medal(i: number) {
  if (i === 0) return '🥇'
  if (i === 1) return '🥈'
  if (i === 2) return '🥉'
  return `${i + 1}.`
}

export default function SessionSummaryPage() {
  const { id }     = useParams<{ id: string }>()
  const location   = useLocation()
  const navigate   = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Data may come from navigation state (right after ending) or fetched
  const stateData = location.state as { scoreboard?: ScoreboardEntry[]; winner_player_id?: number } | null

  useEffect(() => {
    api.get(`/sessions.php?id=${id}`).then(r => setSession(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading || !session) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const scoreboard: ScoreboardEntry[] = session.scoreboard ?? stateData?.scoreboard ?? []
  const winner = scoreboard[0]

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Winner banner */}
      {winner && (
        <div className="bg-linear-to-br from-yellow-500/20 to-emerald-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-xs text-yellow-400 font-semibold uppercase tracking-widest mb-1">Vencedor da jogatina</p>
          <h2 className="text-3xl font-black text-white">{winner.name}</h2>
          <p className="text-sm text-gray-400 mt-1">
            {winner.rounds_won} {winner.rounds_won === 1 ? 'rodada ganha' : 'rodadas ganhas'}
          </p>
        </div>
      )}

      {/* Title / meta */}
      <div>
        <h1 className="text-xl font-bold text-white">{session.title}</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {session.rounds?.length ?? 0} rodadas · encerrada
        </p>
      </div>

      {/* Scoreboard */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="font-semibold text-white text-sm">Placar Final</span>
        </div>
        <div className="divide-y divide-gray-800">
          {scoreboard.map((entry, i) => (
            <div key={entry.id} className={`flex items-center gap-4 px-4 py-3 ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
              <span className="text-lg w-8 text-center shrink-0">{medal(i)}</span>
              <div className="flex-1">
                <p className="font-semibold text-white">{entry.name}</p>
                <p className="text-xs text-gray-500">{entry.total_score} pts acumulados</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-black ${i === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {entry.rounds_won}
                </span>
                <p className="text-xs text-gray-600">rodadas</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link to="/"
          className="cursor-pointer flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl py-4 text-sm font-semibold text-gray-300 transition-all"
        >
          <Home className="w-4 h-4" /> Início
        </Link>
        <button
          onClick={() => navigate('/sessions/new')}
          className="cursor-pointer flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 rounded-2xl py-4 text-sm font-bold text-gray-950 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> Nova jogatina
        </button>
      </div>
    </div>
  )
}
