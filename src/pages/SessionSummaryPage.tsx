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
  const { id }   = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const stateData = location.state as { scoreboard?: ScoreboardEntry[]; winner_player_id?: number } | null

  useEffect(() => {
    api.get(`/sessions.php?id=${id}`).then(r => setSession(r.data)).finally(() => setLoading(false))
  }, [id])

  if (loading || !session) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const raw: ScoreboardEntry[] = session.scoreboard ?? stateData?.scoreboard ?? []

  // Decidir métrica principal: pontos acumulados vs rodadas ganhas
  const totalPts    = raw.reduce((s, e) => s + Number(e.total_score),  0)
  const totalRounds = raw.reduce((s, e) => s + Number(e.rounds_won),   0)
  const usePoints   = totalPts > 0  // prioriza pontos quando houver

  // Ordenar pelo critério correto
  const scoreboard = [...raw].sort((a, b) => {
    if (usePoints) {
      const diff = Number(b.total_score) - Number(a.total_score)
      if (diff !== 0) return diff
      return Number(b.rounds_won) - Number(a.rounds_won) // desempate por rodadas
    }
    return Number(b.rounds_won) - Number(a.rounds_won)
  })

  const winner   = scoreboard[0]
  // Só exibir banner de vencedor se alguém realmente marcou algo
  const hasData  = usePoints ? totalPts > 0 : totalRounds > 0

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

      {/* Banner do vencedor */}
      {winner && hasData && (
        <div className="bg-linear-to-br from-yellow-500/20 to-emerald-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">🏆</div>
          <p className="text-xs text-yellow-400 font-semibold uppercase tracking-widest mb-1">Vencedor da jogatina</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-4xl">{winner.emoji}</span>
            <h2 className="text-3xl font-black text-white">{winner.name}</h2>
          </div>
          <p className="text-sm text-gray-400 mt-2">
            {usePoints
              ? `${winner.total_score} pts acumulados`
              : `${winner.rounds_won} ${Number(winner.rounds_won) === 1 ? 'rodada ganha' : 'rodadas ganhas'}`}
          </p>
        </div>
      )}

      {/* Sem dados — alguém encerrou sem jogar nada */}
      {!hasData && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">🏳️</div>
          <p className="text-white font-bold">Nenhuma partida registrada</p>
          <p className="text-xs text-gray-500 mt-1">A jogatina foi encerrada sem pontos ou rodadas.</p>
        </div>
      )}

      {/* Cabeçalho */}
      <div>
        <h1 className="text-xl font-bold text-white">{session.title}</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {session.rounds?.length ?? 0} {(session.rounds?.length ?? 0) === 1 ? 'rodada' : 'rodadas'} · encerrada
        </p>
      </div>

      {/* Placar Final */}
      {hasData && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span className="font-semibold text-white text-sm">Placar Final</span>
            <span className="ml-auto text-xs text-gray-500">
              {usePoints ? 'por pontos' : 'por rodadas'}
            </span>
          </div>
          <div className="divide-y divide-gray-800">
            {scoreboard.map((entry, i) => (
              <div key={entry.id} className={`flex items-center gap-4 px-4 py-3 ${i === 0 ? 'bg-yellow-500/5' : ''}`}>
                <span className="text-lg w-8 text-center shrink-0">{medal(i)}</span>
                <span className="text-xl shrink-0">{entry.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{entry.name}</p>
                  {/* Mostra ambos, destaca o critério principal */}
                  <p className="text-xs text-gray-500 mt-0.5">
                    {usePoints
                      ? <><span className="text-emerald-400 font-bold">{entry.total_score} pts</span>{Number(entry.rounds_won) > 0 && ` · ${entry.rounds_won} rodada${Number(entry.rounds_won) > 1 ? 's' : ''}`}</>
                      : <><span className="text-yellow-400 font-bold">{entry.rounds_won} {Number(entry.rounds_won) === 1 ? 'rodada' : 'rodadas'}</span>{Number(entry.total_score) > 0 && ` · ${entry.total_score} pts`}</>
                    }
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className={`text-lg font-black ${i === 0 ? (usePoints ? 'text-emerald-400' : 'text-yellow-400') : 'text-gray-400'}`}>
                    {usePoints ? entry.total_score : entry.rounds_won}
                  </span>
                  <p className="text-xs text-gray-600">{usePoints ? 'pts' : 'rodadas'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ações */}
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
