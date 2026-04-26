/**
 * ============================================================
 * ImageGallery — hero image + thumbnail grid + lightbox
 * ============================================================
 *
 * Layout (≥ md):
 *   ┌──────────────────┬──────┬──────┐
 *   │                  │      │      │
 *   │  hero (col-2)    │  #2  │  #3  │
 *   │                  ├──────┼──────┤
 *   │                  │  #4  │  #5  │
 *   └──────────────────┴──────┴──────┘
 *
 * Layout (< md):
 *   Single hero + horizontal scroll strip of thumbs.
 *
 * Click anywhere → opens Lightbox starting at that index.
 * Designed for hotel + car detail pages (8 images max shown,
 * but Lightbox sees all of them).
 * ============================================================
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Maximize2 } from 'lucide-react'
import Lightbox from './Lightbox'

interface ImageGalleryProps {
  images: string[]
  alt?: string
  /** Tailwind aspect ratio class for the hero, e.g. 'aspect-[4/3]'. */
  heroAspect?: string
}

export default function ImageGallery({
  images,
  alt = '',
  heroAspect = 'aspect-[4/3]',
}: ImageGalleryProps) {
  const [open, setOpen] = useState(false)
  const [start, setStart] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className={`${heroAspect} w-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400`}>
        ไม่มีรูปภาพ
      </div>
    )
  }

  const openAt = (i: number) => {
    setStart(i)
    setOpen(true)
  }

  // Up to 5 images in the grid; the rest are hinted by the "+N more" overlay.
  const visible = images.slice(0, 5)
  const overflow = images.length - visible.length

  return (
    <>
      {/* Mobile layout: single hero + horizontal thumb strip */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => openAt(0)}
          className={`relative ${heroAspect} w-full rounded-2xl overflow-hidden group`}
        >
          <Image
            src={images[0]}
            alt={alt || 'รูปหลัก'}
            fill
            sizes="100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-xs font-medium flex items-center gap-1.5">
            <Maximize2 size={12} />
            ดูทั้งหมด ({images.length})
          </div>
        </button>
        {images.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {images.slice(1).map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => openAt(i + 1)}
                className="flex-shrink-0 relative w-20 h-20 rounded-xl overflow-hidden"
              >
                <Image src={src} alt={alt || `รูปที่ ${i + 2}`} fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop layout: split grid */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="col-span-2 row-span-2 relative group overflow-hidden"
        >
          <Image
            src={visible[0]}
            alt={alt || 'รูปหลัก'}
            fill
            sizes="(max-width: 1024px) 50vw, 600px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </button>
        {visible.slice(1).map((src, i) => {
          const realIndex = i + 1
          const isLastVisible = realIndex === visible.length - 1 && overflow > 0
          return (
            <button
              key={`${src}-${realIndex}`}
              type="button"
              onClick={() => openAt(realIndex)}
              className="relative group overflow-hidden"
            >
              <Image
                src={src}
                alt={alt || `รูปที่ ${realIndex + 1}`}
                fill
                sizes="(max-width: 1024px) 25vw, 300px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {isLastVisible && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center text-white">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <Maximize2 size={16} />
                    +{overflow} อีก
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <Lightbox
        open={open}
        images={images}
        initialIndex={start}
        alt={alt}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
