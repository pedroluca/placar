import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import type { Group, User } from '../types'
import { Plus, Users, ChevronRight, X, Check } from 'lucide-react'

export default function GroupsPage() {
  const [groups,  setGroups]  = useState<Group[]>([])
  const [users,   setUsers]   = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [show,    setShow]    = useState(false)
  const [name,    setName]    = useState('')
  const [desc,    setDesc]    = useState('')
  const [memberIds, setMemberIds] = useState<number[]>([])
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const load = () => {
    Promise.all([api.get('/groups.php'), api.get('/users.php')])
      .then(([gRes, uRes]) => { setGroups(gRes.data); setUsers(uRes.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const toggleMember = (id: number) =>
    setMemberIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setError('')
    try {
      await api.post('/groups.php', { name: name.trim(), description: desc.trim(), member_ids: memberIds })
      setShow(false); setName(''); setDesc(''); setMemberIds([])
      load()
    } catch (err: unknown) {
      setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar grupo')
    } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-400" /> Grupos
        </h1>
        <button onClick={() => setShow(true)}
          className="cursor-pointer bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-bold px-3 py-1.5 rounded-xl text-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo
        </button>
      </div>

      {groups.length === 0 && (
        <div className="text-center py-16 text-gray-600">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum grupo ainda. Crie o primeiro!</p>
        </div>
      )}

      <div className="space-y-2">
        {groups.map(g => (
          <Link key={g.id} to={`/groups/${g.id}`}
            className="flex items-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-4 transition-all"
          >
            <div className="bg-emerald-500/10 border border-emerald-500/20 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-emerald-400 font-bold text-sm">{g.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{g.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{g.session_count} jogatinas · {g.owner_name}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Modal criar grupo */}
      {show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white text-lg">Novo Grupo</h2>
              <button onClick={() => setShow(false)} className="text-gray-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="Nome do grupo" required
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
              <input
                type="text" value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Descrição (opcional)"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 text-sm"
              />
              {users.length > 1 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">Convidar membros</p>
                  <div className="flex flex-wrap gap-2">
                    {users.map(u => (
                      <button key={u.id} type="button" onClick={() => toggleMember(u.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                          memberIds.includes(u.id)
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : 'bg-gray-800 border-gray-700 text-gray-400'
                        }`}
                      >
                        {memberIds.includes(u.id) && <Check className="w-3 h-3" />}
                        {u.display_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button type="submit" disabled={saving}
                className="cursor-pointer w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-gray-950 font-bold py-3 rounded-xl transition-all"
              >
                {saving ? 'Criando…' : 'Criar Grupo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
