'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Heart, ExternalLink, Search, Star } from 'lucide-react'
import Link from 'next/link'

export default function CharitiesPublicPage() {
  const supabase = createClient()
  const [charities, setCharities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase.from('charities').select('*').eq('is_active', true)
      .order('is_featured', { ascending: false })
      .then(({ data }) => { setCharities(data || []); setLoading(false) })
  }, [])

  const filtered = charities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  const featured = filtered.filter(c => c.is_featured)
  const rest = filtered.filter(c => !c.is_featured)

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto border-b border-white/5">
        <Link href="/" className="font-display text-2xl font-semibold">
          Golf<span className="text-brand-400">Gives</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-secondary py-2 px-4 text-sm">Sign in</Link>
          <Link href="/auth/signup" className="btn-primary py-2 px-4 text-sm">Get started</Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-5xl font-semibold mb-4">
            Charities we <span className="gradient-text">support</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            Every subscription contributes to the charities on this page. You choose where your impact goes.
          </p>
        </div>

        <div className="relative mb-8 max-w-sm mx-auto">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search charities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {featured.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={14} className="text-gold-400" />
                  <span className="text-sm font-medium text-gold-400 uppercase tracking-wide">Featured this month</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {featured.map(c => (
                    <div key={c.id} className="card-hover p-6 border border-gold-500/20 bg-gold-500/5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                          <Heart size={20} className="text-brand-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{c.name}</h3>
                            <span className="badge badge-gold text-xs">Featured</span>
                          </div>
                          <p className="text-sm text-white/50 mb-3 leading-relaxed">{c.description}</p>
                          {c.website_url && (
                            <a href={c.website_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                              Visit website <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rest.length > 0 && (
              <div>
                <div className="text-sm font-medium text-white/40 uppercase tracking-wide mb-4">All charities</div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rest.map(c => (
                    <div key={c.id} className="card-hover p-5">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                        <Heart size={16} className="text-white/30" />
                      </div>
                      <h3 className="font-medium mb-1">{c.name}</h3>
                      <p className="text-sm text-white/40 mb-3 line-clamp-2">{c.description}</p>
                      {c.website_url && (
                        <a href={c.website_url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                          Learn more <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-white/30">
                <Heart size={32} className="mx-auto mb-3" />
                <p>No charities match your search</p>
              </div>
            )}
          </>
        )}

        <div className="text-center mt-16 p-8 card border-brand-500/20">
          <h2 className="font-display text-2xl font-medium mb-3">Ready to make an impact?</h2>
          <p className="text-white/40 mb-6">Subscribe from £9.99/month and choose your charity today.</p>
          <Link href="/auth/signup" className="btn-gold px-8 py-3">Get started</Link>
        </div>
      </div>
    </main>
  )
}
