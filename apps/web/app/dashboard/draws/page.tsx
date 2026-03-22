'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Trophy, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'

export default function DrawsPage() {
  const supabase = createClient()
  const [draws, setDraws] = useState<any[]>([])
  const [winners, setWinners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [drawsRes, winnersRes] = await Promise.all([
        supabase.from('draws').select('*').order('draw_date', { ascending: false }).limit(12),
        supabase.from('winners').select('*, draw:draws(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
      ])

      setDraws(drawsRes.data || [])
      setWinners(winnersRes.data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const totalWon = winners.reduce((s, w) => s + (w.prize_amount || 0), 0)

  const statusIcon = (status: string) => {
    if (status === 'published') return <CheckCircle size={14} className="text-brand-400" />
    if (status === 'pending') return <Clock size={14} className="text-gold-400" />
    return <Clock size={14} className="text-white/30" />
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Draws</h1>
        <p className="text-white/40">Monthly prize draws — your scores are your ticket</p>
      </div>

      {/* Winnings summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total winnings', value: `£${totalWon.toFixed(2)}`, color: 'text-gold-400' },
          { label: 'Draws won', value: winners.length, color: 'text-brand-400' },
          { label: 'Draws entered', value: draws.length, color: 'text-white' },
        ].map(s => (
          <div key={s.label} className="stat-card text-center">
            <div className={`font-display text-2xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-white/40 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* My wins */}
      {winners.length > 0 && (
        <div className="card p-6 mb-6 border-gold-500/20 bg-gold-500/5">
          <h2 className="font-medium mb-4 flex items-center gap-2">
            <Trophy size={16} className="text-gold-400" /> My winnings
          </h2>
          <div className="space-y-3">
            {winners.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div>
                  <div className="font-medium">{w.match_count}-number match</div>
                  <div className="text-sm text-white/40">{w.draw ? format(new Date(w.draw.draw_date), 'MMMM yyyy') : '—'}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-semibold text-gold-400">£{w.prize_amount?.toFixed(2)}</div>
                  <div className={`text-xs mt-0.5 ${
                    w.payment_status === 'paid' ? 'text-brand-400' :
                    w.payment_status === 'pending' ? 'text-gold-400' : 'text-red-400'
                  }`}>{w.payment_status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All draws */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-medium">Draw history</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : draws.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <Trophy size={32} className="mx-auto mb-3" />
            <p>No draws yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">Draw date</th>
                <th className="text-left px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">Status</th>
                <th className="text-left px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">Winning numbers</th>
                <th className="text-right px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">My result</th>
              </tr>
            </thead>
            <tbody>
              {draws.map((draw: any) => {
                const myWin = winners.find(w => w.draw_id === draw.id)
                return (
                  <tr key={draw.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-white/30" />
                        <span className="text-sm">{format(new Date(draw.draw_date), 'dd MMM yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(draw.status)}
                        <span className="text-sm capitalize text-white/60">{draw.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {draw.winning_numbers ? (
                        <div className="flex gap-1.5">
                          {draw.winning_numbers.map((n: number) => (
                            <span key={n} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                              ${myWin?.matched_numbers?.includes(n)
                                ? 'bg-gold-500 text-dark-900'
                                : 'bg-white/8 text-white/60'}`}>
                              {n}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/20 text-sm">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {myWin ? (
                        <span className="badge badge-gold">{myWin.match_count} match · £{myWin.prize_amount?.toFixed(2)}</span>
                      ) : draw.status === 'published' ? (
                        <span className="badge badge-gray">No match</span>
                      ) : (
                        <span className="text-white/20 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
