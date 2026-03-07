import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import type { Group, PlayerSuggestion } from '../types'
import { ChevronLeft, ChevronRight, Plus, X, Users, Minus } from 'lucide-react'

type Step = 1 | 2 | 3

// ── Emoji picker ───────────────────────────────────────────────
const EMOJIS = ['🎯','🔥','⚡','👑','💪','🦁','🐯','🐻','🦊','🐸',
                '🐢','🦄','🎮','🃏','🎲','🏆','💀','👻','🤖','🍀',
                '🎩','🤠','😎','🤑','😈','🥷','🌊','🐉','🎸','🚀']

// ── Color picker ───────────────────────────────────────────────
const COLORS: { id: string; hex: string; label: string }[] = [
  { id: 'emerald', hex: '#10b981', label: 'Verde'    },
  { id: 'blue',    hex: '#3b82f6', label: 'Azul'     },
  { id: 'purple',  hex: '#a855f7', label: 'Roxo'     },
  { id: 'red',     hex: '#ef4444', label: 'Vermelho' },
  { id: 'orange',  hex: '#f97316', label: 'Laranja'  },
  { id: 'yellow',  hex: '#eab308', label: 'Amarelo'  },
  { id: 'pink',    hex: '#ec4899', label: 'Rosa'     },
  { id: 'cyan',    hex: '#06b6d4', label: 'Ciano'    },
]

interface PlayerConfig { name: string; emoji: string; color: string }

const defaultPlayer = (): PlayerConfig => ({ name: '', emoji: '🎮', color: 'emerald' })

