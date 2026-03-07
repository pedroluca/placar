import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../api'
import type { Group, GroupRankingResponse } from '../types'
import { Trophy, ChevronLeft, Medal } from 'lucide-react'

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function medal(i: number) {
  if (i === 0) return <Medal className="w-4 h-4 text-yellow-400" />
  if (i === 1) return <Medal className="w-4 h-4 text-gray-400" />
  if (i === 2) return <Medal className="w-4 h-4 text-amber-600" />
  return <span className="text-gray-500 text-sm w-4 text-center">{i + 1}</span>
}

export default function GroupDetailPage() {
  const { id }  = useParams<{ id: string }>()
  const now     = new Date()
  const [group,   setGroup]   = useState<Group | null>(null)
  const [ranking, setRanking] = useState<GroupRankingResponse | null>(null)
  const [month,   setMonth]   = useState(now.getMonth() + 1)
  const [year,    setYear]    = useState(now.getFullYear())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/groups.php?id=${id}`).then(r => setGroup(r.data))
  }, [id])

  useEffect(() => {
    setLoading(true)
    api.get(`/rankings.php?group_id=${id}&month=${month}&year=${year}`)
      .then(r => setRanking(r.data))
      .finally(() => setLoading(false))
  }, [id, month, year])

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/groups" className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 transition-all">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{group?.name || '…'}</h1>
          {group?.description && <p className="text-xs text-gray-500">{group.description}</p>}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <select
          value={month}
          onChange={e => setMonth(Number(e.target.value))}
          className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="w-28 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500"
        >
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Ranking */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="font-semibold text-white text-sm">Ranking — {MONTHS[month-1]}/{year}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !ranking?.ranking.length ? (
          <p className="text-center text-gray-600 py-10 text-sm">Nenhuma jogatina encerrada neste período.</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {ranking.ranking.map((entry, i) => (
              <div key={entry.player_name} className="flex items-center gap-3 px-4 py-3">
                <div className="w-6 flex items-center justify-center shrink-0">{medal(i)}</div>
                <div className="flex-1 font-semibold text-white">{entry.player_name}</div>
                <div className="text-right text-sm">
                  <span className="text-emerald-400 font-bold">{entry.sessions_won}</span>
                  <span className="text-gray-600"> jog.</span>
                  <span className="ml-2 text-gray-400">{entry.rounds_won}</span>
                  <span className="text-gray-600"> rod.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Membros */}
      {group?.members && group.members.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Membros</p>
          <div className="flex flex-wrap gap-2">
            {group.members.map(m => (
              <span key={m.id} className="bg-gray-900 border border-gray-800 text-gray-300 text-sm px-3 py-1.5 rounded-full">
                {m.display_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
