import { useEffect, useState } from 'react'
import api from '../api'
import type { RankingEntry } from '../types'
import { Trophy, Medal } from 'lucide-react'

function medal(i: number) {
  if (i === 0) return <Medal className="w-4 h-4 text-yellow-400" />
  if (i === 1) return <Medal className="w-4 h-4 text-gray-400" />
  if (i === 2) return <Medal className="w-4 h-4 text-amber-600" />
  return <span className="text-gray-500 text-sm w-4 text-center">{i + 1}</span>
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/rankings.php').then(r => setRanking(r.data.ranking)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <Trophy className="w-5 h-5 text-yellow-400" /> Ranking Geral
      </h1>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="grid grid-cols-[auto_1fr_auto_auto] gap-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <span>#</span>
            <span>Jogador</span>
            <span className="text-right">Jogatinas</span>
            <span className="text-right">Rodadas</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : ranking.length === 0 ? (
          <p className="text-center text-gray-600 py-10 text-sm">Nenhuma jogatina encerrada ainda.</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {ranking.map((entry, i) => (
              <div key={entry.player_name}
                className={`grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-4 py-3 ${i === 0 ? 'bg-yellow-500/5' : ''}`}
              >
                <div className="w-6 flex items-center justify-center">{medal(i)}</div>
                <div>
                  <p className="font-semibold text-white text-sm">{entry.player_name}</p>
                  <p className="text-xs text-gray-600">{entry.sessions_played} jogadas</p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold">{entry.sessions_won}</span>
                  <p className="text-xs text-gray-600">jog.</p>
                </div>
                <div className="text-right">
                  <span className="text-gray-300 font-bold">{entry.rounds_won}</span>
                  <p className="text-xs text-gray-600">rod.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 text-center">Apenas jogatinas encerradas são contabilizadas.</p>
    </div>
  )
}
