'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (error) {
      toast.error(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-3xl font-semibold inline-block mb-6">
            Golf<span className="text-brand-400">Gives</span>
          </Link>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-brand-400" />
              </div>
              <h2 className="font-display text-2xl font-medium mb-2">Check your email</h2>
              <p className="text-white/50 text-sm mb-6">We sent a password reset link to <strong className="text-white">{email}</strong></p>
              <Link href="/auth/login" className="btn-secondary w-full justify-center">
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-medium mb-2">Forgot password?</h2>
              <p className="text-white/50 text-sm mb-6">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                    <input type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="input pl-10" placeholder="you@example.com" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
              <div className="mt-6 pt-6 border-t border-white/5 text-center">
                <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/70 flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft size={12} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
