'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Heart, Plus, Edit2, Trash2, Star } from 'lucide-react'

export default function AdminCharitiesPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', website_url: '', image_url: '', is_featured: false })

  const fetchCharities = async () => {
    const { data } = await supabase.from('charities').select('*').order('is_featured', { ascending: false })
    setCharities(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCharities() }, [])

  const resetForm = () => {
    setForm({ name: '', description: '', website_url: '', image_url: '', is_featured: false })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (charity: any) => {
    setForm({ name: charity.name, description: charity.description, website_url: charity.website_url || '', image_url: charity.image_url || '', is_featured: charity.is_featured })
    setEditingId(charity.id)
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        const { error } = await supabase.from('charities').update({ ...form }).eq('id', editingId)
        if (error) throw error
        toast.success('Charity updated!')
      } else {
        const { error } = await supabase.from('charities').insert({ ...form, is_active: true })
        if (error) throw error
        toast.success('Charity added!')
      }
      resetForm()
      fetchCharities()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this charity?')) return
    await supabase.from('charities').delete().eq('id', id)
    toast.success('Charity deleted')
    fetchCharities()
  }

  const handleToggleFeatured = async (id: string, current: boolean) => {
    await supabase.from('charities').update({ is_featured: !current }).eq('id', id)
    fetchCharities()
  }

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase.from('charities').update({ is_active: !current }).eq('id', id)
    fetchCharities()
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold mb-1">Charities</h1>
          <p className="text-white/40">Manage charity listings and featured spotlights</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="btn-primary">
          <Plus size={16} /> Add charity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-8 border-brand-500/20">
          <h2 className="font-medium mb-5">{editingId ? 'Edit charity' : 'Add new charity'}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Charity name</label>
                <input type="text" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="input" placeholder="Cancer Research UK" />
              </div>
              <div>
                <label className="label">Website URL</label>
                <input type="url" value={form.website_url}
                  onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                  className="input" placeholder="https://example.org" />
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea rows={3} required value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="input" placeholder="Describe the charity and its mission..." />
            </div>
            <div>
              <label className="label">Image URL</label>
              <input type="url" value={form.image_url}
                onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                className="input" placeholder="https://example.org/logo.png" />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_featured}
                onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
                className="w-4 h-4 accent-brand-500" />
              <span className="text-sm text-white/70">Feature this charity on homepage</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : editingId ? 'Update charity' : 'Add charity'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Charities list */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : charities.length === 0 ? (
          <div className="card p-12 text-center">
            <Heart size={32} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No charities added yet</p>
          </div>
        ) : charities.map((charity: any) => (
          <div key={charity.id} className={`card p-5 flex items-center gap-4 ${!charity.is_active ? 'opacity-50' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center flex-shrink-0">
              <Heart size={16} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-medium">{charity.name}</span>
                {charity.is_featured && <Star size={12} className="text-gold-400" fill="currentColor" />}
                {!charity.is_active && <span className="badge badge-gray text-xs">Inactive</span>}
              </div>
              <p className="text-sm text-white/40 truncate">{charity.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => handleToggleFeatured(charity.id, charity.is_featured)}
                className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                  charity.is_featured
                    ? 'border-gold-500/40 text-gold-400 bg-gold-500/10'
                    : 'border-white/10 text-white/40 hover:text-white/60'
                }`}>
                {charity.is_featured ? 'Featured' : 'Set featured'}
              </button>
              <button onClick={() => handleToggleActive(charity.id, charity.is_active)}
                className="text-xs px-2.5 py-1 rounded border border-white/10 text-white/40 hover:text-white/60 transition-colors">
                {charity.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => handleEdit(charity)} className="p-1.5 text-white/30 hover:text-white/70 transition-colors">
                <Edit2 size={14} />
              </button>
              <button onClick={() => handleDelete(charity.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
