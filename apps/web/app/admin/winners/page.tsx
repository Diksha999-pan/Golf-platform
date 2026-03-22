'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, ExternalLink, Award } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminWinnersPage() {
  const supabase = createClient()
  const [winners, setWinners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all')

  const fetchWinners = async () => {
    const { data } = await supabase
      .from('winners')
      .select('*, user:users(full_name, email), draw:draws(draw_date), proof:winner_proofs(*)')
      .order('created_at', { ascending: false })
    setWinners(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchWinners() }, [])

  const handleVerify = async (winnerId: string, proofId: string, approve: boolean) => {
    const adminStatus = approve ? 'approved' : 'rejected'
    const paymentStatus = approve ? 'paid' : 'rejected'

    await supabase.from('winner_proofs').update({
      admin_status: adminStatus,
      reviewed_at: new Date().toISOString(),
    }).eq('id', proofId)

    if (approve) {
      await supabase.from('winners').update({ payment_status: paymentStatus }).eq('id', winnerId)
    }

    toast.success(approve ? 'Winner approved and marked as paid!' : 'Submission rejected')
    fetchWinners()
  }

  const handleMarkPaid = async (winnerId: string) => {
    await supabase.from('winners').update({ payment_status: 'paid' }).eq('id', winnerId)
    toast.success('Marked as paid')
    fetchWinners()
  }

  const filtered = winners.filter(w => {
    if (filter === 'pending') return w.payment_status === 'pending'
    if (filter === 'paid') return w.payment_status === 'paid'
    return true
  })

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Winners</h1>
        <p className="text-white/40">Verify submissions and manage payouts</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'paid'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === f
                ? 'bg-brand-500/20 border border-brand-500/40 text-brand-400'
                : 'bg-white/5 text-white/40 hover:text-white/60'
            }`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Award size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No winners found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((winner: any) => {
            const proof = winner.proof?.[0]
            return (
              <div key={winner.id} className="card p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-medium">{winner.user?.full_name || 'Unknown'}</div>
                      <span className="text-white/40 text-sm">{winner.user?.email}</span>
                      <span className={`badge ${
                        winner.payment_status === 'paid' ? 'badge-green' :
                        winner.payment_status === 'pending' ? 'badge-gold' : 'badge-red'
                      }`}>{winner.payment_status}</span>
                    </div>
                    <div className="text-sm text-white/50 space-x-4">
                      <span>Draw: {winner.draw?.draw_date ? format(new Date(winner.draw.draw_date), 'MMMM yyyy') : '—'}</span>
                      <span>Match: <strong className="text-white">{winner.match_count} numbers</strong></span>
                      <span>Prize: <strong className="text-gold-400">£{winner.prize_amount?.toFixed(2)}</strong></span>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {winner.matched_numbers?.map((n: number) => (
                        <span key={n} className="w-7 h-7 rounded-full bg-gold-500/20 text-gold-300 text-xs font-bold flex items-center justify-center">{n}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {proof ? (
                      <>
                        <a href={proof.file_url} target="_blank" rel="noopener noreferrer"
                          className="btn-secondary py-1.5 px-3 text-xs">
                          <ExternalLink size={12} /> View proof
                        </a>
                        {proof.admin_status === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleVerify(winner.id, proof.id, true)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-brand-500/15 border border-brand-500/30 text-brand-400 rounded-lg text-xs hover:bg-brand-500/25 transition-colors">
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button onClick={() => handleVerify(winner.id, proof.id, false)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        )}
                        {proof.admin_status !== 'pending' && (
                          <span className={`badge text-xs ${proof.admin_status === 'approved' ? 'badge-green' : 'badge-red'}`}>
                            Proof {proof.admin_status}
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2 text-right">
                        <span className="badge badge-gray text-xs">No proof uploaded</span>
                        {winner.payment_status === 'pending' && (
                          <button onClick={() => handleMarkPaid(winner.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-brand-500/15 border border-brand-500/30 text-brand-400 rounded-lg text-xs hover:bg-brand-500/25 transition-colors">
                            <CheckCircle size={12} /> Mark as paid
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
