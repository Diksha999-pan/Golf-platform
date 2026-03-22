'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Heart, Trophy } from 'lucide-react'

const COLORS = ['#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#3b82f6']

export default function AdminAnalyticsPage() {
  const supabase = createClient()
  const [data, setData] = useState<any>({
    monthlyRevenue: [],
    charityBreakdown: [],
    drawStats: [],
    scoreDistribution: [],
    summary: { totalRevenue: 0, totalDonated: 0, totalUsers: 0, totalDraws: 0 },
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const [donations, subs, users, draws, scores, charities] = await Promise.all([
        supabase.from('charity_donations').select('amount, donated_at, charity_id'),
        supabase.from('subscriptions').select('plan, status, created_at'),
        supabase.from('users').select('id, created_at').eq('role', 'subscriber'),
        supabase.from('draws').select('*').eq('status', 'published'),
        supabase.from('scores').select('score'),
        supabase.from('charities').select('id, name'),
      ])

      // Monthly revenue (simulate from subscriptions)
      const monthlyMap: Record<string, number> = {}
      subs.data?.forEach((s: any) => {
        const m = new Date(s.created_at).toLocaleString('default', { month: 'short', year: '2-digit' })
        monthlyMap[m] = (monthlyMap[m] || 0) + (s.plan === 'yearly' ? 89.99 / 12 : 9.99)
      })
      const monthlyRevenue = Object.entries(monthlyMap).slice(-6).map(([month, revenue]) => ({ month, revenue: +revenue.toFixed(2) }))

      // Charity breakdown
      const charityMap: Record<string, { name: string; amount: number }> = {}
      charities.data?.forEach((c: any) => { charityMap[c.id] = { name: c.name, amount: 0 } })
      donations.data?.forEach((d: any) => {
        if (charityMap[d.charity_id]) charityMap[d.charity_id].amount += d.amount
      })
      const charityBreakdown = Object.values(charityMap).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount)

      // Score distribution (group into brackets)
      const brackets: Record<string, number> = { '1-9': 0, '10-19': 0, '20-29': 0, '30-39': 0, '40-45': 0 }
      scores.data?.forEach((s: any) => {
        if (s.score <= 9) brackets['1-9']++
        else if (s.score <= 19) brackets['10-19']++
        else if (s.score <= 29) brackets['20-29']++
        else if (s.score <= 39) brackets['30-39']++
        else brackets['40-45']++
      })
      const scoreDistribution = Object.entries(brackets).map(([range, count]) => ({ range, count }))

      const totalDonated = donations.data?.reduce((s: number, d: any) => s + d.amount, 0) || 0
      const totalRevenue = subs.data?.reduce((s: number, sub: any) => s + (sub.plan === 'yearly' ? 89.99 : 9.99), 0) || 0

      setData({
        monthlyRevenue,
        charityBreakdown,
        scoreDistribution,
        drawStats: draws.data || [],
        summary: {
          totalRevenue: +totalRevenue.toFixed(2),
          totalDonated: +totalDonated.toFixed(2),
          totalUsers: users.data?.length || 0,
          totalDraws: draws.data?.length || 0,
        },
      })
      setLoading(false)
    }
    fetch()
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-sm">
        <div className="text-white/50 mb-1">{label}</div>
        <div className="font-semibold text-white">
          {typeof payload[0].value === 'number' && payload[0].name === 'revenue'
            ? `£${payload[0].value.toFixed(2)}`
            : payload[0].value}
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Analytics</h1>
        <p className="text-white/40">Platform performance and impact metrics</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total revenue', value: `£${data.summary.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-brand-400' },
          { label: 'Total donated', value: `£${data.summary.totalDonated.toFixed(2)}`, icon: Heart, color: 'text-pink-400' },
          { label: 'Total subscribers', value: data.summary.totalUsers, icon: Users, color: 'text-gold-400' },
          { label: 'Draws completed', value: data.summary.totalDraws, icon: Trophy, color: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 font-medium uppercase tracking-wide">{s.label}</span>
              <s.icon size={14} className={s.color} />
            </div>
            <div className={`font-display text-2xl font-semibold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Monthly revenue chart */}
        <div className="card p-6">
          <h2 className="font-medium mb-5">Monthly revenue (£)</h2>
          {data.monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyRevenue} barCategoryGap="30%">
                <XAxis dataKey="month" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `£${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-white/20 text-sm">No revenue data yet</div>
          )}
        </div>

        {/* Score distribution */}
        <div className="card p-6">
          <h2 className="font-medium mb-5">Score distribution (Stableford)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.scoreDistribution} barCategoryGap="30%">
              <XAxis dataKey="range" stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis stroke="#ffffff30" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charity breakdown */}
      <div className="card p-6">
        <h2 className="font-medium mb-5">Charity donation breakdown</h2>
        {data.charityBreakdown.length === 0 ? (
          <div className="text-center py-8 text-white/20 text-sm">No donations yet</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.charityBreakdown} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                  {data.charityBreakdown.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: number) => `£${val.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {data.charityBreakdown.map((c: any, i: number) => (
                <div key={c.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-white/70">{c.name}</span>
                  </div>
                  <span className="text-sm font-semibold">£{c.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
