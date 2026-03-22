import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PLANS } from '@/lib/stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(request: Request) {
  try {
    const { plan, userId, charityPct } = await request.json()

    const selectedPlan = PLANS[plan as keyof typeof PLANS]
    if (!selectedPlan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: selectedPlan.id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL}/auth/signup?cancelled=1`,
      metadata: {
        userId,
        plan,
        charityPct: String(charityPct),
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
          charityPct: String(charityPct),
        },
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
