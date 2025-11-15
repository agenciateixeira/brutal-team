'use client'

import { useEffect, useState } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function useStripe() {
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stripePromise) {
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      if (!publishableKey) {
        console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY não encontrada')
        setLoading(false)
        return
      }
      stripePromise = loadStripe(publishableKey)
    }

    stripePromise.then((stripeInstance) => {
      setStripe(stripeInstance)
      setLoading(false)
    })
  }, [])

  return { stripe, loading }
}
