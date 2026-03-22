'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CreditCard, RefreshCw, XCircle, CheckCircle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function SubscriptionPage() {
  const supabase = createClient()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setSubscription(data)
      setLoading(false)
    }
    fetch()
  }, [])

  const handleManageBilling = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? You will retain access until the end of your billing period.')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      toast.success('Subscription cancelled. You retain access until the period ends.')
      setSubscription((s: any) => ({ ...s, status: 'cancelled' }))
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )

  if (!subscription) return (
    <div className="p-8 max-w-2xl">
      <div className="card p-12 text-center">
        <CreditCard size={32} className="text-white/20 mx-auto mb-3" />
        <h2 className="font-display text-2xl font-medium mb-2">No active subscription</h2>
        <p className="text-white/40 mb-6">Subscribe to enter monthly prize draws and support charity.</p>
        <a href="/auth/signup" className="btn-primary inline-flex">Get started</a>
      </div>
    </div>
  )

  const isActive = subscription.status === 'active'

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold mb-1">Subscription</h1>
        <p className="text-white/40">Manage your plan and billing</p>
      </div>

      {/* Status card */}
      <div className={`card p-6 mb-6 border ${isActive ? 'border-brand-500/30 bg-brand-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isActive
              ? <CheckCircle size={18} className="text-brand-400" />
              : <XCircle size={18} className="text-red-400" />}
            <span className={`font-medium ${isActive ? 'text-brand-400' : 'text-red-400'}`}>
              {isActive ? 'Active' : subscription.status}
            </span>
          </div>
          <span className="badge badge-green capitalize">{subscription.plan}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/40 mb-0.5">Plan</div>
            <div className="font-medium capitalize">{subscription.plan} billing</div>
          </div>
          <div>
            <div className="text-white/40 mb-0.5">Charity contribution</div>
            <div className="font-medium text-brand-400">{subscription.charity_percentage}%</div>
          </div>
          <div>
            <div className="text-white/40 mb-0.5">Current period start</div>
            <div className="font-medium">
              {subscription.current_period_start
                ? format(new Date(subscription.current_period_start), 'dd MMM yyyy')
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-white/40 mb-0.5">
              {subscription.status === 'cancelled' ? 'Access ends' : 'Next renewal'}
            </div>
            <div className="font-medium flex items-center gap-1.5">
              <Calendar size={12} className="text-white/40" />
              {subscription.current_period_end
                ? format(new Date(subscription.current_period_end), 'dd MMM yyyy')
                : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button onClick={handleManageBilling} className="btn-secondary w-full justify-center">
          <CreditCard size={16} /> Manage billing & payment method
        </button>

        {isActive && (
          <button onClick={handleCancel} disabled={cancelling}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl transition-all text-sm font-medium bg-red-500/5 hover:bg-red-500/10">
            <XCircle size={14} />
            {cancelling ? 'Cancelling...' : 'Cancel subscription'}
          </button>
        )}
      </div>

      <p className="text-xs text-white/20 mt-6 text-center">
        Billing is handled securely by Stripe. We never store your payment details.
      </p>
    </div>
  )
}
