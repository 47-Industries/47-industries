import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/admin/pending-signatures - Get contracts with unsigned admin signature fields
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    })

    if (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Find all unsigned admin signature fields
    const unsignedFields = await prisma.contractSignatureField.findMany({
      where: {
        isSigned: false,
        assignedTo: { in: ['ADMIN', 'ADMIN_2'] },
      },
      include: {
        contract: {
          select: {
            id: true,
            contractNumber: true,
            title: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                clientNumber: true,
              },
            },
          },
        },
        partnerContract: {
          select: {
            id: true,
            title: true,
            status: true,
            partner: {
              select: {
                id: true,
                name: true,
                partnerNumber: true,
              },
            },
          },
        },
      },
    })

    // Group by contract
    const contractMap = new Map<string, {
      contractId: string
      contractNumber: string
      title: string
      status: string
      clientId?: string
      clientName?: string
      clientNumber?: string
      partnerId?: string
      partnerName?: string
      partnerNumber?: string
      type: 'client' | 'partner'
      unsignedFields: typeof unsignedFields
      totalAdminFields: number
      signedAdminFields: number
    }>()

    for (const field of unsignedFields) {
      const key = field.contractId || field.partnerContractId || ''
      if (!key) continue

      if (!contractMap.has(key)) {
        if (field.contract) {
          contractMap.set(key, {
            contractId: field.contract.id,
            contractNumber: field.contract.contractNumber,
            title: field.contract.title,
            status: field.contract.status,
            clientId: field.contract.client?.id,
            clientName: field.contract.client?.name,
            clientNumber: field.contract.client?.clientNumber,
            type: 'client',
            unsignedFields: [],
            totalAdminFields: 0,
            signedAdminFields: 0,
          })
        } else if (field.partnerContract) {
          contractMap.set(key, {
            contractId: field.partnerContract.id,
            contractNumber: '',
            title: field.partnerContract.title,
            status: field.partnerContract.status,
            partnerId: field.partnerContract.partner?.id,
            partnerName: field.partnerContract.partner?.name,
            partnerNumber: field.partnerContract.partner?.partnerNumber,
            type: 'partner',
            unsignedFields: [],
            totalAdminFields: 0,
            signedAdminFields: 0,
          })
        }
      }

      const entry = contractMap.get(key)
      if (entry) {
        entry.unsignedFields.push(field)
      }
    }

    // Get total admin field counts for each contract
    for (const [contractId, entry] of contractMap) {
      const allAdminFields = await prisma.contractSignatureField.findMany({
        where: {
          OR: [
            { contractId: entry.type === 'client' ? contractId : undefined },
            { partnerContractId: entry.type === 'partner' ? contractId : undefined },
          ],
          assignedTo: { in: ['ADMIN', 'ADMIN_2'] },
        },
      })
      entry.totalAdminFields = allAdminFields.length
      entry.signedAdminFields = allAdminFields.filter(f => f.isSigned).length
    }

    const pendingContracts = Array.from(contractMap.values()).map(entry => ({
      contractId: entry.contractId,
      contractNumber: entry.contractNumber,
      title: entry.title,
      status: entry.status,
      type: entry.type,
      clientId: entry.clientId,
      clientName: entry.clientName,
      clientNumber: entry.clientNumber,
      partnerId: entry.partnerId,
      partnerName: entry.partnerName,
      partnerNumber: entry.partnerNumber,
      unsignedCount: entry.unsignedFields.length,
      totalAdminFields: entry.totalAdminFields,
      signedAdminFields: entry.signedAdminFields,
    }))

    return NextResponse.json({
      pendingContracts,
      totalPending: pendingContracts.length,
    })
  } catch (error) {
    console.error('Error fetching pending signatures:', error)
    return NextResponse.json({ error: 'Failed to fetch pending signatures' }, { status: 500 })
  }
}
