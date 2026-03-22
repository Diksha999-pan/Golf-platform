'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { runDraw, generateRandom, generateWeighted } from '@/lib/draw-engine'
import toast from 'react-hot-toast'
import { Play, Eye, CheckCircle, Plus, Zap, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminDrawsPage() {
  const supabase = createClient()
  const [draws, setDraws] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [simulation, setSimulation] = useState<number[] | null>(null)
  const [logicType, setLogicType] = useState<'random' | 'weighted'>('random')
  const [newDrawDate, setNewDrawDate] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchDraws = async () => {
    const { data } = await supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(20)
    setDraws(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchDraws() }, [])

  const handleSimulate = async () => {
    if (logicType === 'random') {
      setSimulation(generateRandom())
    } else {
      // Fetch all scores for weighted mode
      const { data: scores } = await supabase.from('scores').select('score')
      const allScores = scores?.map((s: any) => s.score) || []
      setSimulation(generateWeighted(allScores))
    }
    toast.success('Simulation generated — not published yet')
  }

  const handleCreateDraw = async () => {
    if (!newDrawDate) { toast.error('Pick a draw date'); return }
    setCreating(true)
    const { error } = await supabase.from('draws').insert({
      status: 'pending',
      logic_type: logicType,
      draw_date: newDrawDate,
      winning_numbers: null,
    })
    if (error) { toast.error(error.message); setCreating(false); return }
    toast.success('Draw created!')
    setNewDrawDate('')
    fetchDraws()
    setCreating(false)
  }

  const handleRunDraw = async (drawId: string) => {
    if (!confirm('Run this draw and publish results? This cannot be undone.')) return
    setRunning(true)
    try {
      // Fetch all active subscriber scores
      const { data: entries } = await supabase
        .from('scores')
        .select('user_id, score')

      // Group by user
      const userScores: Record<string, number[]> = {}
      entries?.forEach((e: any) => {
        if (!userScores[e.user_id]) userScores[e.user_id] = []
        userScores[e.user_id].push(e.score)
      })
      const allEntries = Object.entries(userScores).map(([userId, scores]) => ({ userId, scores }))
      const allScores = entries?.map((e: any) => e.score) || []

      // Fetch current prize pool rollover
      const { data: poolData } = await supabase.from('prize_pools').select('*').eq('draw_id', drawId).single()
      const rollover = poolData?.rollover_amount || 0

      // Run draw
      const result = runDraw(allEntries, 100, rollover, logicType, allScores)

      // Update draw record
      await supabase.from('draws').update({
        status: 'published',
        winning_numbers: result.winningNumbers,
        published_at: new Date().toISOString(),
      }).eq('id', drawId)

      // Insert prize pool
      await supabase.from('prize_pools').upsert({
        draw_id: drawId,
        total_amount: result.pool.total,
        jackpot_percentage: 40,
        four_match_percentage: 35,
        three_match_percentage: 25,
        rollover_amount: result.hasJackpotWinner ? 0 : result.pool.jackpot,
      })

      // Insert winners
      const winnerInserts = result.winners
        .filter(w => w.tier !== null)
        .map(w => ({
          draw_id: drawId,
          user_id: w.userId,
          match_count: w.matchCount,
          matched_numbers: w.matchedNumbers,
          prize_amount: w.prizeAmount,
          payment_status: 'pending',
        }))

      if (winnerInserts.length > 0) {
        await supabase.from('winners').insert(winnerInserts)
      }

      toast.success(`Draw complete! ${winnerInserts.length} winner(s) found.`)
      fetchDraws()
    } catch (err: any) {
      toast.error(err.message || 'Draw failed')
    } finally {
      setRunning(false)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'published') return <span className="badge badge-green">Published</span>
    if (status === 'pending') return <span className="badge badge-gold">Pending</span>
    return <span className="badge badge-gray">{status}</span>
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Draw Engine</h1>
        <p className="text-white/40">Configure, simulate, and publish monthly draws</p>
      </div>

      {/* Create new draw */}
      <div className="card p-6 mb-8">
        <h2 className="font-medium mb-5">Create new draw</h2>
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="label">Draw date</label>
            <input type="date" value={newDrawDate}
              onChange={e => setNewDrawDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="input w-48" />
          </div>
          <div>
            <label className="label">Draw logic</label>
            <select value={logicType} onChange={e => setLogicType(e.target.value as any)} className="input w-44">
              <option value="random">Random</option>
              <option value="weighted">Weighted algorithm</option>
            </select>
          </div>
          <button onClick={handleCreateDraw} disabled={creating} className="btn-primary">
            <Plus size={16} /> {creating ? 'Creating...' : 'Create draw'}
          </button>
        </div>
      </div>

      {/* Simulation */}
      <div className="card p-6 mb-8 border-purple-500/20 bg-purple-500/5">
        <h2 className="font-medium mb-2 flex items-center gap-2">
          <Zap size={16} className="text-purple-400" /> Simulation mode
        </h2>
        <p className="text-sm text-white/40 mb-4">Generate a sample draw without publishing. Test the algorithm before going live.</p>
        <div className="flex items-center gap-4">
          <button onClick={handleSimulate} className="btn-secondary">
            <RefreshCw size={14} /> Run simulation
          </button>
          {simulation && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/40">Simulated numbers:</span>
              <div className="flex gap-1.5">
                {simulation.map(n => (
                  <span key={n} className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-bold flex items-center justify-center">{n}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Draws list */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-medium">All draws</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">No draws yet</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Draw date', 'Logic', 'Status', 'Winning numbers', 'Actions'].map(h => (
                  <th key={h} className="text-left px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {draws.map((draw: any) => (
                <tr key={draw.id} className="table-row">
                  <td className="px-6 py-4 text-sm">{format(new Date(draw.draw_date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4 text-sm text-white/60 capitalize">{draw.logic_type}</td>
                  <td className="px-6 py-4">{statusBadge(draw.status)}</td>
                  <td className="px-6 py-4">
                    {draw.winning_numbers ? (
                      <div className="flex gap-1">
                        {draw.winning_numbers.map((n: number) => (
                          <span key={n} className="w-7 h-7 rounded-full bg-gold-500/20 text-gold-300 text-xs font-bold flex items-center justify-center">{n}</span>
                        ))}
                      </div>
                    ) : <span className="text-white/20 text-sm">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {draw.status === 'pending' && (
                      <button onClick={() => handleRunDraw(draw.id)} disabled={running}
                        className="btn-primary py-1.5 px-3 text-xs">
                        <Play size={12} /> {running ? 'Running...' : 'Run draw'}
                      </button>
                    )}
                    {draw.status === 'published' && (
                      <span className="text-brand-400 text-sm flex items-center gap-1">
                        <CheckCircle size={12} /> Published
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
