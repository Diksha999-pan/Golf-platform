'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Trash2, TrendingUp, Info } from 'lucide-react'
import { format } from 'date-fns'

interface Score {
  id: string
  score: number
  played_on: string
  created_at: string
}

export default function ScoresPage() {
  const supabase = createClient()
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ score: '', played_on: '' })
  const [showForm, setShowForm] = useState(false)

  const fetchScores = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', user.id)
      .order('played_on', { ascending: false })
      .limit(5)
    setScores(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchScores() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const scoreNum = parseInt(form.score)
    if (scoreNum < 1 || scoreNum > 45) {
      toast.error('Score must be between 1 and 45 (Stableford)')
      return
    }
    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // If already 5 scores, delete the oldest
      if (scores.length >= 5) {
        const oldest = scores[scores.length - 1]
        await supabase.from('scores').delete().eq('id', oldest.id)
      }

      const { error } = await supabase.from('scores').insert({
        user_id: user.id,
        score: scoreNum,
        played_on: form.played_on,
      })
      if (error) throw error

      toast.success('Score added!')
      setForm({ score: '', played_on: '' })
      setShowForm(false)
      fetchScores()
    } catch (err: any) {
      toast.error(err.message || 'Failed to add score')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('scores').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    toast.success('Score removed')
    fetchScores()
  }

  const avg = scores.length
    ? (scores.reduce((s, sc) => s + sc.score, 0) / scores.length).toFixed(1)
    : '—'
  const best = scores.length ? Math.max(...scores.map(s => s.score)) : '—'

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-1">My Scores</h1>
          <p className="text-white/40">Your last 5 Stableford scores — your draw ticket</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="btn-primary">
          <Plus size={16} /> Add Score
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-brand-500/8 border border-brand-500/20 rounded-xl mb-6">
        <Info size={16} className="text-brand-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-white/60">
          Only your <strong className="text-white">latest 5 scores</strong> are kept. Adding a new score automatically removes the oldest.
          Scores must be in Stableford format (1–45). Minimum 3 scores needed to enter a draw.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Scores logged', value: `${scores.length}/5` },
          { label: 'Average', value: avg },
          { label: 'Best score', value: best },
        ].map(s => (
          <div key={s.label} className="stat-card text-center">
            <div className="font-display text-2xl font-semibold text-brand-400">{s.value}</div>
            <div className="text-xs text-white/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add score form */}
      {showForm && (
        <div className="card p-6 mb-6 border-brand-500/20">
          <h3 className="font-medium mb-4">Add new score</h3>
          <form onSubmit={handleAdd} className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Stableford score (1–45)</label>
              <input type="number" min={1} max={45} required
                value={form.score}
                onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                className="input" placeholder="e.g. 32" />
            </div>
            <div className="flex-1">
              <label className="label">Date played</label>
              <input type="date" required
                max={new Date().toISOString().split('T')[0]}
                value={form.played_on}
                onChange={e => setForm(f => ({ ...f, played_on: e.target.value }))}
                className="input" />
            </div>
            <button type="submit" disabled={adding} className="btn-primary py-3 px-5 whitespace-nowrap">
              {adding ? 'Adding...' : 'Add score'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="btn-secondary py-3 px-4">Cancel</button>
          </form>
        </div>
      )}

      {/* Scores list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : scores.length === 0 ? (
        <div className="card p-12 text-center">
          <TrendingUp size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 mb-4">No scores yet. Add your first round to get started.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus size={16} /> Add your first score
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Score bars visualization */}
          <div className="p-6 border-b border-white/5">
            <div className="flex items-end gap-2 h-24">
              {scores.map((score, i) => (
                <div key={score.id} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-white/50 font-medium">{score.score}</div>
                  <div
                    className="w-full rounded-t-md bg-brand-500/60 hover:bg-brand-500 transition-colors"
                    style={{ height: `${(score.score / 45) * 80}px` }}
                  />
                </div>
              ))}
              {Array.from({ length: 5 - scores.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-white/20">—</div>
                  <div className="w-full h-4 rounded-t-md border border-dashed border-white/10" />
                </div>
              ))}
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">Slot</th>
                <th className="text-left px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">Date played</th>
                <th className="text-left px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">Stableford score</th>
                <th className="text-right px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((score, i) => (
                <tr key={score.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-500/15 text-brand-400 text-xs flex items-center justify-center font-medium">{i + 1}</div>
                      {i === 0 && <span className="badge badge-green text-xs">Latest</span>}
                      {i === scores.length - 1 && scores.length === 5 && (
                        <span className="badge badge-gray text-xs">Next to drop</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white/60 text-sm">{format(new Date(score.played_on), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <span className="font-display text-xl font-semibold">{score.score}</span>
                    <span className="text-white/30 text-sm ml-1">pts</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(score.id)}
                      className="text-white/20 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
