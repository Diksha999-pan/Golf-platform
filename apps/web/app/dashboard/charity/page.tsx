'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Heart, Search, ExternalLink, Check } from 'lucide-react'

export default function CharityPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<any[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [charityPct, setCharityPct] = useState(10)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [charitiesRes, selectionRes, subRes] = await Promise.all([
        supabase.from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false }),
        supabase.from('charity_selections').select('charity_id').eq('user_id', user.id).single(),
        supabase.from('subscriptions').select('charity_percentage').eq('user_id', user.id).eq('status', 'active').single(),
      ])

      setCharities(charitiesRes.data || [])
      setSelected(selectionRes.data?.charity_id || null)
      setCharityPct(subRes.data?.charity_percentage || 10)
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      // Upsert charity selection
      const { error: selErr } = await supabase.from('charity_selections').upsert({
        user_id: user.id,
        charity_id: selected,
        selected_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (selErr) throw selErr

      // Update charity percentage on subscription
      const { error: subErr } = await supabase.from('subscriptions')
        .update({ charity_percentage: charityPct })
        .eq('user_id', user.id)
        .eq('status', 'active')
      if (subErr) throw subErr

      toast.success('Charity preferences saved!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Charity</h1>
        <p className="text-white/40">Choose where your contribution goes each month</p>
      </div>

      {/* Contribution slider */}
      <div className="card p-6 mb-8">
        <h2 className="font-medium mb-4">Your contribution</h2>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Monthly charity donation</span>
              <span className="font-display text-2xl font-semibold text-brand-400">{charityPct}%</span>
            </div>
            <input
              type="range" min={10} max={50} step={5}
              value={charityPct}
              onChange={e => setCharityPct(Number(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>10% (minimum)</span><span>50%</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-white/30 mt-3">
          You can increase your charity percentage at any time. The minimum is 10% of your subscription fee.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          type="text"
          placeholder="Search charities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Charity grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {filtered.map(charity => (
            <button
              key={charity.id}
              onClick={() => setSelected(charity.id)}
              className={`card p-5 text-left transition-all border ${
                selected === charity.id
                  ? 'border-brand-500/60 bg-brand-500/8'
                  : 'border-transparent hover:border-white/15'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  selected === charity.id ? 'bg-brand-500' : 'bg-white/8'
                }`}>
                  {selected === charity.id
                    ? <Check size={16} className="text-white" />
                    : <Heart size={16} className="text-white/40" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{charity.name}</span>
                    {charity.is_featured && <span className="badge badge-gold text-xs">Featured</span>}
                  </div>
                  <p className="text-xs text-white/40 line-clamp-2">{charity.description}</p>
                  {charity.website_url && (
                    <a href={charity.website_url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-xs text-brand-400 hover:text-brand-300 mt-2 flex items-center gap-1">
                      Visit website <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving || !selected} className="btn-primary px-8">
          {saving ? 'Saving...' : 'Save preferences'}
        </button>
      </div>
    </div>
  )
}
