'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { Subscription } from '@/types/database'

export function useSubscription(userId: string | undefined) {
  const supabase = createClient()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        setSubscription(data)
        setLoading(false)
      })
  }, [userId])

  const isActive = subscription?.status === 'active'
  const isMonthly = subscription?.plan === 'monthly'

  return { subscription, loading, isActive, isMonthly }
}
