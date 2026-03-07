import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import type { Group, PlayerSuggestion } from '../types'
import { ChevronLeft, ChevronRight, Plus, X, Users } from 'lucide-react'

type Step = 1 | 2 | 3

export default function NewSessionPage() {
  const navigate = useNavigate()

  // Step 1
  const [title,    setTitle]   = useState('')
  const [groupId,  setGroupId] = useState<number | ''>('')
  const [groups,   setGroups]  = useState<Group[]>([])

  // Step 2
  const [playerCount, setPlayerCount] = useState(2)

  // Step 3
  const [playerNames,  setPlayerNames]  = useState<string[]>(['', ''])
  const [suggestions,  setSuggestions]  = useState<PlayerSuggestion[]>([])

  const [step,    setStep]   = useState<Step>(1)
  const [saving,  setSaving] = useState(false)
  const [error,   setError]  = useState('')

  useEffect(() => {
    api.get('/groups.php').then(r => setGroups(r.data))
  }, [])

  // Load suggestions when group is selected
  useEffect(() => {
    if (groupId) {
      api.get(`/group_players.php?group_id=${groupId}`).then(r => setSuggestions(r.data))
    } else {
      setSuggestions([])
    }
  }, [groupId])

  const goToStep2 = () => {
    if (!title.trim()) { setError('Informe o título da jogatina'); return }
    setError('')
    setStep(2)
  }

  const goToStep3 = () => {
    const names = Array.from({ length: playerCount }, (_, i) => playerNames[i] || '')
    setPlayerNames(names)
    setStep(3)
  }

  const updateName = (i: number, val: string) => {
    setPlayerNames(prev => { const n = [...prev]; n[i] = val; return n })
  }

  const applySuggestion = (name: string) => {
    const emptyIdx = playerNames.findIndex(n => !n.trim())
    if (emptyIdx >= 0) updateName(emptyIdx, name)
  }

  const handleCreate = async () => {
    const players = playerNames.map(n => n.trim()).filter(Boolean)
    if (players.length < 2) { setError('Preencha pelo menos 2 nomes'); return }
    setSaving(true); setError('')
    try {
      const res = await api.post('/sessions.php', {
        title: title.trim(),
        group_id: groupId || null,
        players,
      })
      navigate(`/sessions/${res.data.id}`)
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar jogatina')
    } finally { setSaving(false) }
  }

  const usedSuggestions = new Set(playerNames.map(n => n.trim().toLowerCase()))

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {([1, 2, 3] as Step[]).map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? 'bg-emerald-500' : 'bg-gray-800'}`} />
        ))}
      </div>

      {/* ---- STEP 1: Título + Grupo ---- */}
      {step === 1 && (
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Nova Jogatina</h1>
            <p className="text-gray-500 text-sm mt-1">Passo 1 de 3 — Informações gerais</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Título da jogatina</label>
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Pife da Sexta"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Grupo (opcional)</label>
              <select
                value={groupId}
                onChange={e => setGroupId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 text-sm"
              >
                <option value="">Sem grupo</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button onClick={goToStep2}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            Próximo <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ---- STEP 2: Quantidade de jogadores ---- */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-1 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-white">Quantos jogadores?</h1>
            <p className="text-gray-500 text-sm mt-1">Passo 2 de 3</p>
          </div>

          <div className="flex items-center justify-center gap-6 py-6">
            <button
              onClick={() => setPlayerCount(c => Math.max(2, c - 1))}
              className="w-16 h-16 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white text-3xl font-bold flex items-center justify-center transition-all active:scale-90"
            >−</button>
            <span className="text-6xl font-black text-white w-20 text-center">{playerCount}</span>
            <button
              onClick={() => setPlayerCount(c => Math.min(12, c + 1))}
              className="w-16 h-16 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 text-emerald-400 text-3xl font-bold flex items-center justify-center transition-all active:scale-90"
            >+</button>
          </div>

          <button onClick={goToStep3}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            Próximo <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ---- STEP 3: Nomes ---- */}
      {step === 3 && (
        <div className="space-y-5">
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1 text-gray-500 hover:text-white text-sm mb-4 transition-colors">
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
            <h1 className="text-2xl font-bold text-white">Nomes dos jogadores</h1>
            <p className="text-gray-500 text-sm mt-1">Passo 3 de 3 — {playerCount} jogadores</p>
          </div>

          {/* Sugestões do grupo */}
          {suggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Jogadores do grupo
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(s => {
                  const used = usedSuggestions.has(s.name.trim().toLowerCase())
                  return (
                    <button key={s.name} disabled={used} onClick={() => applySuggestion(s.name)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        used
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 cursor-default'
                          : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-emerald-500 hover:text-emerald-400'
                      }`}
                    >
                      {s.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-2.5">
            {Array.from({ length: playerCount }).map((_, i) => (
              <div key={i} className="relative">
                <input
                  type="text"
                  value={playerNames[i] || ''}
                  onChange={e => updateName(i, e.target.value)}
                  placeholder={`Jogador ${i + 1}`}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-4 pr-10 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
                />
                {playerNames[i] && (
                  <button onClick={() => updateName(i, '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button onClick={handleCreate} disabled={saving}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-5 h-5" />
            {saving ? 'Criando…' : 'Iniciar Jogatina!'}
          </button>
        </div>
      )}
    </div>
  )
}