export default function NewSessionPage() {
  const navigate = useNavigate()

  // Step 1
  const [title,    setTitle]    = useState('')
  const [maxScore, setMaxScore] = useState(0)            // 0 = Por Partida
  const [groupId,  setGroupId]  = useState<number | ''>('')
  const [groups,   setGroups]   = useState<Group[]>([])

  // Step 2
  const [playerCount, setPlayerCount] = useState(2)

  // Step 3
  const [players,     setPlayers]     = useState<PlayerConfig[]>([defaultPlayer(), defaultPlayer()])
  const [suggestions, setSuggestions] = useState<PlayerSuggestion[]>([])
  const [emojiFor,    setEmojiFor]    = useState<number | null>(null)   // index de qual card abriu emoji picker

  const [step,   setStep]   = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  useEffect(() => {
    api.get('/groups.php').then(r => setGroups(r.data))
  }, [])

  useEffect(() => {
    if (groupId) api.get(`/group_players.php?group_id=${groupId}`).then(r => setSuggestions(r.data))
    else setSuggestions([])
  }, [groupId])

  const goToStep2 = () => {
    if (!title.trim()) { setError('Informe o título da jogatina'); return }
    setError('')
    setStep(2)
  }

  const goToStep3 = () => {
    setPlayers(Array.from({ length: playerCount }, (_, i) => players[i] ?? defaultPlayer()))
    setStep(3)
  }

  const updatePlayer = (i: number, patch: Partial<PlayerConfig>) =>
    setPlayers(prev => { const n = [...prev]; n[i] = { ...n[i], ...patch }; return n })

  const applySuggestion = (s: PlayerSuggestion) => {
    const emptyIdx = players.findIndex(p => !p.name.trim())
    if (emptyIdx >= 0) updatePlayer(emptyIdx, { name: s.name, emoji: s.emoji ?? '🎮', color: s.color ?? 'emerald' })
  }

  const handleCreate = async () => {
    const valid = players.map(p => ({ ...p, name: p.name.trim() })).filter(p => p.name)
    if (valid.length < 2) { setError('Preencha pelo menos 2 nomes'); return }
    setSaving(true); setError('')
    try {
      const res = await api.post('/sessions.php', {
        title: title.trim(),
        max_score: maxScore,
        group_id: groupId || null,
        players: valid,
      })
      navigate(`/sessions/${res.data.id}`)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar jogatina')
    } finally { setSaving(false) }
  }

  const usedNames = new Set(players.map(p => p.name.trim().toLowerCase()))

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-emerald-500' : 'bg-gray-800'}`} />
        ))}
      </div>

      {/* ─── STEP 1: Título, modo e grupo ─── */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Nova Jogatina</h1>
            <p className="text-gray-500 text-sm mt-1">Passo 1 de 3</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Título</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Pife da Sexta"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          {/* Modo */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tipo de jogo</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button type="button" onClick={() => setMaxScore(0)}
                className={`cursor-pointer p-4 rounded-2xl border text-left transition-all ${
                  maxScore === 0
                    ? 'bg-emerald-500/15 border-emerald-500/50'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">🎲</div>
                <p className="font-semibold text-white text-sm">Por Partidas</p>
                <p className="text-xs text-gray-500 mt-0.5">Pife, Dominó…</p>
              </button>
              <button type="button" onClick={() => setMaxScore(maxScore === 0 ? 12 : maxScore)}
                className={`cursor-pointer p-4 rounded-2xl border text-left transition-all ${
                  maxScore > 0
                    ? 'bg-emerald-500/15 border-emerald-500/50'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="text-2xl mb-1">🃏</div>
                <p className="font-semibold text-white text-sm">Por Pontuação</p>
                <p className="text-xs text-gray-500 mt-0.5">Truco, Buraco…</p>
              </button>
            </div>

            {maxScore > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Pontuação máxima por rodada:</p>
                <div className="grid grid-cols-3 gap-2">
                  {([{v:6,label:'6',sub:'Buraco'},{v:12,label:'12',sub:'Truco'},{v:3,label:'3',sub:'Dominó'}] as const).map(opt => (
                    <button key={opt.v} type="button" onClick={() => setMaxScore(opt.v)}
                      className={`cursor-pointer p-2.5 rounded-xl border text-center transition-all ${
                        maxScore === opt.v
                          ? 'bg-emerald-500/15 border-emerald-500/50'
                          : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                      }`}
                    >
                      <p className="font-bold text-white">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.sub}</p>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-500 shrink-0">Outro:</label>
                  <input type="number" min={1} max={99} value={maxScore}
                    onChange={e => setMaxScore(Math.max(1, Math.min(99, Number(e.target.value))))}
                    className="w-20 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-gray-500">pts/rodada</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Grupo (opcional)</label>
            <select value={groupId} onChange={e => setGroupId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
            >
              <option value="">Sem grupo</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={goToStep2}
            className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >Próximo <ChevronRight className="w-5 h-5" /></button>
        </div>
      )}

      {/* ─── STEP 2: Quantidade ─── */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-500 hover:text-white text-sm mb-4 transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-white">Quantos jogadores?</h1>
            <p className="text-gray-500 text-sm mt-1">Passo 2 de 3</p>
          </div>
          <div className="flex items-center justify-center gap-6 py-6">
            <button onClick={() => setPlayerCount(c => Math.max(2, c - 1))}
              className="cursor-pointer w-16 h-16 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white flex items-center justify-center transition-all active:scale-90"
            ><Minus className="w-6 h-6" /></button>
            <span className="text-6xl font-black text-white w-20 text-center">{playerCount}</span>
            <button onClick={() => setPlayerCount(c => Math.min(12, c + 1))}
              className="cursor-pointer w-16 h-16 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center transition-all active:scale-90"
            ><Plus className="w-6 h-6" /></button>
          </div>
          <button onClick={goToStep3}
            className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >Próximo <ChevronRight className="w-5 h-5" /></button>
        </div>
      )}

      {/* ─── STEP 3: Nomes, emoji e cor ─── */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-gray-500 hover:text-white text-sm mb-4 transition-colors cursor-pointer">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-white">Jogadores</h1>
            <p className="text-gray-500 text-sm mt-1">Passo 3 de 3 — personalize cada um</p>
          </div>

          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />Jogadores do grupo</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => {
                  const used = usedNames.has(s.name.trim().toLowerCase())
                  return (
                    <button key={s.name} disabled={used} onClick={() => applySuggestion(s)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all cursor-pointer ${used ? 'opacity-40 cursor-default' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'}`}
                    >{s.emoji ?? '🎮'} {s.name}</button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Player cards */}
          <div className="space-y-3">
            {players.map((p, i) => {
              const colorHex = COLORS.find(c => c.id === p.color)?.hex ?? '#10b981'
              return (
                <div key={i} className="rounded-2xl border p-4 space-y-3 transition-all"
                  style={{ backgroundColor: `${colorHex}12`, borderColor: `${colorHex}30` }}
                >
                  <div className="flex items-center gap-3">
                    {/* Emoji button */}
                    <button onClick={() => setEmojiFor(emojiFor === i ? null : i)}
                      className="cursor-pointer w-12 h-12 text-2xl rounded-xl border border-white/10 bg-black/20 hover:bg-black/30 flex items-center justify-center transition-all shrink-0"
                    >{p.emoji}</button>

                    {/* Name input */}
                    <div className="relative flex-1">
                      <input type="text" value={p.name} onChange={e => updatePlayer(i, { name: e.target.value })}
                        placeholder={`Jogador ${i + 1}`}
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 pr-10 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 text-sm"
                      />
                      {p.name && (
                        <button onClick={() => updatePlayer(i, { name: '' })} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Emoji picker (inline) */}
                  {emojiFor === i && (
                    <div className="grid grid-cols-10 gap-1">
                      {EMOJIS.map(em => (
                        <button key={em} onClick={() => { updatePlayer(i, { emoji: em }); setEmojiFor(null) }}
                          className={`cursor-pointer text-xl py-1 rounded-lg hover:bg-white/10 transition-all ${p.emoji === em ? 'bg-white/20' : ''}`}
                        >{em}</button>
                      ))}
                    </div>
                  )}

                  {/* Color picker */}
                  <div className="flex gap-2">
                    {COLORS.map(c => (
                      <button key={c.id} onClick={() => updatePlayer(i, { color: c.id })}
                        className="cursor-pointer w-6 h-6 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: c.hex,
                          borderColor: p.color === c.id ? 'white' : 'transparent',
                          transform: p.color === c.id ? 'scale(1.2)' : 'scale(1)',
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleCreate} disabled={saving}
            className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            {saving ? 'Criando…' : 'Iniciar Jogatina!'}
          </button>
        </div>
      )}
    </div>
  )
}
