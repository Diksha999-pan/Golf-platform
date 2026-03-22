'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Save } from 'lucide-react'

export default function ProfilePage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '' })
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      setForm({ full_name: data?.full_name || '', email: data?.email || user.email || '' })
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from('users')
      .update({ full_name: form.full_name })
      .eq('id', user.id)

    if (error) toast.error(error.message)
    else toast.success('Profile updated!')
    setSaving(false)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) { toast.error('Min. 8 characters'); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else { toast.success('Password updated!'); setNewPassword('') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Profile</h1>
        <p className="text-white/40">Manage your account details</p>
      </div>

      {/* Profile form */}
      <div className="card p-6 mb-6">
        <h2 className="font-medium mb-5 flex items-center gap-2">
          <User size={16} className="text-white/40" /> Personal info
        </h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input type="text" value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="input" placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="email" value={form.email} disabled
                className="input pl-10 opacity-50 cursor-not-allowed" />
            </div>
            <p className="text-xs text-white/30 mt-1">Email cannot be changed</p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>

      {/* Password form */}
      <div className="card p-6">
        <h2 className="font-medium mb-5 flex items-center gap-2">
          <Lock size={16} className="text-white/40" /> Change password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="label">New password</label>
            <input type="password" minLength={8} value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="input" placeholder="Min. 8 characters" />
          </div>
          <button type="submit" className="btn-secondary">Update password</button>
        </form>
      </div>
    </div>
  )
}
