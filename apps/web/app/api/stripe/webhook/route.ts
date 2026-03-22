import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

// Admin client bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, plan, charityPct } = session.metadata || {}
        if (!userId) break

        // Fetch subscription period
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan,
          status: 'active',
          stripe_subscription_id: subscription.id,
          stripe_customer_id: session.customer as string,
          charity_percentage: Number(charityPct) || 10,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        }, { onConflict: 'user_id' })
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break

        await supabase.from('subscriptions').update({
          status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'inactive',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('user_id', userId)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break

        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('user_id', userId)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const userId = sub.metadata?.userId
        if (!userId) break

        const charityPct = Number(sub.metadata?.charityPct) || 10
        const amount = (invoice.amount_paid / 100)
        const charityAmount = Math.round(amount * (charityPct / 100) * 100) / 100

        // Fetch user's charity selection
        const { data: selection } = await supabase
          .from('charity_selections')
          .select('charity_id')
          .eq('user_id', userId)
          .single()

        if (selection?.charity_id) {
          const { data: subRecord } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .single()

          if (subRecord) {
            await supabase.from('charity_donations').insert({
              charity_id: selection.charity_id,
              subscription_id: subRecord.id,
              amount: charityAmount,
              donated_at: new Date().toISOString(),
            })
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
