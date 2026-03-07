import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import type { Session, SessionPlayer, ScoreboardEntry } from '../types'
import { Trophy, RotateCcw, FlagOff, MoreVertical, X, ChevronDown, ChevronUp, Minus, Plus, Check } from 'lucide-react'

const COLOR_HEX: Record<string, string> = {
  emerald: '#10b981', blue: '#3b82f6', purple: '#a855f7',
  red:     '#ef4444', orange: '#f97316', yellow: '#eab308',
  pink:    '#ec4899', cyan: '#06b6d4',
}
function hexFor(color: string) { return COLOR_HEX[color] ?? '#10b981' }

// ── MatchCard tints more vivid ──────────────────────────────────────────────
function MatchCard({
  player, wins, onAdd, onSub, disabled,
}: {
  player: SessionPlayer
  wins: number
  onAdd: () => void
  onSub: () => void
  disabled: boolean
}) {
  const hex = hexFor(player.color)
  return (
    <div
      className="rounded-2xl border p-4 flex items-center gap-4 transition-all"
      style={{ backgroundColor: `${hex}22`, borderColor: `${hex}55` }}
    >
      <span className="text-3xl shrink-0">{player.emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-base truncate">{player.name}</p>
        <p className="text-sm font-black mt-0.5" style={{ color: hex }}>
          {wins} {wins === 1 ? 'partida' : 'partidas'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSub}
          disabled={disabled || wins === 0}
          className="cursor-pointer w-11 h-11 rounded-xl bg-gray-800 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/40 text-gray-300 flex items-center justify-center transition-all disabled:opacity-30"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-xl font-black text-white select-none">{wins}</span>
        <button
          onClick={onAdd}
          disabled={disabled}
          className="cursor-pointer w-12 h-12 rounded-xl font-black text-gray-950 text-xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50"
          style={{ backgroundColor: hex }}
        >
          +1
        </button>
      </div>
    </div>
  )
}

export default function SessionPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [session,      setSession]      = useState<Session | null>(null)
  const [scores,       setScores]       = useState<Record<number, number>>({})  // score mode: current round pts
  const [matchWins,    setMatchWins]    = useState<Record<number, number>>({})  // match mode: local win count
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [showRounds,   setShowRounds]   = useState(false)
  const [tieWinners,   setTieWinners]   = useState<Set<number>>(new Set())
  const [showTie,      setShowTie]      = useState(false)
  const [tiedPlayers,  setTiedPlayers]  = useState<SessionPlayer[]>([])
  const [confirmEnd,   setConfirmEnd]   = useState(false)
  const [endWinnerId,  setEndWinnerId]  = useState<number | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/sessions.php?id=${id}`).then(r => {
      const s: Session = r.data
      setSession(s)
      const initScores: Record<number, number> = {}
      const initWins:   Record<number, number> = {}
      s.players?.forEach(p => {
        initScores[p.id] = 0
        initWins[p.id]   = 0
      })
      setScores(initScores)
      setMatchWins(initWins)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const players: SessionPlayer[] = session.players ?? []
  const sb: ScoreboardEntry[]    = session.scoreboard ?? []
  const sbMap                    = Object.fromEntries(sb.map(e => [e.id, e]))
  const totalRounds              = session.rounds?.length ?? 0
  const finished                 = session.status === 'finished'
  const maxScore                 = session.max_score ?? 1
  const isMatchMode              = maxScore === 0  // max_score=0 → Por Partida

  // ── Score mode helpers ────────────────────────────────────────────────────
  const adjustScore = (playerId: number, delta: number) => {
    setScores(prev => ({ ...prev, [playerId]: Math.max(0, (prev[playerId] ?? 0) + delta) }))
  }

  const saveRound = async (winnerIds: number[]) => {
    setSaving(true)
    setError('')
    try {
      const scorePayload = players.map(p => ({ player_id: p.id, score: scores[p.id] ?? 0 }))
      for (const wid of winnerIds) {
        await api.post('/rounds.php', {
          session_id: session.id,
          winner_player_id: wid,
          scores: scorePayload,
        })
      }
      setShowTie(false)
      setTieWinners(new Set())
      await load()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  const handleRegisterRound = () => {
    const maxVal   = Math.max(...players.map(p => scores[p.id] ?? 0))
    if (maxVal <= 0) { setError('Nenhum ponto marcado'); return }
    const winners  = players.filter(p => (scores[p.id] ?? 0) === maxVal)
    if (winners.length === 1) {
      saveRound([winners[0].id])
    } else {
      setTiedPlayers(winners)
      setTieWinners(new Set(winners.map(p => p.id)))  // todos selecionados por padrão
      setShowTie(true)
    }
  }

  const resetCurrentRound = () => {
    const reset: Record<number, number> = {}
    players.forEach(p => { reset[p.id] = 0 })
    setScores(reset)
    setMenuOpen(false)
  }

  const undoLastRound = async () => {
    setMenuOpen(false)
    await api.delete(`/rounds.php?session_id=${session.id}`)
    load()
  }

  // ── Match mode helpers ────────────────────────────────────────────────────
  const addMatchWin  = (pid: number) => setMatchWins(prev => ({ ...prev, [pid]: (prev[pid] ?? 0) + 1 }))
  const subMatchWin  = (pid: number) => setMatchWins(prev => ({ ...prev, [pid]: Math.max(0, (prev[pid] ?? 0) - 1) }))
  const totalMatchWins = Object.values(matchWins).reduce((a, b) => a + b, 0)

  // ── End session ───────────────────────────────────────────────────────────
  const endSession = async () => {
    setSaving(true)
    setError('')
    try {
      const body: Record<string, unknown> = {}
      if (endWinnerId) body.winner_player_id = endWinnerId
      if (isMatchMode) {
        body.match_wins = players.map(p => ({ player_id: p.id, wins: matchWins[p.id] ?? 0 }))
      }
      const res = await api.put(`/sessions.php?id=${session.id}&action=end`, body)
      navigate(`/sessions/${session.id}/summary`, { state: res.data })
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao encerrar')
      setSaving(false)
    }
  }

  const toggleTieWinner = (pid: number) => {
    setTieWinners(prev => {
      const next = new Set(prev)
      if (next.has(pid)) { next.delete(pid) } else { next.add(pid) }
      return next
    })
  }

  // ── Pre-compute leader message for end modal ───────────────────────
  let leaderMsg = ''
  if (isMatchMode) {
    const maxW    = players.length ? Math.max(...players.map(p => matchWins[p.id] ?? 0)) : 0
    const leaders = players.filter(p => (matchWins[p.id] ?? 0) === maxW)
    if   (maxW === 0)          leaderMsg = 'Ninguém marcou partidas ainda.'
    else if (leaders.length === 1) leaderMsg = `${leaders[0].emoji} ${leaders[0].name} está na frente com ${maxW} partida${maxW > 1 ? 's' : ''}.`
    else                       leaderMsg = `🤝 Empate entre ${leaders.map(p => p.name).join(' e ')} com ${maxW} partida${maxW > 1 ? 's' : ''} cada.`
  } else if (sb.length) {
    const maxR    = Math.max(...sb.map(e => Number(e.rounds_won)))
    const leaders = sb.filter(e => Number(e.rounds_won) === maxR)
    if   (maxR === 0)          leaderMsg = 'Nenhuma rodada registrada.'
    else if (leaders.length === 1) leaderMsg = `${leaders[0].emoji} ${leaders[0].name} está na frente com ${maxR} rodada${maxR > 1 ? 's' : ''}.`
    else                       leaderMsg = `🤝 Empate entre ${leaders.map(e => e.name).join(' e ')} com ${maxR} rodada${maxR > 1 ? 's' : ''} cada.`
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 relative">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white leading-tight truncate">{session.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {isMatchMode
              ? `${totalMatchWins} ${totalMatchWins === 1 ? 'partida marcada' : 'partidas marcadas'}`
              : `${totalRounds} ${totalRounds === 1 ? 'rodada' : 'rodadas'}${maxScore > 1 ? ` · meta ${maxScore} pts` : ''}`
            }
            {session.group_name && ` · ${session.group_name}`}
          </p>
        </div>

        {!finished && (
          <div className="relative shrink-0">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="cursor-pointer w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-12 z-50 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-52 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-gray-800">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</p>
                  </div>
                  {!isMatchMode && (
                    <>
                      <button onClick={resetCurrentRound}
                        className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4 text-blue-400" /> Zerar rodada atual
                      </button>
                      {totalRounds > 0 && (
                        <button onClick={undoLastRound}
                          className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                        >
                          <X className="w-4 h-4 text-orange-400" /> Desfazer última rodada
                        </button>
                      )}
                    </>
                  )}
                  <div className="border-t border-gray-800">
                    <button onClick={() => { setMenuOpen(false); setConfirmEnd(true) }}
                      className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <FlagOff className="w-4 h-4" /> Encerrar jogatina
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2 text-sm">{error}</div>
      )}

      {/* ══ MATCH MODE ══ */}
      {isMatchMode && !finished && (
        <>
          <div className="space-y-3">
            {players.map(player => (
              <MatchCard
                key={player.id}
                player={player}
                wins={matchWins[player.id] ?? 0}
                disabled={saving}
                onAdd={() => addMatchWin(player.id)}
                onSub={() => subMatchWin(player.id)}
              />
            ))}
          </div>

          <button
            onClick={() => setConfirmEnd(true)}
            className="cursor-pointer w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all"
          >
            <FlagOff className="w-5 h-5" />
            Encerrar Jogatina
          </button>
        </>
      )}

      {/* ══ SCORE MODE ══ */}
      {!isMatchMode && !finished && (
        <>
          <div className={`grid gap-3 ${players.length >= 3 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
            {players.map(player => {
              const hex     = hexFor(player.color)
              const entry   = sbMap[player.id]
              const current = scores[player.id] ?? 0
              const hitMax  = maxScore > 0 && current >= maxScore

              return (
                <div
                  key={player.id}
                  className="rounded-2xl border p-4 transition-all"
                  style={{
                    backgroundColor: hitMax ? `${hex}30` : `${hex}22`,
                    borderColor:     hitMax ? `${hex}70` : `${hex}55`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{player.emoji}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-base truncate">{player.name}</p>
                            {(entry?.rounds_won ?? 0) > 0 && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                style={{ backgroundColor: `${hex}25`, color: hex }}>
                                {entry.rounds_won}🏆
                              </span>
                            )}
                          </div>
                          <p className="text-xs mt-0.5" style={{ color: hitMax ? hex : '#6b7280' }}>
                            {hitMax ? `✓ ${current} pts` : maxScore > 1 ? `${current} / ${maxScore} pts` : `${current} pts`}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => adjustScore(player.id, -1)}
                        className="cursor-pointer w-11 h-11 rounded-xl bg-gray-800 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/40 text-gray-300 flex items-center justify-center transition-all"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className={`w-8 text-center text-lg font-black select-none ${current > 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {current}
                      </span>
                      <button onClick={() => adjustScore(player.id, 1)}
                        className="cursor-pointer w-11 h-11 rounded-xl border flex items-center justify-center transition-all active:scale-95"
                        style={{ backgroundColor: `${hex}20`, borderColor: `${hex}40`, color: hex }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={handleRegisterRound}
            disabled={saving}
            className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 disabled:opacity-50 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all shadow-lg shadow-emerald-500/20"
          >
            <Check className="w-5 h-5" /> Registrar Rodada
          </button>
        </>
      )}

      {/* ══ FINISHED scoreboard ══ */}
      {finished && (
        <div className="space-y-3">
          {sb.map((entry, idx) => {
            const hex = hexFor(entry.color)
            return (
              <div key={entry.id} className="rounded-2xl border p-4 flex items-center gap-4 transition-all"
                style={{ backgroundColor: `${hex}12`, borderColor: `${hex}35` }}
              >
                <span className="text-2xl w-8 text-center shrink-0">
                  {idx === 0 ? '🏆' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                </span>
                <span className="text-2xl shrink-0">{entry.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{entry.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{entry.total_score} pts acumulados</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xl font-black" style={{ color: hex }}>{entry.rounds_won}</p>
                  <p className="text-xs text-gray-500">rodadas</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Round history (score mode only) */}
      {!isMatchMode && totalRounds > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <button onClick={() => setShowRounds(o => !o)}
            className="cursor-pointer w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-400" /> Histórico de rodadas
            </span>
            {showRounds ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showRounds && (
            <div className="divide-y divide-gray-800 border-t border-gray-800">
              {[...(session.rounds ?? [])].reverse().map(r => (
                <div key={r.id} className="px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-gray-500">#{r.round_number}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white">{r.winner_name}</span>
                    <Trophy className="w-3 h-3 text-yellow-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TIE MODAL (score mode) — multi-select ── */}
      {showTie && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4 md:items-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-white">Empate! Quem ganhou?</h2>
                <p className="text-xs text-gray-500 mt-0.5">Pode selecionar mais de um</p>
              </div>
              <button onClick={() => setShowTie(false)} className="cursor-pointer text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {tiedPlayers.map(p => {
                const hex      = hexFor(p.color)
                const selected = tieWinners.has(p.id)
                return (
                  <button key={p.id} onClick={() => toggleTieWinner(p.id)}
                    className="cursor-pointer w-full flex items-center gap-3 border rounded-xl p-3 text-left transition-all"
                    style={selected
                      ? { backgroundColor: `${hex}20`, borderColor: `${hex}50` }
                      : { backgroundColor: 'transparent', borderColor: '#374151' }
                    }
                  >
                    <span className="text-xl">{p.emoji}</span>
                    <span className="font-semibold text-white flex-1">{p.name}</span>
                    <span className="text-sm font-bold" style={{ color: hex }}>{scores[p.id] ?? 0} pts</span>
                    <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-600'}`}>
                      {selected && <Check className="w-3 h-3 text-gray-950" />}
                    </span>
                  </button>
                )
              })}
            </div>
            <button
              disabled={saving || tieWinners.size === 0}
              onClick={() => saveRound(Array.from(tieWinners))}
              className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition-all"
            >
              {saving ? 'Salvando…' : `Confirmar (${tieWinners.size} vencedor${tieWinners.size > 1 ? 'es' : ''})`}
            </button>
          </div>
        </div>
      )}

      {/* ── CONFIRM END MODAL ── */}
      {confirmEnd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4 md:items-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white">Encerrar jogatina?</h2>
              <button onClick={() => setConfirmEnd(false)} className="cursor-pointer text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Auto leader banner */}
            <div className="bg-gray-800 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-sm text-gray-200">{leaderMsg}</p>
            </div>

            {isMatchMode && (
              <div className="space-y-2 mb-3">
                {players.map(p => {
                  const hex = hexFor(p.color)
                  const w   = matchWins[p.id] ?? 0
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-800">
                      <span className="text-lg">{p.emoji}</span>
                      <span className="flex-1 font-medium text-white text-sm">{p.name}</span>
                      <span className="font-black text-lg" style={{ color: hex }}>{w}</span>
                      <span className="text-xs text-gray-500">partidas</span>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="text-xs text-gray-500 mb-3">Sobrescreva o vencedor se necessário:</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {players.map(p => {
                const hex = hexFor(p.color)
                return (
                  <button key={p.id} onClick={() => setEndWinnerId(endWinnerId === p.id ? null : p.id)}
                    className="cursor-pointer py-2 px-3 rounded-xl text-sm font-medium border transition-all"
                    style={endWinnerId === p.id
                      ? { backgroundColor: `${hex}25`, borderColor: `${hex}60`, color: hex }
                      : { backgroundColor: 'transparent', borderColor: '#374151', color: '#9ca3af' }
                    }
                  >
                    {p.emoji} {p.name}
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmEnd(false)}
                className="cursor-pointer flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-all"
              >Cancelar</button>
              <button onClick={endSession} disabled={saving}
                className="cursor-pointer flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
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
