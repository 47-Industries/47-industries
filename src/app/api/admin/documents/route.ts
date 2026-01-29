import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { uploadToR2, generateFileKey, isR2Configured } from '@/lib/r2'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for documents

// Normalized document type for aggregated response
interface NormalizedDocument {
  id: string
  name: string
  description: string | null
  fileUrl: string
  fileName: string | null
  fileSize: number | null
  fileType: string | null
  category: string
  source: 'company' | 'contract' | 'contract_amendment' | 'partner_contract' | 'team_document' | 'team_contract' | 'custom_request' | 'proposal'
  sourceId: string
  year: number | null
  createdAt: Date
  updatedAt: Date
  // Relation info
  clientName?: string
  partnerName?: string
  teamMemberName?: string
  status?: string
  // Original folder info (for company documents)
  folder?: {
    id: string
    name: string
    color: string | null
  } | null
}

// Helper to infer file type from extension if MIME type not available
function inferFileType(fileName: string | null): string | null {
  if (!fileName) return null
  const ext = fileName.split('.').pop()?.toLowerCase()
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    stl: 'model/stl',
    obj: 'model/obj',
    '3mf': 'model/3mf',
    zip: 'application/zip',
    txt: 'text/plain',
  }
  return ext ? mimeMap[ext] || `application/${ext}` : null
}

// Helper to extract year from date
function extractYear(date: Date | null): number | null {
  return date ? new Date(date).getFullYear() : null
}

