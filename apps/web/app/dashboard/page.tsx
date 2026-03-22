'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Trophy, Heart, TrendingUp, CreditCard, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface DashboardData {
  user: any
  subscription: any
  scores: any[]
  charitySelection: any
  upcomingDraw: any
  winnings: any[]
}

export default function DashboardPage() {
  const supabase = createClient()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profile, sub, scores, charity, draws, winners] = await Promise.all([
        supabase.from('users').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').single(),
        supabase.from('scores').select('*').eq('user_id', user.id).order('played_on', { ascending: false }).limit(5),
        supabase.from('charity_selections').select('*, charity:charities(*)').eq('user_id', user.id).single(),
        supabase.from('draws').select('*').eq('status', 'pending').order('draw_date').limit(1).single(),
        supabase.from('winners').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ])

      setData({
        user: profile.data,
        subscription: sub.data,
        scores: scores.data || [],
        charitySelection: charity.data,
        upcomingDraw: draws.data,
        winnings: winners.data || [],
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  const totalWon = data?.winnings.reduce((sum, w) => sum + (w.prize_amount || 0), 0) || 0

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">
          Good day, {data?.user?.full_name?.split(' ')[0] || 'Golfer'} 👋
        </h1>
        <p className="text-white/40">Here's your GolfGives overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Subscription',
            value: data?.subscription ? 'Active' : 'Inactive',
            sub: data?.subscription?.plan || 'No plan',
            icon: CreditCard,
            color: data?.subscription ? 'text-brand-400' : 'text-red-400',
            badge: data?.subscription ? 'badge-green' : 'badge-red',
          },
          {
            label: 'Scores logged',
            value: data?.scores.length || 0,
            sub: 'of 5 slots',
            icon: TrendingUp,
            color: 'text-gold-400',
          },
          {
            label: 'Total winnings',
            value: `£${totalWon.toFixed(2)}`,
            sub: `${data?.winnings.length} draws won`,
            icon: Trophy,
            color: 'text-gold-400',
          },
          {
            label: 'Charity',
            value: (data?.charitySelection as any)?.charity?.name?.split(' ')[0] || 'None',
            sub: `${data?.subscription?.charity_percentage || 10}% of subscription`,
            icon: Heart,
            color: 'text-pink-400',
          },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{stat.label}</span>
              <stat.icon size={14} className={stat.color} />
            </div>
            <div className={`font-display text-2xl font-semibold ${stat.color} mb-0.5`}>{stat.value}</div>
            <div className="text-xs text-white/30">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent scores */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-medium">Recent scores</h2>
            <Link href="/dashboard/scores" className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
              Manage <ChevronRight size={12} />
            </Link>
          </div>
          {data?.scores.length === 0 ? (
            <div className="text-center py-8 text-white/30">
              <TrendingUp size={24} className="mx-auto mb-2" />
              <p className="text-sm">No scores yet</p>
              <Link href="/dashboard/scores" className="text-brand-400 text-sm hover:underline">Add your first score</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.scores.map((score: any, i: number) => (
                <div key={score.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-500/15 flex items-center justify-center text-xs text-brand-400 font-medium">{i + 1}</div>
                    <div className="text-sm text-white/60">{format(new Date(score.played_on), 'dd MMM yyyy')}</div>
                  </div>
                  <div className="font-display text-lg font-semibold text-white">{score.score} <span className="text-xs text-white/30 font-sans font-normal">pts</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming draw */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-medium">Next draw</h2>
            <Link href="/dashboard/draws" className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          {data?.upcomingDraw ? (
            <div className="space-y-4">
              <div className="p-4 bg-gold-500/8 border border-gold-500/20 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-gold-400" />
                  <span className="text-sm text-gold-400 font-medium">
                    {format(new Date(data.upcomingDraw.draw_date), 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="text-white/60 text-sm">
                  {data.scores.length >= 3
                    ? '✓ You are entered in this draw'
                    : `⚠ Add ${3 - data.scores.length} more scores to enter`}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: '5 match', amount: '40%', color: 'text-gold-400' },
                  { label: '4 match', amount: '35%', color: 'text-brand-400' },
                  { label: '3 match', amount: '25%', color: 'text-white/60' },
                ].map(t => (
                  <div key={t.label} className="bg-white/3 rounded-lg p-3">
                    <div className={`font-semibold ${t.color}`}>{t.amount}</div>
                    <div className="text-xs text-white/30 mt-0.5">{t.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/30">
              <Trophy size={24} className="mx-auto mb-2" />
              <p className="text-sm">No upcoming draws</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
