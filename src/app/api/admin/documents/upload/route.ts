import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthInfo } from '@/lib/auth-helper'
import { uploadToR2, generateFileKey, isR2Configured } from '@/lib/r2'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB for documents

// POST /api/admin/documents/upload - Upload files to R2 without creating document records
// Useful for uploading files first, then creating the document record separately
export async function POST(req: NextRequest) {
  try {
    const auth = await getAdminAuthInfo(req)

    if (!auth.isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isR2Configured) {
      return NextResponse.json(
        { error: 'File storage not configured. Please set up Cloudflare R2.' },
        { status: 500 }
      )
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    // Also support single file upload with 'file' key
    const singleFile = formData.get('file') as File | null
    if (singleFile && files.length === 0) {
      files.push(singleFile)
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const results = []
    const errors = []

    for (const file of files) {
      try {
        if (file.size > MAX_FILE_SIZE) {
          errors.push({
            fileName: file.name,
            error: 'File too large. Maximum size is 50MB.',
          })
          continue
        }

        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const fileKey = generateFileKey(file.name, 'documents')
        const fileUrl = await uploadToR2(fileKey, buffer, file.type)

        results.push({
          fileUrl,
          fileKey,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })
      } catch (uploadError) {
        console.error('Error uploading file:', file.name, uploadError)
        errors.push({
          fileName: file.name,
          error: 'Failed to upload file',
        })
      }
    }

    return NextResponse.json({
      uploaded: results,
      errors: errors.length > 0 ? errors : undefined,
      totalUploaded: results.length,
      totalFailed: errors.length,
    })
  } catch (error) {
    console.error('Error in document upload:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}