// GET /api/admin/documents - List documents with filters
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const source = searchParams.get('source') || 'all'
    const folderId = searchParams.get('folderId')
    const category = searchParams.get('category')
    const year = searchParams.get('year')
    const teamMemberId = searchParams.get('teamMemberId')
    const search = searchParams.get('search')
    const tags = searchParams.get('tags') // comma-separated
    const visibility = searchParams.get('visibility')
    const includeCounts = searchParams.get('includeCounts') === 'true'

    const skip = (page - 1) * limit

    // If source is 'company', use original behavior for backward compatibility
    if (source === 'company') {
      const where: any = {}

      if (folderId) {
        where.folderId = folderId === 'root' ? null : folderId
      }

      if (category) {
        where.category = category
      }

      if (year) {
        where.year = parseInt(year)
      }

      if (teamMemberId) {
        where.teamMemberId = teamMemberId
      }

      if (visibility) {
        where.visibility = visibility
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { description: { contains: search } },
          { fileName: { contains: search } },
        ]
      }

      if (tags) {
        const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
        if (tagList.length > 0) {
          where.AND = tagList.map(tag => ({
            tags: { string_contains: tag },
          }))
        }
      }

      const [documents, total] = await Promise.all([
        prisma.companyDocument.findMany({
          where,
          include: {
            folder: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.companyDocument.count({ where }),
      ])

      const response: any = {
        documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }

      if (includeCounts) {
        response.counts = await getDocumentCounts()
      }

      return NextResponse.json(response)
    }

    // Aggregated document fetch
    const allDocuments: NormalizedDocument[] = []
    const counts = {
      company: 0,
      contracts: 0,
      partnerContracts: 0,
      team: 0,
      requests: 0,
    }

    // Helper to check if document matches search criteria
    const matchesSearch = (text: string | null | undefined): boolean => {
      if (!search) return true
      if (!text) return false
      return text.toLowerCase().includes(search.toLowerCase())
    }

    // Determine which sources to fetch
    const fetchCompany = source === 'all' || source === 'company'
    const fetchContracts = source === 'all' || source === 'contracts'
    const fetchPartnerContracts = source === 'all' || source === 'partner-contracts'
    const fetchTeam = source === 'all' || source === 'team'
    const fetchRequests = source === 'all' || source === 'requests'

    // Fetch Company Documents
    if (fetchCompany) {
      try {
        const companyWhere: any = {}
        if (folderId) {
          companyWhere.folderId = folderId === 'root' ? null : folderId
        }
        if (category) {
          companyWhere.category = category
        }
        if (year) {
          companyWhere.year = parseInt(year)
        }
        if (teamMemberId) {
          companyWhere.teamMemberId = teamMemberId
        }
        if (visibility) {
          companyWhere.visibility = visibility
        }
        if (search) {
          companyWhere.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
            { fileName: { contains: search } },
          ]
        }
        if (tags) {
          const tagList = tags.split(',').map(t => t.trim()).filter(Boolean)
          if (tagList.length > 0) {
            companyWhere.AND = tagList.map(tag => ({
              tags: { string_contains: tag },
            }))
          }
        }

        const companyDocs = await prisma.companyDocument.findMany({
          where: companyWhere,
          include: {
            folder: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        counts.company = companyDocs.length

        for (const doc of companyDocs) {
          allDocuments.push({
            id: `company_${doc.id}`,
            name: doc.name,
            description: doc.description,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            fileType: doc.fileType,
            category: doc.category || 'OTHER',
            source: 'company',
            sourceId: doc.id,
            year: doc.year,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            folder: doc.folder,
          })
        }
      } catch (err) {
        console.error('Error fetching company documents:', err)
      }
    }

    // Fetch Client Contracts
    if (fetchContracts) {
      try {
        const contractWhere: any = {
          fileUrl: { not: null },
        }
        if (search) {
          contractWhere.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { fileName: { contains: search } },
            { contractNumber: { contains: search } },
          ]
        }
        if (year) {
          contractWhere.createdAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          }
        }

        const contracts = await prisma.contract.findMany({
          where: contractWhere,
          include: {
            client: {
              select: {
                name: true,
                company: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        for (const contract of contracts) {
          if (contract.fileUrl) {
            allDocuments.push({
              id: `contract_${contract.id}`,
              name: contract.title,
              description: contract.description,
              fileUrl: contract.fileUrl,
              fileName: contract.fileName,
              fileSize: null,
              fileType: inferFileType(contract.fileName),
              category: 'CONTRACT',
              source: 'contract',
              sourceId: contract.id,
              year: extractYear(contract.createdAt),
              createdAt: contract.createdAt,
              updatedAt: contract.updatedAt,
              clientName: contract.client?.company || contract.client?.name || 'Unknown Client',
              status: contract.status,
            })
          }
        }

        // Fetch Contract Amendments (for client contracts)
        const amendmentWhere: any = {
          fileUrl: { not: null },
          clientContractId: { not: null },
        }
        if (search) {
          amendmentWhere.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { fileName: { contains: search } },
            { amendmentNumber: { contains: search } },
          ]
        }
        if (year) {
          amendmentWhere.createdAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          }
        }

        const amendments = await prisma.contractAmendment.findMany({
          where: amendmentWhere,
          include: {
            clientContract: {
              include: {
                client: {
                  select: {
                    name: true,
                    company: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        for (const amendment of amendments) {
          if (amendment.fileUrl) {
            allDocuments.push({
              id: `amendment_${amendment.id}`,
              name: `Amendment: ${amendment.title}`,
              description: amendment.description,
              fileUrl: amendment.fileUrl,
              fileName: amendment.fileName,
              fileSize: null,
              fileType: inferFileType(amendment.fileName),
              category: 'CONTRACT_AMENDMENT',
              source: 'contract_amendment',
              sourceId: amendment.id,
              year: extractYear(amendment.createdAt),
              createdAt: amendment.createdAt,
              updatedAt: amendment.updatedAt,
              clientName: amendment.clientContract?.client?.company || amendment.clientContract?.client?.name || 'Unknown Client',
              status: amendment.status,
            })
          }
        }

        counts.contracts = contracts.filter(c => c.fileUrl).length + amendments.filter(a => a.fileUrl).length
      } catch (err) {
        console.error('Error fetching client contracts:', err)
      }
    }

    // Fetch Partner Contracts
    if (fetchPartnerContracts) {
      try {
        const partnerContractWhere: any = {
          fileUrl: { not: null },
        }
        if (search) {
          partnerContractWhere.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { fileName: { contains: search } },
          ]
        }
        if (year) {
          partnerContractWhere.createdAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          }
        }

        const partnerContracts = await prisma.partnerContract.findMany({
          where: partnerContractWhere,
          include: {
            partner: {
              select: {
                name: true,
                company: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        for (const contract of partnerContracts) {
          if (contract.fileUrl) {
            allDocuments.push({
              id: `partner_contract_${contract.id}`,
              name: contract.title,
              description: contract.description,
              fileUrl: contract.fileUrl,
              fileName: contract.fileName,
              fileSize: null,
              fileType: inferFileType(contract.fileName),
              category: 'PARTNER_CONTRACT',
              source: 'partner_contract',
              sourceId: contract.id,
              year: extractYear(contract.createdAt),
              createdAt: contract.createdAt,
              updatedAt: contract.updatedAt,
              partnerName: contract.partner?.company || contract.partner?.name || 'Unknown Partner',
              status: contract.status,
            })
          }
        }

        // Fetch Partner Contract Amendments
        const partnerAmendmentWhere: any = {
          fileUrl: { not: null },
          partnerContractId: { not: null },
        }
        if (search) {
          partnerAmendmentWhere.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { fileName: { contains: search } },
            { amendmentNumber: { contains: search } },
          ]
        }
        if (year) {
          partnerAmendmentWhere.createdAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          }
        }

        const partnerAmendments = await prisma.contractAmendment.findMany({
          where: partnerAmendmentWhere,
          include: {
            partnerContract: {
              include: {
                partner: {
                  select: {
                    name: true,
                    company: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        for (const amendment of partnerAmendments) {
          if (amendment.fileUrl) {
            allDocuments.push({
              id: `partner_amendment_${amendment.id}`,
              name: `Amendment: ${amendment.title}`,
              description: amendment.description,
              fileUrl: amendment.fileUrl,
              fileName: amendment.fileName,
              fileSize: null,
              fileType: inferFileType(amendment.fileName),
              category: 'PARTNER_CONTRACT_AMENDMENT',
              source: 'contract_amendment',
              sourceId: amendment.id,
              year: extractYear(amendment.createdAt),
              createdAt: amendment.createdAt,
              updatedAt: amendment.updatedAt,
              partnerName: amendment.partnerContract?.partner?.company || amendment.partnerContract?.partner?.name || 'Unknown Partner',
              status: amendment.status,
            })
          }
        }

        counts.partnerContracts = partnerContracts.filter(c => c.fileUrl).length + partnerAmendments.filter(a => a.fileUrl).length
      } catch (err) {
        console.error('Error fetching partner contracts:', err)
      }
    }

    // Fetch Team Member Documents and Contracts
    if (fetchTeam) {
      try {
        const teamDocWhere: any = {}
        if (teamMemberId) {
          teamDocWhere.teamMemberId = teamMemberId
        }
        if (search) {
          teamDocWhere.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
            { fileName: { contains: search } },
          ]
        }
        if (category) {
          teamDocWhere.type = category
        }
        if (year) {
          teamDocWhere.createdAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          }
        }

        const teamDocuments = await prisma.teamMemberDocument.findMany({
          where: teamDocWhere,
          include: {
            teamMember: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        for (const doc of teamDocuments) {
          allDocuments.push({
            id: `team_doc_${doc.id}`,
            name: doc.name,
            description: doc.description,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            fileType: inferFileType(doc.fileName),
            category: doc.type || 'HR',
            source: 'team_document',
            sourceId: doc.id,
            year: extractYear(doc.createdAt),
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            teamMemberName: doc.teamMember?.name || 'Unknown',
          })
        }

        // Fetch Team Member Contracts
        const teamContractWhere: any = {
          fileUrl: { not: null },
        }
        if (teamMemberId) {
          teamContractWhere.teamMemberId = teamMemberId
        }
        if (search) {
          teamContractWhere.OR = [
            { title: { contains: search } },
            { description: { contains: search } },
            { fileName: { contains: search } },
          ]
        }
        if (year) {
          teamContractWhere.createdAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          }
        }

        const teamContracts = await prisma.teamMemberContract.findMany({
          where: teamContractWhere,
          include: {
            teamMember: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        })

        for (const contract of teamContracts) {
          if (contract.fileUrl) {
            allDocuments.push({
              id: `team_contract_${contract.id}`,
              name: contract.title,
              description: contract.description,
              fileUrl: contract.fileUrl,
              fileName: contract.fileName,
              fileSize: null,
              fileType: inferFileType(contract.fileName),
              category: contract.type || 'EMPLOYMENT',
              source: 'team_contract',
              sourceId: contract.id,
              year: extractYear(contract.createdAt),
              createdAt: contract.createdAt,
              updatedAt: contract.updatedAt,
              teamMemberName: contract.teamMember?.name || 'Unknown',
              status: contract.status,
            })
          }
        }

        counts.team = teamDocuments.length + teamContracts.filter(c => c.fileUrl).length
      } catch (err) {
        console.error('Error fetching team documents:', err)
      }
    }

    // Fetch Custom Requests (3D Print files)
    if (fetchRequests) {
      try {
        const customRequestWhere: any = {
          fileUrl: { not: null },
        }
        if (search) {
          customRequestWhere.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
            { fileName: { contains: search } },
            { requestNumber: { contains: search } },
          ]
        }
        if (year) {
          customRequestWhere.createdAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          }
        }

        const customRequests = await prisma.customRequest.findMany({
          where: customRequestWhere,
          orderBy: { createdAt: 'desc' },
        })

        for (const request of customRequests) {
          if (request.fileUrl) {
            allDocuments.push({
              id: `custom_request_${request.id}`,
              name: `3D Print Request: ${request.requestNumber}`,
              description: request.description,
              fileUrl: request.fileUrl,
              fileName: request.fileName,
              fileSize: request.fileSize,
              fileType: inferFileType(request.fileName),
              category: '3D_PRINT',
              source: 'custom_request',
              sourceId: request.id,
              year: extractYear(request.createdAt),
              createdAt: request.createdAt,
              updatedAt: request.updatedAt,
              clientName: request.company || request.name,
              status: request.status,
            })
          }
        }

        // Fetch Service Inquiry Proposals
        const inquiryWhere: any = {
          proposalUrl: { not: null },
        }
        if (search) {
          inquiryWhere.OR = [
            { name: { contains: search } },
            { description: { contains: search } },
            { inquiryNumber: { contains: search } },
            { company: { contains: search } },
          ]
        }
        if (year) {
          inquiryWhere.createdAt = {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${parseInt(year) + 1}-01-01`),
          }
        }

        const inquiries = await prisma.serviceInquiry.findMany({
          where: inquiryWhere,
          orderBy: { createdAt: 'desc' },
        })

        for (const inquiry of inquiries) {
          if (inquiry.proposalUrl) {
            allDocuments.push({
              id: `proposal_${inquiry.id}`,
              name: `Proposal: ${inquiry.inquiryNumber}`,
              description: inquiry.description,
              fileUrl: inquiry.proposalUrl,
              fileName: null,
              fileSize: null,
              fileType: 'application/pdf',
              category: 'PROPOSAL',
              source: 'proposal',
              sourceId: inquiry.id,
              year: extractYear(inquiry.createdAt),
              createdAt: inquiry.createdAt,
              updatedAt: inquiry.updatedAt,
              clientName: inquiry.company || inquiry.name,
              status: inquiry.status,
            })
          }
        }

        counts.requests = customRequests.filter(r => r.fileUrl).length + inquiries.filter(i => i.proposalUrl).length
      } catch (err) {
        console.error('Error fetching custom requests:', err)
      }
    }

    // Sort all documents by createdAt descending
    allDocuments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Apply pagination
    const total = allDocuments.length
    const paginatedDocuments = allDocuments.slice(skip, skip + limit)

    const response: any = {
      documents: paginatedDocuments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }

    if (includeCounts || source === 'all') {
      response.counts = counts
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching documents:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// Helper function to get document counts for all sources
async function getDocumentCounts() {
  const [
    companyCount,
    contractCount,
    contractAmendmentCount,
    partnerContractCount,
    partnerAmendmentCount,
    teamDocCount,
    teamContractCount,
    customRequestCount,
    proposalCount,
  ] = await Promise.all([
    prisma.companyDocument.count(),
    prisma.contract.count({ where: { fileUrl: { not: null } } }),
    prisma.contractAmendment.count({ where: { fileUrl: { not: null }, clientContractId: { not: null } } }),
    prisma.partnerContract.count({ where: { fileUrl: { not: null } } }),
    prisma.contractAmendment.count({ where: { fileUrl: { not: null }, partnerContractId: { not: null } } }),
    prisma.teamMemberDocument.count(),
    prisma.teamMemberContract.count({ where: { fileUrl: { not: null } } }),
    prisma.customRequest.count({ where: { fileUrl: { not: null } } }),
    prisma.serviceInquiry.count({ where: { proposalUrl: { not: null } } }),
  ])

  return {
    company: companyCount,
    contracts: contractCount + contractAmendmentCount,
    partnerContracts: partnerContractCount + partnerAmendmentCount,
    team: teamDocCount + teamContractCount,
    requests: customRequestCount + proposalCount,
  }
}

// POST /api/admin/documents - Upload and create document
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isR2Configured) {
      return NextResponse.json(
        { error: 'File storage not configured. Please set up Cloudflare R2.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const name = formData.get('name') as string | null
    const description = formData.get('description') as string | null
    const folderId = formData.get('folderId') as string | null
    const category = formData.get('category') as string | null
    const tagsRaw = formData.get('tags') as string | null
    const yearRaw = formData.get('year') as string | null
    const teamMemberId = formData.get('teamMemberId') as string | null
    const visibility = formData.get('visibility') as string || 'ADMIN'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Validate folder exists if provided
    if (folderId) {
      const folder = await prisma.documentFolder.findUnique({
        where: { id: folderId },
      })
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }
    }

    // Parse tags
    const tags = tagsRaw
      ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
      : []

    // Parse year
    const year = yearRaw ? parseInt(yearRaw) : null

    // Upload file to R2
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const fileKey = generateFileKey(file.name, 'documents')
    const fileUrl = await uploadToR2(fileKey, buffer, file.type)

    // Create document record
    const document = await prisma.companyDocument.create({
      data: {
        name: name || file.name,
        description,
        folderId: folderId || null,
        fileUrl,
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        category: category || null,
        tags: tags.length > 0 ? tags : undefined,
        year,
        teamMemberId: teamMemberId || null,
        visibility,
        uploadedBy: auth.userId,
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
