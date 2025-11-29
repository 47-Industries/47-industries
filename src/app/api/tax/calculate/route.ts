import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface TaxRequest {
  subtotal: number
  shippingCost: number
  address: {
    country: string
    state: string
    city?: string
    zipCode: string
  }
}

// POST /api/tax/calculate - Calculate tax for an order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as TaxRequest
    const { subtotal, shippingCost, address } = body

    if (!subtotal || !address) {
      return NextResponse.json(
        { error: 'Subtotal and address are required' },
        { status: 400 }
      )
    }

    // Find applicable tax rates
    const taxRates = await prisma.taxRate.findMany({
      where: {
        active: true,
        country: address.country || 'US',
      },
      orderBy: { priority: 'desc' },
    })

    // Filter to most specific matching rate
    let applicableRates = taxRates.filter(rate => {
      // Check state match
      if (rate.state && rate.state !== address.state) {
        return false
      }

      // Check city match
      if (rate.city && rate.city.toLowerCase() !== (address.city || '').toLowerCase()) {
        return false
      }

      // Check zip code match
      if (rate.zipCode) {
        const zipRanges = rate.zipCode.split(',').map(z => z.trim())
        const customerZip = parseInt(address.zipCode)
        let zipMatch = false

        for (const range of zipRanges) {
          if (range.includes('-')) {
            const [start, end] = range.split('-').map(z => parseInt(z))
            if (customerZip >= start && customerZip <= end) {
              zipMatch = true
              break
            }
          } else if (parseInt(range) === customerZip) {
            zipMatch = true
            break
          }
        }

        if (!zipMatch) return false
      }

      return true
    })

    // Sort by specificity (more specific = higher priority)
    applicableRates.sort((a, b) => {
      // Count specificity points
      const getSpecificity = (rate: typeof a) => {
        let points = 0
        if (rate.zipCode) points += 4
        if (rate.city) points += 3
        if (rate.state) points += 2
        return points + rate.priority
      }
      return getSpecificity(b) - getSpecificity(a)
    })

    // Calculate tax
    let taxableAmount = subtotal
    let taxAmount = 0
    const appliedRates: { name: string; rate: number; amount: number }[] = []

    // Non-compound rates first
    const nonCompoundRates = applicableRates.filter(r => !r.isCompound)
    const compoundRates = applicableRates.filter(r => r.isCompound)

    // If we have specific rates, use only the most specific one (unless compound)
    const primaryRate = nonCompoundRates[0]

    if (primaryRate) {
      let amount = taxableAmount

      // Include shipping in taxable amount if configured
      if (primaryRate.includeShipping) {
        amount += shippingCost
      }

      const rateTax = amount * Number(primaryRate.rate)
      taxAmount += rateTax
      appliedRates.push({
        name: primaryRate.name,
        rate: Number(primaryRate.rate),
        amount: rateTax,
      })
    }

    // Apply compound rates (stacked on top)
    for (const rate of compoundRates) {
      let amount = taxableAmount + taxAmount

      if (rate.includeShipping) {
        amount += shippingCost
      }

      const rateTax = amount * Number(rate.rate)
      taxAmount += rateTax
      appliedRates.push({
        name: rate.name,
        rate: Number(rate.rate),
        amount: rateTax,
      })
    }

    // Round to 2 decimal places
    taxAmount = Math.round(taxAmount * 100) / 100

    return NextResponse.json({
      subtotal,
      shippingCost,
      taxableAmount,
      taxAmount,
      totalTaxRate: appliedRates.reduce((sum, r) => sum + r.rate, 0),
      appliedRates,
      total: subtotal + shippingCost + taxAmount,
    })
  } catch (error) {
    console.error('Error calculating tax:', error)
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    )
  }
}
