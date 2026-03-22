'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Check, ChevronRight } from 'lucide-react'

const STEPS = ['Account', 'Choose Plan', 'Charity']

const PLANS = {
  monthly: { name: 'Monthly', price: 9.99, interval: 'month', description: 'Pay month to month, cancel anytime' },
  yearly: { name: 'Yearly', price: 89.99, interval: 'year', description: 'Save 25% with annual billing' },
}

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [charities, setCharities] = useState<any[]>([])
  const [form, setForm] = useState({
    email: '', password: '', fullName: '',
    plan: 'monthly' as 'monthly' | 'yearly',
    charityId: '', charityPct: 10,
  })

  useEffect(() => {
    supabase.from('charities').select('id, name').eq('is_active', true)
      .then(({ data }) => setCharities(data || []))
  }, [])

  const handleAccountStep = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Check if user already exists
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      })
      if (error) throw error
      if (!data.user) throw new Error('Signup failed')
      setStep(1)
    } catch (err: any) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePlanStep = () => setStep(2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not logged in')

      // Create user profile
      await supabase.from('users').upsert({
        id: user.id,
        email: form.email,
        full_name: form.fullName,
        role: 'subscriber',
      })

      // Create subscription record (active for testing without Stripe)
      await supabase.from('subscriptions').upsert({
        user_id: user.id,
        plan: form.plan,
        status: 'active',
        charity_percentage: form.charityPct,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'user_id' })

      // Save charity selection if chosen
      if (form.charityId) {
        await supabase.from('charity_selections').upsert({
          user_id: user.id,
          charity_id: form.charityId,
          selected_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
      }

      toast.success('Account created! Welcome to GolfGives!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-semibold inline-block mb-6">
            Golf<span className="text-brand-400">Gives</span>
          </Link>

          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  i < step ? 'bg-brand-500 text-white' :
                  i === step ? 'bg-brand-500/20 border border-brand-500 text-brand-400' :
                  'bg-white/5 text-white/30'
                }`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className={`text-xs ${i === step ? 'text-white/70' : 'text-white/30'}`}>{s}</span>
                {i < STEPS.length - 1 && <div className="w-8 h-px bg-white/10 ml-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-8">
          {/* Step 0: Account */}
          {step === 0 && (
            <form onSubmit={handleAccountStep} className="space-y-5">
              <h2 className="font-display text-2xl font-medium mb-6">Create your account</h2>
              <div>
                <label className="label">Full name</label>
                <input type="text" required value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="input" placeholder="Your name" />
              </div>
              <div>
                <label className="label">Email address</label>
                <input type="email" required value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input" placeholder="you@example.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" required minLength={6} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="input" placeholder="Min. 6 characters" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Continue <ChevronRight size={16} /></span>
                )}
              </button>
            </form>
          )}

          {/* Step 1: Plan */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="font-display text-2xl font-medium mb-6">Choose your plan</h2>
              {(['monthly', 'yearly'] as const).map(plan => (
                <button key={plan} onClick={() => setForm(f => ({ ...f, plan }))}
                  className={`w-full p-5 rounded-xl border text-left transition-all ${
                    form.plan === plan
                      ? 'border-brand-500/60 bg-brand-500/10'
                      : 'border-white/10 bg-white/3 hover:border-white/20'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {PLANS[plan].name}
                        {plan === 'yearly' && <span className="badge badge-green text-xs">Save 25%</span>}
                      </div>
                      <div className="text-white/40 text-sm mt-0.5">{PLANS[plan].description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-semibold">£{PLANS[plan].price}</div>
                      <div className="text-xs text-white/30">/{PLANS[plan].interval}</div>
                    </div>
                  </div>
                </button>
              ))}
              <button onClick={handlePlanStep} className="btn-primary w-full justify-center py-3.5 mt-2">
                Continue <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Step 2: Charity */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h2 className="font-display text-2xl font-medium mb-2">Choose your charity</h2>
              <p className="text-white/40 text-sm mb-4">At least 10% of your subscription goes directly to your chosen charity.</p>

              <div>
                <label className="label">Charity contribution</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={10} max={50} step={5}
                    value={form.charityPct}
                    onChange={e => setForm(f => ({ ...f, charityPct: Number(e.target.value) }))}
                    className="flex-1 accent-brand-500" />
                  <div className="text-brand-400 font-semibold w-12 text-right">{form.charityPct}%</div>
                </div>
                <div className="flex justify-between text-xs text-white/30 mt-1">
                  <span>10% (minimum)</span><span>50%</span>
                </div>
              </div>

              <div>
                <label className="label">Select charity (optional)</label>
                <select value={form.charityId}
                  onChange={e => setForm(f => ({ ...f, charityId: e.target.value }))}
                  className="input">
                  <option value="">Choose later in dashboard</option>
                  {charities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 bg-brand-500/8 border border-brand-500/20 rounded-xl">
                <div className="text-sm text-white/60">
                  Your plan: <span className="text-white font-medium">£{PLANS[form.plan].price}/{PLANS[form.plan].interval}</span>
                  {' · '}
                  Charity: <span className="text-brand-400 font-medium">{form.charityPct}%</span>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-gold w-full justify-center py-3.5 text-base">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                    Setting up your account...
                  </span>
                ) : 'Complete signup'}
              </button>
              <p className="text-center text-xs text-white/25">You can add payment details later in settings</p>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-white/40 text-sm">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
