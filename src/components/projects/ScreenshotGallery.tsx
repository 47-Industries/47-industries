'use client'

import { useState } from 'react'

interface ProjectImage {
  url: string
  type: 'mobile' | 'desktop'
}

interface ScreenshotGalleryProps {
  images: ProjectImage[]
  projectTitle: string
}

export default function ScreenshotGallery({ images, projectTitle }: ScreenshotGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null)

  const mobileImages = images.filter(img => img.type === 'mobile')
  const desktopImages = images.filter(img => img.type === 'desktop')

  if (images.length === 0) return null

  return (
    <>
      <div className="py-12">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-xl font-bold mb-6">Screenshots</h2>

          {/* Desktop Screenshots */}
          {desktopImages.length > 0 && (
            <div className="mb-8">
              {mobileImages.length > 0 && (
                <h3 className="text-sm font-medium text-text-secondary mb-4">Desktop</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {desktopImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className="aspect-video rounded-xl overflow-hidden bg-surface hover:ring-2 hover:ring-accent/50 transition-all cursor-pointer"
                  >
                    <img
                      src={img.url}
                      alt={`${projectTitle} desktop screenshot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Screenshots */}
          {mobileImages.length > 0 && (
            <div>
              {desktopImages.length > 0 && (
                <h3 className="text-sm font-medium text-text-secondary mb-4">Mobile</h3>
              )}

              {/* Mobile: Horizontal scroll */}
              <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4">
                <div className="flex gap-3" style={{ width: 'max-content' }}>
                  {mobileImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(img)}
                      className="w-32 h-56 flex-shrink-0 rounded-lg overflow-hidden bg-surface"
                    >
                      <img
                        src={img.url}
                        alt={`${projectTitle} mobile screenshot ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop: Grid of mobile screenshots */}
              <div className="hidden md:grid grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {mobileImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className="aspect-[9/16] rounded-lg overflow-hidden bg-surface hover:ring-2 hover:ring-accent/50 transition-all cursor-pointer"
                  >
                    <img
                      src={img.url}
                      alt={`${projectTitle} mobile screenshot ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Overlay */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image container */}
          <div
            className="relative max-w-5xl max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={`${projectTitle} screenshot`}
              className={`max-h-[85vh] w-auto rounded-lg shadow-2xl ${
                selectedImage.type === 'mobile' ? 'max-w-[400px]' : 'max-w-full'
              }`}
            />
          </div>

          {/* Navigation hint */}
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
            Click outside to close
          </p>
        </div>
      )}
    </>
  )
}
