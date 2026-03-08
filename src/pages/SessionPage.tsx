import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'
import type { Session, SessionPlayer, ScoreboardEntry } from '../types'
import { Trophy, RotateCcw, FlagOff, X, ChevronDown, ChevronUp, Check, Menu, AlertTriangle } from 'lucide-react'

const COLOR_HEX: Record<string, string> = {
  emerald: '#10b981', blue: '#3b82f6', purple: '#a855f7',
  red:     '#ef4444', orange: '#f97316', yellow: '#eab308',
  pink:    '#ec4899', cyan:   '#06b6d4',
}
function hexFor(color: string) { return COLOR_HEX[color] ?? '#10b981' }

// ── Rotações por número de jogadores (sentido de leitura) ────────────────────
const ROTATIONS: Record<number, number[]> = {
  1: [0],
  2: [180, 0],
  3: [180, 180, 0],
  4: [180, 180, 0, 0],
}

// ── Grid: linhas e colunas por count ─────────────────────────────────────────
function gridStyle(count: number): React.CSSProperties {
  if (count === 1) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr' }
  if (count === 2) return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr 1fr' }
  if (count === 3) return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }
  return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr' }
}

// ── Span por índice ───────────────────────────────────────────────────────────
function cellStyle(count: number, idx: number): React.CSSProperties {
  // 3 jogadores: último ocupa linha inteira
  if (count === 3 && idx === 2) return { gridColumn: '1 / -1' }
  return {}
}

// ── Painel de um jogador ──────────────────────────────────────────────────────
function PlayerPanel({
  player, score, rotation, isMatchMode,
  onAdd, onSub, disabled, sbEntry,
}: {
  player: SessionPlayer
  score: number
  rotation: number
  isMatchMode: boolean
  onAdd: () => void
  onSub: () => void
  disabled: boolean
  sbEntry?: ScoreboardEntry
}) {
  const hex       = hexFor(player.color)
  const roundsWon = sbEntry ? Number(sbEntry.rounds_won) : 0

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ backgroundColor: `${hex}18` }}
    >
      {/* Botão − (metade superior) */}
      <button
        onClick={onSub}
        disabled={disabled || score <= 0}
        className="cursor-pointer flex-1 w-full flex items-center justify-center active:brightness-75 transition-all disabled:opacity-30"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <span className="text-white/40 font-black select-none" style={{ fontSize: 'clamp(2.5rem, 10vw, 6rem)' }}>−</span>
      </button>

      {/* Info central */}
      <div
        className="shrink-0 flex flex-col items-center justify-center gap-0.5 pointer-events-none py-1"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <span style={{ fontSize: 'clamp(1.2rem, 4vw, 2.5rem)' }}>{player.emoji}</span>
        <span
          className="font-bold text-white text-center leading-tight px-3"
          style={{ fontSize: 'clamp(0.65rem, 2vw, 1.2rem)' }}
        >
          {player.name}
        </span>
        <span
          className="font-black leading-none"
          style={{ color: hex, fontSize: 'clamp(2.5rem, 12vw, 7rem)' }}
        >
          {score}
        </span>
        {!isMatchMode && roundsWon > 0 && (
          <span className="text-yellow-400 font-semibold" style={{ fontSize: 'clamp(0.55rem, 1.5vw, 0.85rem)' }}>
            🏆 {roundsWon} {roundsWon === 1 ? 'rodada' : 'rodadas'}
          </span>
        )}
        {isMatchMode && (
          <span className="text-white/40" style={{ fontSize: 'clamp(0.55rem, 1.5vw, 0.85rem)' }}>
            {score === 1 ? 'partida' : 'partidas'}
          </span>
        )}
      </div>

      {/* Botão + (metade inferior) */}
      <button
        onClick={onAdd}
        disabled={disabled}
        className="cursor-pointer flex-1 w-full flex items-center justify-center active:brightness-75 transition-all disabled:opacity-50"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <span className="font-black select-none" style={{ color: hex, fontSize: 'clamp(2.5rem, 10vw, 6rem)' }}>+</span>
      </button>

      {/* Borda sutil */}
      <div className="absolute inset-0 border pointer-events-none" style={{ borderColor: `${hex}25` }} />
    </div>
  )
}

