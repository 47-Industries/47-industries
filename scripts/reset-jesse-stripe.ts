import { config } from 'dotenv'
config({ path: '.env' })

import { prisma } from '../src/lib/prisma'
import Stripe from 'stripe'

async function resetJesseStripeConnect() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not set')
    return
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const partner = await prisma.partner.findFirst({
    where: { name: { contains: 'Jesse' } }
  })

  if (!partner) {
    console.log('Partner not found')
    return
  }

  console.log('Partner:', partner.name, partner.partnerNumber)
  console.log('Current Stripe ID:', partner.stripeConnectId)
  console.log('Phone:', partner.phone)

  if (partner.stripeConnectId) {
    // Delete the Stripe Connect account
    try {
      await stripe.accounts.del(partner.stripeConnectId)
      console.log('Deleted Stripe Connect account:', partner.stripeConnectId)
    } catch (err: any) {
      console.log('Could not delete Stripe account:', err.message)
      // Continue anyway - we'll clear the DB reference
    }
  }

  // Clear the stripeConnectId from database
  await prisma.partner.update({
    where: { id: partner.id },
    data: {
      stripeConnectId: null,
      stripeConnectStatus: null,
      stripeConnectOnboardingUrl: null
    }
  })

  console.log('Cleared Stripe Connect data from database')
  console.log('\nJesse can now click "Setup Payouts" again.')
  console.log('This time it will create a fresh account with HIS phone number.')
}

resetJesseStripeConnect()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
