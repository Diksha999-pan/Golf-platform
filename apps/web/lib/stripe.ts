import { loadStripe } from '@stripe/stripe-js'

let stripePromise: ReturnType<typeof loadStripe>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export const PLANS = {
  monthly: {
    id: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_monthly',
    name: 'Monthly',
    price: 9.99,
    interval: 'month' as const,
    description: 'Pay month to month, cancel anytime',
  },
  yearly: {
    id: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID || 'price_yearly',
    name: 'Yearly',
    price: 89.99,
    interval: 'year' as const,
    description: 'Save 25% with annual billing',
    badge: 'Best Value',
  },
}
