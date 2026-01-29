import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminAuthInfo } from '@/lib/auth-helper'

interface FolderNode {
  id: string
  name: string
  description: string | null
  parentId: string | null
  color: string | null
  icon: string | null
  sortOrder: number
  createdBy?: string
  createdAt?: Date
  updatedAt?: Date
  isVirtual?: boolean
  path?: string
  _count: {
    documents: number
  }
  children: FolderNode[]
}

// System folder colors for virtual folders
const SYSTEM_FOLDER_COLORS: Record<string, string> = {
  'client_contracts': '#8b5cf6',    // Purple
  'partner_contracts': '#10b981',   // Green
  'team_documents': '#f59e0b',      // Amber
  'taxes': '#3b82f6',               // Blue
  'requests': '#06b6d4',            // Cyan
  'proposals': '#ec4899',           // Pink
}

// Generate virtual folders based on document sources
async function generateVirtualFolders(): Promise<FolderNode[]> {
  const virtualFolders: FolderNode[] = []

  // Client Contracts folder
  const clientContracts = await prisma.contract.findMany({
    where: { fileUrl: { not: null } },
    include: {
      client: { select: { id: true, name: true, company: true } },
    },
  })

  if (clientContracts.length > 0) {
    const clientContractsFolder: FolderNode = {
      id: 'virtual_client_contracts',
      name: 'Client Contracts',
      description: 'Contracts with clients',
      parentId: null,
      color: SYSTEM_FOLDER_COLORS.client_contracts,
      icon: null,
      sortOrder: 100,
      isVirtual: true,
      path: 'Client Contracts',
      _count: { documents: 0 },
      children: [],
    }

    // Group by client
    const clientMap = new Map<string, { name: string; count: number }>()
    for (const contract of clientContracts) {
      const clientId = contract.clientId
      const clientName = contract.client?.company || contract.client?.name || 'Unknown Client'
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, { name: clientName, count: 0 })
      }
      clientMap.get(clientId)!.count++
    }

    // Also count amendments
    const amendments = await prisma.contractAmendment.findMany({
      where: { fileUrl: { not: null }, clientContractId: { not: null } },
      include: {
        clientContract: {
          include: { client: { select: { id: true, name: true, company: true } } },
        },
      },
    })

    for (const amendment of amendments) {
      const clientId = amendment.clientContract?.clientId
      if (clientId) {
        if (!clientMap.has(clientId)) {
          const clientName = amendment.clientContract?.client?.company || amendment.clientContract?.client?.name || 'Unknown Client'
          clientMap.set(clientId, { name: clientName, count: 0 })
        }
        clientMap.get(clientId)!.count++
      }
    }

    // Create subfolders for each client
    for (const [clientId, info] of clientMap) {
      clientContractsFolder.children.push({
        id: `virtual_client_contracts_${clientId}`,
        name: info.name,
        description: null,
        parentId: 'virtual_client_contracts',
        color: SYSTEM_FOLDER_COLORS.client_contracts,
        icon: null,
        sortOrder: 0,
        isVirtual: true,
        path: `Client Contracts / ${info.name}`,
        _count: { documents: info.count },
        children: [],
      })
    }

    clientContractsFolder._count.documents = clientContracts.length + amendments.length
    clientContractsFolder.children.sort((a, b) => a.name.localeCompare(b.name))
    virtualFolders.push(clientContractsFolder)
  }

  // Partner Contracts folder
  const partnerContracts = await prisma.partnerContract.findMany({
    where: { fileUrl: { not: null } },
    include: {
      partner: { select: { id: true, name: true, company: true } },
    },
  })

  if (partnerContracts.length > 0) {
    const partnerContractsFolder: FolderNode = {
      id: 'virtual_partner_contracts',
      name: 'Partner Contracts',
      description: 'Contracts with partners',
      parentId: null,
      color: SYSTEM_FOLDER_COLORS.partner_contracts,
      icon: null,
      sortOrder: 101,
      isVirtual: true,
      path: 'Partner Contracts',
      _count: { documents: 0 },
      children: [],
    }

    // Group by partner
    const partnerMap = new Map<string, { name: string; count: number }>()
    for (const contract of partnerContracts) {
      const partnerId = contract.partnerId
      const partnerName = contract.partner?.company || contract.partner?.name || 'Unknown Partner'
      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, { name: partnerName, count: 0 })
      }
      partnerMap.get(partnerId)!.count++
    }

    // Also count partner amendments
    const partnerAmendments = await prisma.contractAmendment.findMany({
      where: { fileUrl: { not: null }, partnerContractId: { not: null } },
      include: {
        partnerContract: {
          include: { partner: { select: { id: true, name: true, company: true } } },
        },
      },
    })

    for (const amendment of partnerAmendments) {
      const partnerId = amendment.partnerContract?.partnerId
      if (partnerId) {
        if (!partnerMap.has(partnerId)) {
          const partnerName = amendment.partnerContract?.partner?.company || amendment.partnerContract?.partner?.name || 'Unknown Partner'
          partnerMap.set(partnerId, { name: partnerName, count: 0 })
        }
        partnerMap.get(partnerId)!.count++
      }
    }

    // Create subfolders for each partner
    for (const [partnerId, info] of partnerMap) {
      partnerContractsFolder.children.push({
        id: `virtual_partner_contracts_${partnerId}`,
        name: info.name,
        description: null,
        parentId: 'virtual_partner_contracts',
        color: SYSTEM_FOLDER_COLORS.partner_contracts,
        icon: null,
        sortOrder: 0,
        isVirtual: true,
        path: `Partner Contracts / ${info.name}`,
        _count: { documents: info.count },
        children: [],
      })
    }

    partnerContractsFolder._count.documents = partnerContracts.length + partnerAmendments.length
    partnerContractsFolder.children.sort((a, b) => a.name.localeCompare(b.name))
    virtualFolders.push(partnerContractsFolder)
  }

  // Team Documents folder
  const teamDocs = await prisma.teamMemberDocument.findMany({
    include: { teamMember: { select: { id: true, name: true } } },
  })
  const teamContracts = await prisma.teamMemberContract.findMany({
    where: { fileUrl: { not: null } },
    include: { teamMember: { select: { id: true, name: true } } },
  })

  if (teamDocs.length > 0 || teamContracts.length > 0) {
    const teamFolder: FolderNode = {
      id: 'virtual_team_documents',
      name: 'Team Documents',
      description: 'Team member documents and contracts',
      parentId: null,
      color: SYSTEM_FOLDER_COLORS.team_documents,
      icon: null,
      sortOrder: 102,
      isVirtual: true,
      path: 'Team Documents',
      _count: { documents: teamDocs.length + teamContracts.length },
      children: [],
    }

    // Group by team member
    const memberMap = new Map<string, { name: string; count: number }>()
    for (const doc of teamDocs) {
      const memberId = doc.teamMemberId
      const memberName = doc.teamMember?.name || 'Unknown'
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, { name: memberName, count: 0 })
      }
      memberMap.get(memberId)!.count++
    }
    for (const contract of teamContracts) {
      const memberId = contract.teamMemberId
      const memberName = contract.teamMember?.name || 'Unknown'
      if (!memberMap.has(memberId)) {
        memberMap.set(memberId, { name: memberName, count: 0 })
      }
      memberMap.get(memberId)!.count++
    }

    for (const [memberId, info] of memberMap) {
      teamFolder.children.push({
        id: `virtual_team_documents_${memberId}`,
        name: info.name,
        description: null,
        parentId: 'virtual_team_documents',
        color: SYSTEM_FOLDER_COLORS.team_documents,
        icon: null,
        sortOrder: 0,
        isVirtual: true,
        path: `Team Documents / ${info.name}`,
        _count: { documents: info.count },
        children: [],
      })
    }

    teamFolder.children.sort((a, b) => a.name.localeCompare(b.name))
    virtualFolders.push(teamFolder)
  }

  // Taxes folder (from company documents with TAX category)
  const taxDocs = await prisma.companyDocument.findMany({
    where: { category: 'TAX' },
  })

  if (taxDocs.length > 0) {
    const taxesFolder: FolderNode = {
      id: 'virtual_taxes',
      name: 'Taxes',
      description: 'Tax documents by year',
      parentId: null,
      color: SYSTEM_FOLDER_COLORS.taxes,
      icon: null,
      sortOrder: 103,
      isVirtual: true,
      path: 'Taxes',
      _count: { documents: taxDocs.length },
      children: [],
    }

    // Group by year
    const yearMap = new Map<number, number>()
    for (const doc of taxDocs) {
      if (doc.year) {
        yearMap.set(doc.year, (yearMap.get(doc.year) || 0) + 1)
      }
    }

    for (const [year, count] of yearMap) {
      taxesFolder.children.push({
        id: `virtual_taxes_${year}`,
        name: `${year}`,
        description: null,
        parentId: 'virtual_taxes',
        color: SYSTEM_FOLDER_COLORS.taxes,
        icon: null,
        sortOrder: year,
        isVirtual: true,
        path: `Taxes / ${year}`,
        _count: { documents: count },
        children: [],
      })
    }

    taxesFolder.children.sort((a, b) => b.sortOrder - a.sortOrder) // Newest year first
    virtualFolders.push(taxesFolder)
  }

  // Requests folder (3D Prints and other requests)
  const customRequests = await prisma.customRequest.findMany({
    where: { fileUrl: { not: null } },
  })

  if (customRequests.length > 0) {
    const requestsFolder: FolderNode = {
      id: 'virtual_requests',
      name: 'Requests',
      description: 'Customer requests with files',
      parentId: null,
      color: SYSTEM_FOLDER_COLORS.requests,
      icon: null,
      sortOrder: 104,
      isVirtual: true,
      path: 'Requests',
      _count: { documents: customRequests.length },
      children: [],
    }

    // 3D Prints subfolder
    const prints3DFolder: FolderNode = {
      id: 'virtual_requests_3d_prints',
      name: '3D Prints',
      description: null,
      parentId: 'virtual_requests',
      color: SYSTEM_FOLDER_COLORS.requests,
      icon: null,
      sortOrder: 0,
      isVirtual: true,
      path: 'Requests / 3D Prints',
      _count: { documents: customRequests.length },
      children: [],
    }

    // Group by year
    const yearMap = new Map<number, number>()
    for (const req of customRequests) {
      const year = new Date(req.createdAt).getFullYear()
      yearMap.set(year, (yearMap.get(year) || 0) + 1)
    }

    for (const [year, count] of yearMap) {
      prints3DFolder.children.push({
        id: `virtual_requests_3d_prints_${year}`,
        name: `${year}`,
        description: null,
        parentId: 'virtual_requests_3d_prints',
        color: SYSTEM_FOLDER_COLORS.requests,
        icon: null,
        sortOrder: year,
        isVirtual: true,
        path: `Requests / 3D Prints / ${year}`,
        _count: { documents: count },
        children: [],
      })
    }

    prints3DFolder.children.sort((a, b) => b.sortOrder - a.sortOrder)
    requestsFolder.children.push(prints3DFolder)
    virtualFolders.push(requestsFolder)
  }

  // Proposals folder
  const proposals = await prisma.serviceInquiry.findMany({
    where: { proposalUrl: { not: null } },
  })

  if (proposals.length > 0) {
    const proposalsFolder: FolderNode = {
      id: 'virtual_proposals',
      name: 'Proposals',
      description: 'Service proposals',
      parentId: null,
      color: SYSTEM_FOLDER_COLORS.proposals,
      icon: null,
      sortOrder: 105,
      isVirtual: true,
      path: 'Proposals',
      _count: { documents: proposals.length },
      children: [],
    }

    // Group by year
    const yearMap = new Map<number, number>()
    for (const proposal of proposals) {
      const year = new Date(proposal.createdAt).getFullYear()
      yearMap.set(year, (yearMap.get(year) || 0) + 1)
    }

    for (const [year, count] of yearMap) {
      proposalsFolder.children.push({
        id: `virtual_proposals_${year}`,
        name: `${year}`,
        description: null,
        parentId: 'virtual_proposals',
        color: SYSTEM_FOLDER_COLORS.proposals,
        icon: null,
        sortOrder: year,
        isVirtual: true,
        path: `Proposals / ${year}`,
        _count: { documents: count },
        children: [],
      })
    }

    proposalsFolder.children.sort((a, b) => b.sortOrder - a.sortOrder)
    virtualFolders.push(proposalsFolder)
  }

  return virtualFolders
}

