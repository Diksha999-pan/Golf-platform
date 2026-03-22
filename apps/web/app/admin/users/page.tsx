'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, Users } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('users')
        .select('*, subscriptions(plan, status, charity_percentage)')
        .order('created_at', { ascending: false })
      setUsers(data || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const filtered = users.filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'subscriber' : 'admin'
    if (!confirm(`Change role to ${newRole}?`)) return
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-1">Users</h1>
          <p className="text-white/40">{users.length} total users</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input type="text" placeholder="Search by name or email..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-10 max-w-sm" />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {['User', 'Role', 'Subscription', 'Charity %', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-6 py-3 text-xs text-white/40 font-medium uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-white/30">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-white/30">No users found</td></tr>
            ) : filtered.map((user: any) => {
              const sub = user.subscriptions?.[0]
              return (
                <tr key={user.id} className="table-row">
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm">{user.full_name || '—'}</div>
                    <div className="text-xs text-white/40">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${user.role === 'admin' ? 'badge-gold' : 'badge-gray'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {sub ? (
                      <span className={`badge ${sub.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                        {sub.plan} · {sub.status}
                      </span>
                    ) : <span className="badge badge-gray">None</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-400">
                    {sub?.charity_percentage || '—'}%
                  </td>
                  <td className="px-6 py-4 text-sm text-white/40">
                    {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleToggleRole(user.id, user.role)}
                      className="text-xs text-white/40 hover:text-white/80 transition-colors border border-white/10 px-2 py-1 rounded">
                      Toggle role
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
