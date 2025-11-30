'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
  folder?: string
}

export default function ImageUploader({
  images,
  onChange,
  maxImages = 10,
  folder = 'products',
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError('')
    setUploading(true)

    const filesToUpload = Array.from(files).slice(0, maxImages - images.length)

    try {
      const uploadPromises = filesToUpload.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Upload failed')
        }

        const data = await res.json()
        return data.url
      })

      const newUrls = await Promise.all(uploadPromises)
      onChange([...images, ...newUrls])
    } catch (err: any) {
      setError(err.message || 'Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = (index: number) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    onChange(newImages)
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return
    }

    const newImages = [...images]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    ;[newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]]
    onChange(newImages)
  }

  return (
    <div>
      {/* Current Images */}
      {images.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '16px',
        }}>
          {images.map((url, index) => (
            <div
              key={`img-${index}`}
              style={{
                position: 'relative',
                aspectRatio: '1',
                background: '#0a0a0a',
                borderRadius: '12px',
                overflow: 'hidden',
                border: index === 0 ? '2px solid #3b82f6' : '1px solid #27272a',
              }}
            >
              {/* Use native img for base64 data URLs, Next Image for regular URLs */}
              {url.startsWith('data:') ? (
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Image
                  src={url}
                  alt={`Product image ${index + 1}`}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              )}

              {index === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  padding: '2px 8px',
                  background: '#3b82f6',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '4px',
                }}>
                  Primary
                </div>
              )}

              <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px',
              }}>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'up')}
                    style={{
                      width: '28px',
                      height: '28px',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                    }}
                    title="Move left"
                  >
                    ←
                  </button>
                )}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, 'down')}
                    style={{
                      width: '28px',
                      height: '28px',
                      background: 'rgba(0,0,0,0.7)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                    }}
                    title="Move right"
                  >
                    →
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  style={{
                    width: '28px',
                    height: '28px',
                    background: 'rgba(239, 68, 68, 0.9)',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? '#3b82f6' : '#27272a'}`,
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
            transition: 'all 0.2s',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div style={{ color: '#a1a1aa' }}>Uploading...</div>
          ) : (
            <>
              <div style={{ marginBottom: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p style={{ color: '#a1a1aa', margin: '0 0 4px 0' }}>
                Drag and drop images here, or click to browse
              </p>
              <p style={{ color: '#71717a', fontSize: '12px', margin: 0 }}>
                JPEG, PNG, WebP, or GIF (max 5MB each)
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '8px', margin: '8px 0 0 0' }}>
          {error}
        </p>
      )}

      <p style={{ color: '#71717a', fontSize: '12px', marginTop: '12px', margin: '12px 0 0 0' }}>
        {images.length} of {maxImages} images • First image will be the primary display image
      </p>
    </div>
  )
}