// Build tree structure from flat list of folders
function buildFolderTree(folders: any[]): FolderNode[] {
  const folderMap = new Map<string, FolderNode>()
  const roots: FolderNode[] = []

  // First pass: create all nodes
  for (const folder of folders) {
    folderMap.set(folder.id, {
      ...folder,
      children: [],
    })
  }

  // Second pass: build tree
  for (const folder of folders) {
    const node = folderMap.get(folder.id)!
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort children by sortOrder
  function sortChildren(nodes: FolderNode[]) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    for (const node of nodes) {
      sortChildren(node.children)
    }
  }

  sortChildren(roots)
  return roots
}

// GET /api/admin/documents/folders - List all folders as tree structure
export async function GET(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const flat = searchParams.get('flat') === 'true'
    const includeVirtual = searchParams.get('includeVirtual') !== 'false' // Default to true

    const folders = await prisma.documentFolder.findMany({
      include: {
        _count: {
          select: { documents: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    let result: FolderNode[]

    if (flat) {
      result = folders.map(f => ({ ...f, children: [] }))
      if (includeVirtual) {
        const virtualFolders = await generateVirtualFolders()
        // Flatten virtual folders
        const flattenVirtual = (nodes: FolderNode[]): FolderNode[] => {
          const flat: FolderNode[] = []
          for (const node of nodes) {
            flat.push({ ...node, children: [] })
            if (node.children.length > 0) {
              flat.push(...flattenVirtual(node.children))
            }
          }
          return flat
        }
        result.push(...flattenVirtual(virtualFolders))
      }
      return NextResponse.json({ folders: result })
    }

    const tree = buildFolderTree(folders)

    if (includeVirtual) {
      const virtualFolders = await generateVirtualFolders()
      tree.push(...virtualFolders)
    }

    return NextResponse.json({ folders: tree })
  } catch (error) {
    console.error('Error fetching folders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    )
  }
}

// POST /api/admin/documents/folders - Create a folder
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized || !auth.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, description, parentId, color, icon } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    // Validate parent folder exists if provided
    if (parentId) {
      const parent = await prisma.documentFolder.findUnique({
        where: { id: parentId },
      })
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        )
      }
    }

    // Get next sort order for siblings
    const maxSort = await prisma.documentFolder.findFirst({
      where: { parentId: parentId || null },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const folder = await prisma.documentFolder.create({
      data: {
        name: name.trim(),
        description: description || null,
        parentId: parentId || null,
        color: color || null,
        icon: icon || null,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        createdBy: auth.userId,
      },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    )
  }
}
