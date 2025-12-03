'use client'

import { useState } from 'react'

interface ImageLightboxProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
}

export default function ImageLightbox({ src, alt, className = '', containerClassName = '' }: ImageLightboxProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`cursor-pointer ${containerClassName}`}
      >
        <img
          src={src}
          alt={alt}
          className={className}
        />
      </button>

      {/* Lightbox Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 md:p-8"
          onClick={() => setIsOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setIsOpen(false)}
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
              src={src}
              alt={alt}
              className="max-h-[85vh] max-w-full w-auto rounded-lg shadow-2xl"
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