export default function SessionPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [session,     setSession]     = useState<Session | null>(null)
  const [scores,      setScores]      = useState<Record<number, number>>({})
  const [matchWins,   setMatchWins]   = useState<Record<number, number>>({})
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [showRounds,  setShowRounds]  = useState(false)
  const [tieWinners,  setTieWinners]  = useState<Set<number>>(new Set())
  const [showTie,     setShowTie]     = useState(false)
  const [tiedPlayers, setTiedPlayers] = useState<SessionPlayer[]>([])
  const [confirmEnd,  setConfirmEnd]  = useState(false)
  const [endWinnerId, setEndWinnerId] = useState<number | null>(null)
  // Quando true: após salvar a rodada do tie, encerra a sessão
  const [endAfterTie, setEndAfterTie] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get(`/sessions.php?id=${id}`).then(r => {
      const s: Session = r.data
      setSession(s)
      const initScores: Record<number, number> = {}
      const initWins:   Record<number, number> = {}
      s.players?.forEach(p => { initScores[p.id] = 0; initWins[p.id] = 0 })
      setScores(initScores)
      setMatchWins(initWins)
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const players: SessionPlayer[] = session.players ?? []
  const sb: ScoreboardEntry[]    = session.scoreboard ?? []
  const sbMap                    = Object.fromEntries(sb.map(e => [e.id, e]))
  const totalRounds              = session.rounds?.length ?? 0
  const finished                 = session.status === 'finished'
  const maxScore                 = session.max_score ?? 1
  const isMatchMode              = maxScore === 0

  // Há pontos marcados nessa rodada ainda não registrados?
  const hasUnsavedPoints = !isMatchMode && players.some(p => (scores[p.id] ?? 0) > 0)

  const adjustScore = (playerId: number, delta: number) =>
    setScores(prev => ({ ...prev, [playerId]: Math.max(0, (prev[playerId] ?? 0) + delta) }))

  // Salva rodada; se endAfter=true, encerra a sessão logo depois
  const saveRound = async (winnerIds: number[], endAfter = false) => {
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
      setEndAfterTie(false)
      if (endAfter) {
        await doEndSession()
      } else {
        await load()
      }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao salvar')
      setSaving(false)
    }
  }

  const doEndSession = async () => {
    const body: Record<string, unknown> = {}
    if (endWinnerId) body.winner_player_id = endWinnerId
    if (isMatchMode) body.match_wins = players.map(p => ({ player_id: p.id, wins: matchWins[p.id] ?? 0 }))
    try {
      const res = await api.put(`/sessions.php?id=${session.id}&action=end`, body)
      navigate(`/sessions/${session.id}/summary`, { state: res.data })
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao encerrar')
      setSaving(false)
    }
  }

  // Tenta registrar rodada; se endAfter=true, encerra após
  const triggerRegisterRound = (endAfter = false) => {
    setMenuOpen(false)
    const maxVal  = Math.max(...players.map(p => scores[p.id] ?? 0))
    if (maxVal <= 0) { setError('Nenhum ponto marcado'); return }
    const winners = players.filter(p => (scores[p.id] ?? 0) === maxVal)
    if (winners.length === 1) {
      saveRound([winners[0].id], endAfter)
    } else {
      setTiedPlayers(winners)
      setTieWinners(new Set(winners.map(p => p.id)))
      setEndAfterTie(endAfter)
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

  const addMatchWin = (pid: number) => setMatchWins(prev => ({ ...prev, [pid]: (prev[pid] ?? 0) + 1 }))
  const subMatchWin = (pid: number) => setMatchWins(prev => ({ ...prev, [pid]: Math.max(0, (prev[pid] ?? 0) - 1) }))

  const endSession = async () => {
    setSaving(true)
    setError('')
    await doEndSession()
  }

  const toggleTieWinner = (pid: number) => {
    setTieWinners(prev => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid); else next.add(pid)
      return next
    })
  }

  // Mensagem de líder para o modal de encerramento
  let leaderMsg = ''
  if (isMatchMode) {
    const maxW    = players.length ? Math.max(...players.map(p => matchWins[p.id] ?? 0)) : 0
    const leaders = players.filter(p => (matchWins[p.id] ?? 0) === maxW)
    if      (maxW === 0)           leaderMsg = 'Ninguém marcou partidas ainda.'
    else if (leaders.length === 1) leaderMsg = `${leaders[0].emoji} ${leaders[0].name} está na frente com ${maxW} partida${maxW > 1 ? 's' : ''}.`
    else                           leaderMsg = `🤝 Empate entre ${leaders.map(p => p.name).join(' e ')} com ${maxW} partida${maxW > 1 ? 's' : ''} cada.`
  } else if (sb.length) {
    const maxR    = Math.max(...sb.map(e => Number(e.rounds_won)))
    const leaders = sb.filter(e => Number(e.rounds_won) === maxR)
    if      (maxR === 0)           leaderMsg = 'Nenhuma rodada registrada.'
    else if (leaders.length === 1) leaderMsg = `${leaders[0].emoji} ${leaders[0].name} está na frente com ${maxR} rodada${maxR > 1 ? 's' : ''}.`
    else                           leaderMsg = `🤝 Empate entre ${leaders.map(e => e.name).join(' e ')} com ${maxR} rodada${maxR > 1 ? 's' : ''} cada.`
  }

  // ── Tela de encerrado ─────────────────────────────────────────────────────
  if (finished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6 text-yellow-400 shrink-0" />
          <div>
            <h1 className="text-xl font-bold text-white">{session.title}</h1>
            <p className="text-xs text-gray-500">Jogatina encerrada</p>
          </div>
        </div>
        <div className="space-y-3">
          {sb.map((entry, idx) => {
            const hex = hexFor(entry.color)
            return (
              <div key={entry.id} className="rounded-2xl border p-4 flex items-center gap-4"
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
        {totalRounds > 0 && (
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
      </div>
    )
  }

  // ── Jogo ativo — tela cheia MTG ───────────────────────────────────────────
  const n         = players.length
  const rotations = ROTATIONS[n] ?? players.map(() => 0)

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col overflow-hidden">

      {/* Tira de título fina */}
      <div className="flex items-center justify-between px-3 py-1 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800/50 z-10 shrink-0">
        <span className="text-xs text-gray-500 truncate max-w-[60%]">{session.title}</span>
        <span className="text-xs text-gray-600">
          {isMatchMode
            ? `${Object.values(matchWins).reduce((a, b) => a + b, 0)} partidas`
            : `${totalRounds} rodadas`}
        </span>
      </div>

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 text-red-400 px-4 py-1.5 text-xs text-center z-10 shrink-0 flex items-center justify-center gap-2">
          {error}
          <button onClick={() => setError('')} className="underline">ok</button>
        </div>
      )}

      {/* Grid de jogadores */}
      <div
        className="flex-1 grid overflow-hidden"
        style={gridStyle(n)}
      >
        {players.map((player, idx) => {
          const score = isMatchMode ? (matchWins[player.id] ?? 0) : (scores[player.id] ?? 0)
          const onAdd = isMatchMode ? () => addMatchWin(player.id) : () => adjustScore(player.id, 1)
          const onSub = isMatchMode ? () => subMatchWin(player.id) : () => adjustScore(player.id, -1)
          return (
            <div key={player.id} style={cellStyle(n, idx)} className="overflow-hidden">
              <PlayerPanel
                player={player}
                score={score}
                rotation={rotations[idx] ?? 0}
                isMatchMode={isMatchMode}
                onAdd={onAdd}
                onSub={onSub}
                disabled={saving}
                sbEntry={sbMap[player.id]}
              />
            </div>
          )
        })}
      </div>

      {/* ── Botão central de menu ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="relative pointer-events-auto">

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col items-center gap-2">
                {/* Registrar rodada (score mode) */}
                {!isMatchMode && (
                  <button
                    onClick={() => triggerRegisterRound(false)}
                    disabled={saving}
                    className="cursor-pointer flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold px-4 py-2.5 rounded-2xl shadow-xl shadow-emerald-500/30 text-sm whitespace-nowrap transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" /> Registrar Rodada
                  </button>
                )}
                {!isMatchMode && (
                  <button
                    onClick={resetCurrentRound}
                    className="cursor-pointer flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium px-4 py-2.5 rounded-2xl shadow-xl text-sm whitespace-nowrap transition-all"
                  >
                    <RotateCcw className="w-4 h-4 text-blue-400" /> Zerar rodada
                  </button>
                )}
                {!isMatchMode && totalRounds > 0 && (
                  <button
                    onClick={undoLastRound}
                    className="cursor-pointer flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-medium px-4 py-2.5 rounded-2xl shadow-xl text-sm whitespace-nowrap transition-all"
                  >
                    <X className="w-4 h-4 text-orange-400" /> Desfazer última
                  </button>
                )}
                <button
                  onClick={() => { setMenuOpen(false); setConfirmEnd(true) }}
                  className="cursor-pointer flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 hover:text-red-300 font-bold px-4 py-2.5 rounded-2xl shadow-xl text-sm whitespace-nowrap transition-all"
                >
                  <FlagOff className="w-4 h-4" /> Encerrar jogatina
                </button>
              </div>
            </>
          )}

          <button
            onClick={() => setMenuOpen(o => !o)}
            className={`cursor-pointer w-12 h-12 rounded-full shadow-2xl border-2 flex items-center justify-center transition-all z-30 relative ${
              menuOpen
                ? 'bg-gray-700 border-gray-500 text-white scale-110'
                : 'bg-gray-900/90 border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
            }`}
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── MODAL: Empate ── */}
      {showTie && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4 md:items-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-white">Empate! Quem ganhou?</h2>
                <p className="text-xs text-gray-500 mt-0.5">Pode selecionar mais de um</p>
              </div>
              <button onClick={() => { setShowTie(false); setEndAfterTie(false) }} className="cursor-pointer text-gray-500 hover:text-white">
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
                      : { backgroundColor: 'transparent', borderColor: '#374151' }}
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
              onClick={() => saveRound(Array.from(tieWinners), endAfterTie)}
              className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition-all"
            >
              {saving
                ? 'Salvando…'
                : endAfterTie
                  ? `Confirmar e encerrar`
                  : `Confirmar (${tieWinners.size} vencedor${tieWinners.size > 1 ? 'es' : ''})`}
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmar encerramento ── */}
      {confirmEnd && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4 md:items-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-white">Encerrar jogatina?</h2>
              <button onClick={() => setConfirmEnd(false)} className="cursor-pointer text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aviso de rodada não registrada */}
            {hasUnsavedPoints && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-3 py-2.5 mb-4 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-300">Rodada com pontos não registrados</p>
                  <p className="text-xs text-yellow-400/70 mt-0.5">Você pode registrar essa rodada e encerrar em um passo.</p>
                </div>
              </div>
            )}

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
                      : { backgroundColor: 'transparent', borderColor: '#374151', color: '#9ca3af' }}
                  >
                    {p.emoji} {p.name}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-2">
              {/* Registrar e encerrar (só aparece se tiver pontos não salvos) */}
              {hasUnsavedPoints && (
                <button
                  onClick={() => { setConfirmEnd(false); triggerRegisterRound(true) }}
                  disabled={saving}
                  className="cursor-pointer w-full py-3 rounded-xl bg-emerald-500/90 hover:bg-emerald-500 disabled:opacity-50 text-gray-950 text-sm font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Registrar rodada e encerrar
                </button>
              )}
              <div className="flex gap-2">
                <button onClick={() => setConfirmEnd(false)}
                  className="cursor-pointer flex-1 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white text-sm font-medium transition-all"
                >Cancelar</button>
                <button onClick={() => { setConfirmEnd(false); endSession() }} disabled={saving}
                  className="cursor-pointer flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
                >
                  {saving ? 'Encerrando…' : hasUnsavedPoints ? 'Encerrar assim mesmo' : 'Encerrar!'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
