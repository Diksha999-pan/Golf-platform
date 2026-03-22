'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, Trophy, Heart, DollarSign, TrendingUp, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminPage() {
  const supabase = createClient()
  const [stats, setStats] = useState({
    totalUsers: 0, activeSubscribers: 0,
    totalPrizePool: 0, totalDonated: 0,
    pendingVerifications: 0, upcomingDraw: null as any,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [users, subs, winners, donations, pendingWinners, draws] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('winners').select('prize_amount'),
        supabase.from('charity_donations').select('amount'),
        supabase.from('winner_proofs').select('id', { count: 'exact' }).eq('admin_status', 'pending'),
        supabase.from('draws').select('*').eq('status', 'pending').order('draw_date').limit(1).single(),
      ])

      const totalPrize = winners.data?.reduce((s: number, w: any) => s + (w.prize_amount || 0), 0) || 0
      const totalDonated = donations.data?.reduce((s: number, d: any) => s + (d.amount || 0), 0) || 0

      setStats({
        totalUsers: users.count || 0,
        activeSubscribers: subs.count || 0,
        totalPrizePool: totalPrize,
        totalDonated,
        pendingVerifications: pendingWinners.count || 0,
        upcomingDraw: draws.data,
      })
      setLoading(false)
    }
    fetch()
  }, [])

  const statCards = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, color: 'text-brand-400', href: '/admin/users' },
    { label: 'Active subscribers', value: stats.activeSubscribers, icon: TrendingUp, color: 'text-gold-400', href: '/admin/users' },
    { label: 'Total prize paid', value: `£${stats.totalPrizePool.toFixed(2)}`, icon: Trophy, color: 'text-purple-400', href: '/admin/winners' },
    { label: 'Total donated', value: `£${stats.totalDonated.toFixed(2)}`, icon: Heart, color: 'text-pink-400', href: '/admin/charities' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Admin Overview</h1>
        <p className="text-white/40">Platform health and quick actions</p>
      </div>

      {/* Alert for pending verifications */}
      {stats.pendingVerifications > 0 && (
        <Link href="/admin/winners" className="flex items-center gap-3 p-4 bg-gold-500/8 border border-gold-500/30 rounded-xl mb-6 hover:bg-gold-500/12 transition-colors">
          <AlertCircle size={18} className="text-gold-400 flex-shrink-0" />
          <div>
            <div className="font-medium text-gold-400">Action required</div>
            <div className="text-sm text-white/60">{stats.pendingVerifications} winner proof{stats.pendingVerifications > 1 ? 's' : ''} awaiting review</div>
          </div>
          <span className="ml-auto badge badge-gold">{stats.pendingVerifications}</span>
        </Link>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <Link key={s.label} href={s.href} className="stat-card hover:border-white/15 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{s.label}</span>
              <s.icon size={14} className={s.color} />
            </div>
            <div className={`font-display text-2xl font-semibold ${s.color}`}>{loading ? '…' : s.value}</div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-medium mb-4">Draw management</h2>
          {stats.upcomingDraw ? (
            <div className="space-y-3">
              <div className="p-4 bg-brand-500/8 border border-brand-500/20 rounded-xl">
                <div className="text-sm text-white/60 mb-1">Next draw scheduled</div>
                <div className="font-medium">{new Date(stats.upcomingDraw.draw_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
              <Link href="/admin/draws" className="btn-primary w-full justify-center">Manage draw</Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-white/40 text-sm">No upcoming draw scheduled.</p>
              <Link href="/admin/draws" className="btn-primary w-full justify-center">Create draw</Link>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-medium mb-4">Quick links</h2>
          <div className="space-y-2">
            {[
              { label: 'Review winner proofs', href: '/admin/winners', badge: stats.pendingVerifications },
              { label: 'Manage charities', href: '/admin/charities' },
              { label: 'View all users', href: '/admin/users' },
              { label: 'Analytics report', href: '/admin/analytics' },
            ].map(link => (
              <Link key={link.href} href={link.href}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/3 hover:bg-white/6 transition-colors text-sm">
                <span className="text-white/70">{link.label}</span>
                {link.badge ? <span className="badge badge-gold">{link.badge}</span> : null}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
