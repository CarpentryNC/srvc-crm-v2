import { loadStripe } from '@stripe/stripe-js'
import type { Stripe } from '@stripe/stripe-js'

// PLACEHOLDER - Replace with your actual Stripe publishable key
const stripePublishableKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your-publishable-key-here'

// Initialize Stripe
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey)
  }
  return stripePromise
}

// Helper function to check if Stripe is properly configured
export const isStripeConfigured = () => {
  return (
    stripePublishableKey !== 'pk_test_your-publishable-key-here' &&
    stripePublishableKey.startsWith('pk_')
  )
}

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  STARTER: {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small businesses getting started',
    price: 29,
    interval: 'month' as const,
    stripePriceId: 'price_starter_monthly', // PLACEHOLDER - Replace with actual Stripe price ID
    features: [
      'Up to 100 customers',
      'Basic invoicing',
      'Email support',
      'Mobile app access'
    ],
    limits: {
      customers: 100,
      invoices: 50,
      storage: '1GB'
    }
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    description: 'Advanced features for growing businesses',
    price: 79,
    interval: 'month' as const,
    stripePriceId: 'price_professional_monthly', // PLACEHOLDER - Replace with actual Stripe price ID
    features: [
      'Unlimited customers',
      'Advanced reporting',
      'Payment processing',
      'Priority support',
      'API access'
    ],
    limits: {
      customers: -1, // Unlimited
      invoices: -1, // Unlimited
      storage: '10GB'
    }
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Full-featured solution for large teams',
    price: 199,
    interval: 'month' as const,
    stripePriceId: 'price_enterprise_monthly', // PLACEHOLDER - Replace with actual Stripe price ID
    features: [
      'Everything in Professional',
      'White label options',
      'Custom integrations',
      'Dedicated support',
      'Advanced security'
    ],
    limits: {
      customers: -1, // Unlimited
      invoices: -1, // Unlimited
      storage: '100GB'
    }
  }
} as const

export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[keyof typeof SUBSCRIPTION_PLANS]

// Payment processing configuration
export const PAYMENT_CONFIG = {
  // Payment processing fees (adjust based on your Stripe configuration)
  stripeFee: 0.029, // 2.9%
  stripeFixedFee: 0.30, // $0.30
  
  // Optional service fee for your platform
  serviceFee: 0.01, // 1% (optional additional fee)
  
  // Supported payment methods
  paymentMethods: ['card', 'bank_transfer'] as const,
  
  // Currency settings
  defaultCurrency: 'usd' as const,
  supportedCurrencies: ['usd', 'cad', 'eur', 'gbp'] as const,
}

export type PaymentMethod = typeof PAYMENT_CONFIG.paymentMethods[number]
export type Currency = typeof PAYMENT_CONFIG.supportedCurrencies[number]
