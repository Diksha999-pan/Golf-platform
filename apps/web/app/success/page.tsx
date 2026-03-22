'use client'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function SuccessPage() {
  const router = useRouter()
  const params = useSearchParams()
  const success = params.get('success')

  useEffect(() => {
    if (!success) router.push('/dashboard')
    // Auto-redirect after 5 seconds
    const t = setTimeout(() => router.push('/dashboard'), 5000)
    return () => clearTimeout(t)
  }, [success, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-12 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-brand-400" />
        </div>
        <h1 className="font-display text-3xl font-semibold mb-3">You're in!</h1>
        <p className="text-white/50 mb-8 leading-relaxed">
          Your subscription is active. Add your first Stableford scores and you'll be entered in the next monthly draw.
        </p>
        <Link href="/dashboard" className="btn-primary w-full justify-center py-3.5">
          Go to your dashboard
        </Link>
        <p className="text-white/25 text-xs mt-4">Redirecting automatically in 5 seconds…</p>
      </div>
    </div>
  )
}
