import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import type { Session, SessionPlayer, ScoreboardEntry } from '../types'
import { Trophy, RotateCcw, FlagOff, MoreVertical, X, Check, ChevronDown, ChevronUp } from 'lucide-react'

export default function SessionPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [session,    setSession]    = useState<Session | null>(null)
  const [scores,     setScores]     = useState<Record<number, number>>({}) // player_id -> current round pts
  const [loading,    setLoading]    = useState(true)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [showRounds, setShowRounds] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  // Modal de selecionar vencedor da rodada
  const [selectWinner, setSelectWinner] = useState(false)

  // Modal confirmação encerrar
  const [confirmEnd,   setConfirmEnd]   = useState(false)
  const [endWinnerId,  setEndWinnerId]  = useState<number | null>(null)

  const load = useCallback(() => {
    api.get(`/sessions.php?id=${id}`).then(r => {
      const s: Session = r.data
      setSession(s)
      // Reset current round scores to 0
      const initial: Record<number, number> = {}
      s.players?.forEach(p => { initial[p.id] = 0 })
      setScores(initial)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  const adjust = (playerId: number, delta: number) => {
    setScores(prev => ({ ...prev, [playerId]: (prev[playerId] ?? 0) + delta }))
  }

  const resetCurrentRound = () => {
    const reset: Record<number, number> = {}
    session?.players?.forEach(p => { reset[p.id] = 0 })
    setScores(reset)
    setMenuOpen(false)
  }

  const saveRound = async (winnerId: number) => {
    if (!session) return
    setSaving(true); setError('')
    try {
      const scorePayload = session.players?.map(p => ({ player_id: p.id, score: scores[p.id] ?? 0 })) ?? []
      await api.post('/rounds.php', {
        session_id:       session.id,
        winner_player_id: winnerId,
        scores:           scorePayload,
      })
      setSelectWinner(false)
      await load()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao salvar rodada')
    } finally { setSaving(false) }
  }

  const undoLastRound = async () => {
    if (!session) return
    setMenuOpen(false)
    await api.delete(`/rounds.php?session_id=${session.id}`)
    load()
  }

  const endSession = async () => {
    if (!session) return
    setSaving(true); setError('')
    try {
      const body: Record<string, unknown> = {}
      if (endWinnerId) body.winner_player_id = endWinnerId
      const res = await api.put(`/sessions.php?id=${session.id}&action=end`, body)
      navigate(`/sessions/${session.id}/summary`, { state: res.data })
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao encerrar')
      setSaving(false)
    }
  }

  if (loading || !session) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const players: SessionPlayer[] = session.players ?? []
  const sb: ScoreboardEntry[]    = session.scoreboard ?? []
  const totalRounds = session.rounds?.length ?? 0

  // Sort players by rounds_won desc for the scoreboard
  const sbMap = Object.fromEntries(sb.map(e => [e.id, e]))

  const finished = session.status === 'finished'

  return (
    <div className="max-w-lg mx-auto px-4 py-4 space-y-4 relative">
      {/* Session header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">{session.title}</h1>
          <p className="text-xs text-gray-500">
            {totalRounds} {totalRounds === 1 ? 'rodada' : 'rodadas'}
            {session.group_name && ` · ${session.group_name}`}
          </p>
        </div>

        {/* Menu button */}
        {!finished && (
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="relative w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2 text-sm">{error}</div>
      )}

      {/* ---- PLAYER CARDS ---- */}
      <div className="space-y-3">
        {players.map(player => {
          const entry     = sbMap[player.id]
          const roundsWon = entry?.rounds_won ?? 0
          const total     = entry?.total_score ?? 0
          const current   = scores[player.id] ?? 0

          return (
            <div key={player.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4"
            >
              {/* Name + stats */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-white text-base truncate">{player.name}</p>
                  {roundsWon > 0 && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
                      {roundsWon}🏆
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">Total acumulado: <span className="text-gray-300">{total}</span> pts</p>
              </div>

              {/* +/- controls */}
              {!finished && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onPointerDown={() => adjust(player.id, -1)}
                    className="w-12 h-12 rounded-xl bg-gray-800 hover:bg-red-500/20 active:bg-red-500/40 border border-gray-700 hover:border-red-500/40 text-gray-300 text-2xl font-bold flex items-center justify-center transition-all select-none touch-none"
                  >−</button>
                  <span className={`w-10 text-center text-xl font-black select-none ${current > 0 ? 'text-emerald-400' : current < 0 ? 'text-red-400' : 'text-white'}`}>
                    {current}
                  </span>
                  <button
                    onPointerDown={() => adjust(player.id, 1)}
                    className="w-12 h-12 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 active:bg-emerald-500/60 border border-emerald-500/30 text-emerald-400 text-2xl font-bold flex items-center justify-center transition-all select-none touch-none"
                  >+</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Register round button */}
      {!finished && (
        <button
          onClick={() => setSelectWinner(true)}
          className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-lg shadow-emerald-500/20"
        >
          <Check className="w-5 h-5" />
          Registrar Rodada
        </button>
      )}

      {/* Round history toggle */}
      {totalRounds > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowRounds(o => !o)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <span>Histórico de rodadas</span>
            {showRounds ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showRounds && (
            <div className="divide-y divide-gray-800 border-t border-gray-800">
              {[...(session.rounds ?? [])].reverse().map(r => (
                <div key={r.id} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Rodada {r.round_number}</span>
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-yellow-400" />
                    <span className="text-sm font-medium text-white">{r.winner_name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======= FLOATING MENU ======= */}
      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="fixed bottom-24 right-4 z-50 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-52 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-800">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</p>
            </div>
            <button onClick={resetCurrentRound}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4 text-blue-400" /> Zerar rodada atual
            </button>
            {totalRounds > 0 && (
              <button onClick={undoLastRound}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 text-orange-400" /> Desfazer última rodada
              </button>
            )}
            <div className="border-t border-gray-800">
              <button onClick={() => { setMenuOpen(false); setConfirmEnd(true) }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <FlagOff className="w-4 h-4" /> Encerrar jogatina
              </button>
            </div>
          </div>
        </>
      )}

      {/* ======= SELECT WINNER MODAL ======= */}
      {selectWinner && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Quem ganhou a rodada?</h2>
              <button onClick={() => setSelectWinner(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              {players.map(p => (
                <button key={p.id} disabled={saving} onClick={() => saveRound(p.id)}
                  className="w-full flex items-center gap-3 bg-gray-800 hover:bg-emerald-500/20 hover:border-emerald-500/50 border border-gray-700 rounded-xl p-3 text-left transition-all disabled:opacity-50"
                >
                  <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-emerald-400">{p.name[0].toUpperCase()}</span>
                  </div>
                  <span className="font-semibold text-white">{p.name}</span>
                  <span className="ml-auto text-sm text-gray-500">{scores[p.id] ?? 0} pts</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======= CONFIRM END MODAL ======= */}
      {confirmEnd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Encerrar jogatina?</h2>
              <button onClick={() => setConfirmEnd(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              O vencedor será o jogador com mais rodadas ganhas. Você pode selecionar manualmente em caso de empate.
            </p>

            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">Definir vencedor manualmente (opcional)</p>
              <div className="grid grid-cols-2 gap-2">
                {players.map(p => (
                  <button key={p.id} onClick={() => setEndWinnerId(endWinnerId === p.id ? null : p.id)}
                    className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                      endWinnerId === p.id
                        ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400'
                    }`}
                  >
                    {endWinnerId === p.id && '🏆 '}{p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmEnd(false)}
                className="flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-all"
              >Cancelar</button>
              <button onClick={endSession} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
              >
                {saving ? 'Encerrando…' : 'Encerrar!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
